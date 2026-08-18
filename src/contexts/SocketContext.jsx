import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { skipAuth } from '../config/flags.js';
import { useAuth } from './AuthContext.jsx';
import { SOCKET_EVENTS } from '../services/socketEvents.js';

const SocketContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export function SocketProvider({ children }) {
  const { token, user, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const [socketId, setSocketId] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    if (!token || !user) {
      setStatus('disconnected');
      setSocket(null);
      socketRef.current = null;
      return undefined;
    }

    const client = io(SOCKET_URL, {
      auth: { token },
      // Try WebSocket first, fall back to polling where upgrades are blocked.
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 8000,
      randomizationFactor: 0.35,
      autoConnect: false,
      timeout: 20000
    });

    const onConnect = () => {
      setStatus('connected');
      setSocketId(client.id);
      setReconnectAttempts(0);
      client.emit(SOCKET_EVENTS.USER_ONLINE, { userId: user.id });
    };

    const onDisconnect = (reason) => {
      setStatus(reason === 'io client disconnect' ? 'disconnected' : 'reconnecting');
      setSocketId(null);
    };

    const onConnectError = (error) => {
      console.error('Socket connect_error', error);
      const msg = String(error?.message || '').toLowerCase();
      if (msg.includes('invalid token') || msg.includes('unauthorized')) {
        setStatus('auth_error');
        if (!skipAuth) {
          logout();
        }
        return;
      }
      setStatus('reconnecting');
    };

    const onReconnectAttempt = (attempt) => {
      setReconnectAttempts(attempt);
      setStatus('reconnecting');
    };

    const onReconnectFailed = () => {
      setStatus('failed');
    };

    const onReconnect = () => {
      setStatus('connected');
      setSocketId(client.id);
    };

    const onHeartbeat = () => {
      setStatus((prev) => (prev !== 'connected' ? 'connected' : prev));
    };

    client.on('connect', onConnect);
    client.on('disconnect', onDisconnect);
    client.on('connect_error', onConnectError);
    client.on('reconnect_attempt', onReconnectAttempt);
    client.on('reconnect_failed', onReconnectFailed);
    client.on('reconnect', onReconnect);
    client.on('heartbeat', onHeartbeat);

    client.connect();
    setStatus('connecting');
    setSocket(client);
    socketRef.current = client;

    return () => {
      client.removeAllListeners();
      client.disconnect();
      setSocket(null);
      socketRef.current = null;
      setSocketId(null);
    };
  }, [token, user, logout]);

  const emit = useCallback((event, payload, ack) => {
    const s = socketRef.current;
    if (s?.connected) {
      if (typeof ack === 'function') {
        s.emit(event, payload, ack);
      } else {
        s.emit(event, payload);
      }
    } else {
      console.warn('Socket not connected; drop', event);
    }
  }, []);

  const value = useMemo(
    () => ({ socket, status, emit, socketId, reconnectAttempts }),
    [socket, status, emit, socketId, reconnectAttempts]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used inside SocketProvider');
  return context;
}
