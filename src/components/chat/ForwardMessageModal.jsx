import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useChatContext } from '../../contexts/ChatContext.jsx';
import { peerLabel, peerInitial, getPeer } from '../../utils/conversation.js';

const AVATAR_COLORS = ['#d97757','#7b64a0','#3c8a99','#5b8d5c','#9c6644','#4a7fa5','#8e5e8e','#5c7a3e'];
function avatarColor(n) { return AVATAR_COLORS[(n || '').charCodeAt(0) % AVATAR_COLORS.length]; }

export default function ForwardMessageModal({ message, onClose }) {
  const { user } = useAuth();
  const { conversations, sendRichMessage, sendMessage } = useChatContext();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [sending, setSending] = useState(false);

  const filtered = conversations.filter((c) => {
    if (!query.trim()) return true;
    return peerLabel(c, user?.id).toLowerCase().includes(query.toLowerCase());
  });

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleForward = async () => {
    if (selected.size === 0 || !message) return;
    setSending(true);
    for (const id of selected) {
      const conv = conversations.find((c) => c._id === id);
      if (!conv) continue;
      const peer = getPeer(conv, user?.id);
      const recipientId = peer?._id ?? peer?.id;
      if (message.mediaUrl) {
        sendRichMessage?.(id, { text: message.text || '', mediaUrl: message.mediaUrl, mediaType: message.mediaType, mediaName: message.mediaName, forwarded: true }, recipientId);
      } else {
        sendMessage?.(id, message.text || '', recipientId);
      }
    }
    setSending(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <button type="button" className="modal__close" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <span className="modal__title">Forward to{selected.size > 0 ? ` · ${selected.size}` : ''}</span>
          {selected.size > 0 && (
            <button type="button" className="btn btn--primary btn--sm" disabled={sending} onClick={handleForward}>
              {sending ? 'Sending…' : 'Forward'}
            </button>
          )}
        </div>
        <div className="modal__search">
          <span className="modal__search-icon">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input className="modal__search-input" type="text" placeholder="Search chats…" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
        </div>
        <div className="modal__body">
          {filtered.length === 0 && <div className="modal__empty">No chats found</div>}
          {filtered.map((c) => {
            const label = peerLabel(c, user?.id);
            const initial = peerInitial(c, user?.id);
            const sel = selected.has(c._id);
            return (
              <div key={c._id} className={`modal__user-row${sel ? ' modal__user-row--selected' : ''}`} onClick={() => toggle(c._id)}>
                <div className="modal__user-avatar" style={{ background: c.groupAvatar || c.peer?.avatarUrl ? undefined : avatarColor(label) }}>
                  {c.peer?.avatarUrl ? <img src={c.peer.avatarUrl} alt="" /> : c.groupAvatar ? <img src={c.groupAvatar} alt="" /> : initial}
                </div>
                <div className="flex-1">
                  <div className="modal__user-name">{label}</div>
                  {c.isGroup && <div className="modal__user-email">{c.participants?.length || 0} members</div>}
                </div>
                {sel && (
                  <span className="modal__user-check">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
