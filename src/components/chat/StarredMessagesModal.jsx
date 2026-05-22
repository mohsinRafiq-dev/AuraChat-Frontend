import { useAuth } from '../../contexts/AuthContext.jsx';
import { useChatContext } from '../../contexts/ChatContext.jsx';
import { peerLabel } from '../../utils/conversation.js';

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' });
  return d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
}

export default function StarredMessagesModal({ onClose }) {
  const { user } = useAuth();
  const { conversations, messages, starredMessageIds, selectConversation, unstarMessage } = useChatContext();

  const starred = [];
  for (const conv of conversations) {
    const list = messages[conv._id] || [];
    for (const m of list) {
      if (starredMessageIds?.has(m._id)) {
        starred.push({ msg: m, conv });
      }
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <button type="button" className="modal__close" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <span className="modal__title">Starred messages</span>
        </div>
        <div className="modal__body p-3">
          {starred.length === 0 && (
            <div className="starred-empty">
              <svg className="starred-empty__icon" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <p>No starred messages</p>
              <p className="text-xs text-muted mt-2">Tap and hold any message to star it.</p>
            </div>
          )}
          {starred.map(({ msg, conv }) => {
            const label = peerLabel(conv, user?.id);
            const mine = String(msg.senderId?._id || msg.senderId) === String(user?.id);
            return (
              <div key={msg._id} className="starred-msg-card" onClick={() => { selectConversation(conv); onClose(); }}>
                <div className="starred-msg-card__convo">
                  {mine ? 'You' : (typeof msg.senderId === 'object' ? msg.senderId.username || msg.senderId.email : 'Them')} → {label}
                </div>
                <p className="starred-msg-card__text">{msg.text || '(media)'}</p>
                <div className="starred-msg-card__footer">
                  <span className="starred-msg-card__time">{fmtTime(msg.createdAt)}</span>
                  <button type="button" className="starred-msg-card__unstar" onClick={(e) => { e.stopPropagation(); unstarMessage?.(msg._id); }}>
                    Unstar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
