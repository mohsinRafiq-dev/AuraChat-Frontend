import { useEffect, useState } from 'react';
import { useChatContext } from '../../contexts/ChatContext.jsx';
import api from '../../services/api.js';

const AVATAR_COLORS = ['#d97757','#7b64a0','#3c8a99','#5b8d5c','#9c6644','#4a7fa5','#8e5e8e','#5c7a3e'];
function avatarColor(n) { return AVATAR_COLORS[(n || '').charCodeAt(0) % AVATAR_COLORS.length]; }

export default function BlockedContactsModal({ onClose }) {
  const { unblockUser } = useChatContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.get('/api/users/blocked');
        if (!cancelled) setUsers(r.data.users || []);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleUnblock = async (u) => {
    const id = u._id || u.id;
    try {
      await api.delete(`/api/users/${id}/block`);
      unblockUser?.(id);
      setUsers((prev) => prev.filter((x) => (x._id || x.id) !== id));
    } catch {}
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <button type="button" className="modal__close" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <span className="modal__title">Blocked contacts</span>
        </div>
        <div className="modal__body">
          {loading && <div className="modal__empty">Loading…</div>}
          {!loading && users.length === 0 && (
            <div className="starred-empty">
              <svg className="starred-empty__icon" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
              <p className="text-muted">No blocked contacts</p>
            </div>
          )}
          {users.map((u) => {
            const name = u.username || u.email;
            return (
              <div key={u._id || u.id} className="modal__user-row">
                <div className="modal__user-avatar" style={{ background: u.avatarUrl ? undefined : avatarColor(name) }}>
                  {u.avatarUrl ? <img src={u.avatarUrl} alt="" /> : name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="modal__user-name">{name}</div>
                  {u.email && u.username && <div className="modal__user-email">{u.email}</div>}
                </div>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleUnblock(u)}>Unblock</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
