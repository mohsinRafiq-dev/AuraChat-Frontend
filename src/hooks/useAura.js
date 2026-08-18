import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '../contexts/SocketContext.jsx';
import { SOCKET_EVENTS } from '../services/socketEvents.js';

/**
 * Drives an Aura run over the existing socket connection.
 *
 * Deltas arrive on the same channel as messages, so the reply fills in
 * progressively rather than appearing all at once after a spinner.
 */
export function useAura(conversationId) {
  const { socket, emit } = useSocket();
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [error, setError] = useState(null);
  const runIdRef = useRef(null);

  useEffect(() => {
    if (!socket) return undefined;

    // Ignore events from a previous run or another open conversation.
    const mine = (p) => p?.runId && p.runId === runIdRef.current;

    const onStart = (p) => {
      if (!mine(p)) return;
      setText('');
      setError(null);
      setStatus('running');
    };

    const onDelta = (p) => {
      if (!mine(p)) return;
      setText((prev) => prev + (p.delta || ''));
    };

    const onDone = (p) => {
      if (!mine(p)) return;
      if (typeof p.text === 'string' && p.text.length) setText(p.text);
      setStatus('done');
    };

    const onError = (p) => {
      if (!mine(p)) return;
      setError(p.error || 'Aura could not finish that.');
      setStatus('error');
    };

    socket.on(SOCKET_EVENTS.ASSISTANT_START, onStart);
    socket.on(SOCKET_EVENTS.ASSISTANT_DELTA, onDelta);
    socket.on(SOCKET_EVENTS.ASSISTANT_DONE, onDone);
    socket.on(SOCKET_EVENTS.ASSISTANT_ERROR, onError);

    return () => {
      socket.off(SOCKET_EVENTS.ASSISTANT_START, onStart);
      socket.off(SOCKET_EVENTS.ASSISTANT_DELTA, onDelta);
      socket.off(SOCKET_EVENTS.ASSISTANT_DONE, onDone);
      socket.off(SOCKET_EVENTS.ASSISTANT_ERROR, onError);
    };
  }, [socket]);

  const run = useCallback(
    (task, question) => {
      if (!conversationId || status === 'running') return;
      const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      runIdRef.current = runId;
      setText('');
      setError(null);
      setStatus('running');
      emit(SOCKET_EVENTS.ASSISTANT_RUN, { runId, task, conversationId, question });
    },
    [conversationId, emit, status]
  );

  const reset = useCallback(() => {
    runIdRef.current = null;
    setText('');
    setError(null);
    setStatus('idle');
  }, []);

  return { run, reset, text, status, error, isRunning: status === 'running' };
}
