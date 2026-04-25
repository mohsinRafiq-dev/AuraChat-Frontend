import { useState } from 'react';
import { useChatContext } from '../../contexts/ChatContext.jsx';

export default function NewChatModal({ onClose }) {
  const { startDirectChat } = useChatContext();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Enter an email address.');
      return;
    }
    setSubmitting(true);
    try {
      await startDirectChat({ participantEmail: trimmed });
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not start chat.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="new-chat-title">
        <h2 id="new-chat-title" className="modal-card__title">
          New chat
        </h2>
        <p className="modal-card__lede">Start a direct message with someone who already has an account.</p>
        <form className="modal-card__form" onSubmit={submit}>
          <label className="field">
            <span className="sr-only">Their email</span>
            <input
              className="field__input"
              type="email"
              autoComplete="off"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="modal-card__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Starting…' : 'Open chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
