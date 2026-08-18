import { useEffect, useRef, useState } from 'react';
import { useAura } from '../../hooks/useAura.js';

/**
 * Aura's surface inside a conversation.
 *
 * Deliberately a sheet anchored to the thread rather than a persistent sidebar:
 * Aura is something you summon about *this* conversation, not a second app
 * living next to the chat.
 */
export default function AuraPanel({ conversationId, onClose }) {
  const { run, text, status, error, isRunning } = useAura(conversationId);
  const [question, setQuestion] = useState('');
  const inputRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Keep the newest tokens in view while streaming.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [text]);

  const askQuestion = (e) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || isRunning) return;
    run('ask', q);
    setQuestion('');
  };

  return (
    <aside className="aura" role="complementary" aria-label="Aura assistant">
      <header className="aura__header">
        <div className="aura__title">
          <span className="aura__dot" aria-hidden="true" />
          <span>Aura</span>
        </div>
        <button type="button" className="aura__close" onClick={onClose} aria-label="Close Aura">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div className="aura__actions">
        <button type="button" className="aura__chip" onClick={() => run('catchUp')} disabled={isRunning}>
          Catch me up
        </button>
        <button type="button" className="aura__chip" onClick={() => run('draft')} disabled={isRunning}>
          Draft a reply
        </button>
      </div>

      <div className="aura__body" ref={bodyRef} aria-live="polite">
        {status === 'idle' && !text && (
          <p className="aura__hint">
            Ask about this conversation, or use a shortcut above. Aura only reads the messages in
            this thread.
          </p>
        )}
        {error && <p className="aura__error">{error}</p>}
        {text && <p className="aura__text">{text}</p>}
        {isRunning && !text && <span className="aura__thinking" aria-label="Aura is working" />}
      </div>

      <form className="aura__ask" onSubmit={askQuestion}>
        <input
          ref={inputRef}
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about this chat…"
          className="aura__input"
          disabled={isRunning}
        />
        <button type="submit" className="aura__send" disabled={isRunning || !question.trim()}>
          Ask
        </button>
      </form>
    </aside>
  );
}
