import { useEffect, useRef, useState } from 'react';
import { useChatContext } from '../../contexts/ChatContext.jsx';
import api from '../../services/api.js';

const AVATAR_COLORS = ['#d97757','#7b64a0','#3c8a99','#5b8d5c','#9c6644','#4a7fa5','#8e5e8e','#5c7a3e'];
function avatarColor(n) { return AVATAR_COLORS[(n || '').charCodeAt(0) % AVATAR_COLORS.length]; }

export default function NewChatModal({ mode = 'direct', onClose, onCreated }) {
  const { startDirectChat, loadConversations, selectConversation } = useChatContext();
  const [step, setStep] = useState(mode === 'group' ? 'pick' : 'pick');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState([]); // [{id, username, email, avatarUrl}]
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const avatarRef = useRef(null);

  const isGroup = mode === 'group';

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await api.get(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
        setResults(r.data.users || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [query]);

  const toggleSelect = (u) => {
    const id = u._id || u.id;
    if (isGroup) {
      setSelected((prev) => prev.some((p) => (p._id || p.id) === id) ? prev.filter((p) => (p._id || p.id) !== id) : [...prev, u]);
    } else {
      handleDirect(u);
    }
  };

  const handleDirect = async (u) => {
    setSubmitting(true);
    setError(null);
    try {
      await startDirectChat({ participantId: u._id || u.id, participantEmail: u.email });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Could not start chat.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setGroupAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selected.length < 1) return;
    setSubmitting(true);
    setError(null);
    try {
      const participantIds = selected.map((u) => u._id || u.id);
      const r = await api.post('/api/groups', {
        name: groupName.trim(),
        participantIds,
        avatarUrl: groupAvatar,
      });
      await loadConversations();
      if (r.data.conversation) selectConversation(r.data.conversation);
      onCreated?.(r.data.conversation);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Could not create group.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <button type="button" className="modal__close" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <span className="modal__title">
            {isGroup ? (step === 'name' ? 'New group' : `Add members${selected.length ? ` · ${selected.length}` : ''}`) : 'New chat'}
          </span>
          {isGroup && step === 'pick' && selected.length > 0 && (
            <button type="button" className="btn btn--primary btn--sm" onClick={() => setStep('name')}>Next</button>
          )}
        </div>

        {isGroup && step === 'pick' && selected.length > 0 && (
          <div className="modal__selected-chips">
            {selected.map((u) => {
              const name = u.username || u.email;
              return (
                <span key={u._id || u.id} className="modal__chip">
                  {name}
                  <button type="button" className="modal__chip-remove" onClick={() => toggleSelect(u)}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {step === 'pick' && (
          <>
            <div className="modal__search">
              <span className="modal__search-icon">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input
                className="modal__search-input"
                type="text"
                placeholder="Search users by name or email…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal__body">
              {searching && <div className="modal__empty">Searching…</div>}
              {!searching && query && results.length === 0 && <div className="modal__empty">No users found for "{query}"</div>}
              {!searching && !query && <div className="modal__empty">Start typing to search for users</div>}
              {results.length > 0 && <div className="modal__section-label">Users</div>}
              {results.map((u) => {
                const id = u._id || u.id;
                const name = u.username || u.email;
                const sel = isGroup && selected.some((p) => (p._id || p.id) === id);
                return (
                  <div key={id} className={`modal__user-row${sel ? ' modal__user-row--selected' : ''}`} onClick={() => toggleSelect(u)}>
                    <div className="modal__user-avatar" style={{ background: u.avatarUrl ? undefined : avatarColor(name) }}>
                      {u.avatarUrl ? <img src={u.avatarUrl} alt="" /> : name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="modal__user-name">{name}</div>
                      {u.email && u.username && <div className="modal__user-email">{u.email}</div>}
                      {u.bio && <div className="modal__user-email">{u.bio}</div>}
                    </div>
                    {sel && (
                      <span className="modal__user-check">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                    )}
                  </div>
                );
              })}
              {error && <div className="modal__empty text-danger">{error}</div>}
            </div>
          </>
        )}

        {step === 'name' && (
          <div className="group-form-body">
            <div className="group-avatar-picker">
              <button type="button" className="group-avatar-picker__btn" onClick={() => avatarRef.current?.click()}>
                {groupAvatar ? <img src={groupAvatar} alt="" /> : (
                  <svg width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                )}
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarPick} />
              <span className="group-avatar-picker__hint">Tap to add group photo</span>
            </div>
            <input
              className="modal__group-name-input"
              type="text"
              placeholder="Group name (required)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
              maxLength={50}
            />
            <div className="group-form-body__members">
              Members: {selected.map((u) => u.username || u.email).join(', ')}
            </div>
            {error && <div className="text-danger text-sm">{error}</div>}
            <div className="group-form-body__actions">
              <button type="button" className="btn btn--ghost btn--block" onClick={() => setStep('pick')} disabled={submitting}>Back</button>
              <button type="button" className="btn btn--primary btn--block" onClick={handleCreateGroup} disabled={!groupName.trim() || submitting}>
                {submitting ? 'Creating…' : 'Create group'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
