import { Fragment, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useChatContext } from '../../contexts/ChatContext.jsx';
import { getPeer, peerLabel, peerUserId } from '../../utils/conversation.js';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const SENDER_COLORS = ['#06cf9c', '#e84e76', '#9d5cff', '#f5a623', '#3c8a99', '#d97757', '#7b64a0', '#5b8d5c'];
function senderColor(id) {
  if (!id) return SENDER_COLORS[0];
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return SENDER_COLORS[Math.abs(h) % SENDER_COLORS.length];
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function MessageTick({ status }) {
  if (status === 'failed') return <span className="msg__tick msg__tick--failed" title="Failed">✕</span>;
  if (status === 'sending') {
    return (
      <span className="msg__tick msg__tick--sending" title="Sending">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </span>
    );
  }
  if (status === 'read') {
    return (
      <span className="msg__tick msg__tick--read" title="Read">
        <svg width="18" height="11" viewBox="0 0 20 11" fill="none"><path d="M1 5.5L5 9.5L15 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 5.5L10 9.5L20 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
    );
  }
  if (status === 'delivered') {
    return (
      <span className="msg__tick msg__tick--delivered" title="Delivered">
        <svg width="18" height="11" viewBox="0 0 20 11" fill="none"><path d="M1 5.5L5 9.5L15 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 5.5L10 9.5L20 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
    );
  }
  return (
    <span className="msg__tick msg__tick--sent" title="Sent">
      <svg width="14" height="11" viewBox="0 0 16 11" fill="none"><path d="M1 5.5L5 9.5L15 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </span>
  );
}

function DateSeparator({ date }) {
  const d = new Date(date);
  const today = new Date();
  const y = new Date(today); y.setDate(y.getDate() - 1);
  let label;
  if (d.toDateString() === today.toDateString()) label = 'Today';
  else if (d.toDateString() === y.toDateString()) label = 'Yesterday';
  else label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return <li className="msg-date-sep"><span className="msg-date-sep__pill">{label}</span></li>;
}

function ReactionChips({ reactions, onClick }) {
  if (!reactions || reactions.length === 0) return null;
  const grouped = {};
  for (const r of reactions) {
    if (!r?.emoji) continue;
    grouped[r.emoji] = (grouped[r.emoji] || 0) + 1;
  }
  const entries = Object.entries(grouped);
  if (entries.length === 0) return null;
  return (
    <div className="msg__reactions">
      {entries.map(([emoji, count]) => (
        <button key={emoji} type="button" className="msg__reaction-chip" onClick={(e) => { e.stopPropagation(); onClick?.(emoji); }}>
          <span>{emoji}</span>
          {count > 1 && <span className="msg__reaction-count">{count}</span>}
        </button>
      ))}
    </div>
  );
}

function TypingIndicator() {
  return (
    <li className="msg-list__item">
      <div className="msg msg--theirs">
        <div className="typing-indicator">
          <div className="typing-indicator__bubble">
            <span className="typing-indicator__dot" />
            <span className="typing-indicator__dot" />
            <span className="typing-indicator__dot" />
          </div>
        </div>
      </div>
    </li>
  );
}

function ContextMenu({ x, y, mine, onClose, onAction }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => window.addEventListener('mousedown', handler), 0);
    return () => window.removeEventListener('mousedown', handler);
  }, [onClose]);

  const items = [
    { key: 'reply', label: 'Reply', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg> },
    { key: 'react', label: 'React', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg> },
    { key: 'copy', label: 'Copy', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> },
    { key: 'forward', label: 'Forward', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg> },
    { key: 'star', label: 'Star', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  ];
  if (mine) {
    items.push({ key: 'edit', label: 'Edit', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> });
  }
  items.push({ key: 'delete', label: 'Delete', danger: true, icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg> });

  return (
    <div ref={ref} className="msg-context-menu" style={{ top: y, left: x }}>
      <div className="msg-context-menu__emoji-row">
        {QUICK_REACTIONS.map((e) => (
          <button key={e} type="button" className="msg-context-menu__emoji" onClick={() => onAction('react', e)}>{e}</button>
        ))}
      </div>
      {items.map((it) => (
        <button key={it.key} type="button" className={`msg-context-menu__item${it.danger ? ' msg-context-menu__item--danger' : ''}`} onClick={() => onAction(it.key)}>
          {it.icon}
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

function Lightbox({ src, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="lightbox" onClick={onClose}>
      <button type="button" className="lightbox__close" onClick={onClose}>
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <img className="lightbox__img" src={src} alt="" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

export default function MessageThread({ onOpenSidebar, onOpenInfo, onStartCall }) {
  const { user } = useAuth();
  const {
    selectedConversation, messages, messageHasOlder, loading, loadOlderMessages,
    onlineUsers, typingUsers, mutedConversations, blockedUserIds,
    starredMessageIds, selectConversation,
    setReplyTo, reactToMessage, deleteMessage, starMessage, unstarMessage,
  } = useChatContext();

  const bottomRef = useRef(null);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { msg, x, y }
  const [lightbox, setLightbox] = useState(null);

  const list = selectedConversation ? messages[selectedConversation._id] || [] : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [list.length, selectedConversation?._id]);

  useEffect(() => {
    setSearchMode(false); setSearchQuery(''); setShowHeaderMenu(false); setContextMenu(null);
  }, [selectedConversation?._id]);

  if (!selectedConversation) {
    return (
      <section className="thread thread--empty">
        <div className="thread__placeholder">
          <div className="thread__placeholder-icon">
            <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h2>AuraChat</h2>
          <p>Select a chat to start messaging — end-to-end real-time, with reactions, replies, calls, and stories.</p>
        </div>
      </section>
    );
  }

  const c = selectedConversation;
  const isGroup = c.isGroup;
  const peer = !isGroup ? getPeer(c, user?.id) : null;
  const peerId = !isGroup ? peerUserId(c, user?.id) : null;
  const title = isGroup ? (c.groupName || 'Group') : peerLabel(c, user?.id);
  const isOnline = peerId ? onlineUsers?.has(peerId) : false;
  const isBlocked = peerId ? blockedUserIds?.has(peerId) : false;
  const isMuted = mutedConversations?.has(c._id);
  const avatarUrl = isGroup ? c.groupAvatar : peer?.avatarUrl;

  const typingSet = typingUsers?.[c._id];
  const typingPeers = typingSet ? [...typingSet].filter((id) => id !== String(user?.id)) : [];
  const isPeerTyping = typingPeers.length > 0;

  const normalizedSearch = String(searchQuery || '').trim().toLowerCase();
  const filteredList = normalizedSearch
    ? list.filter((m) => String(m.text || '').toLowerCase().includes(normalizedSearch))
    : list;

  const hasOlder = Boolean(messageHasOlder?.[c._id]);

  const subtitle = isGroup
    ? `${c.participants?.length || 0} participants`
    : isPeerTyping
      ? 'typing…'
      : isOnline
        ? 'online'
        : peer?.lastSeen
          ? `last seen ${formatTime(peer.lastSeen)}`
          : 'offline';

  const handleContextOpen = (e, msg) => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 240);
    const y = Math.min(e.clientY, window.innerHeight - 360);
    setContextMenu({ msg, x, y });
  };

  const handleAction = (action, payload) => {
    const m = contextMenu?.msg;
    setContextMenu(null);
    if (!m) return;
    if (action === 'reply') setReplyTo?.(m);
    else if (action === 'react') reactToMessage?.(m._id, payload);
    else if (action === 'copy') navigator.clipboard?.writeText(m.text || '');
    else if (action === 'star') {
      starredMessageIds?.has(m._id) ? unstarMessage?.(m._id) : starMessage?.(m._id);
    }
    else if (action === 'delete') {
      if (confirm('Delete this message for everyone?')) deleteMessage?.(m._id, true);
      else if (confirm('Delete for yourself?')) deleteMessage?.(m._id, false);
    }
    else if (action === 'forward') alert('Forward: coming soon');
    else if (action === 'edit') alert('Edit: tap the message in the composer to edit');
  };

  let lastDate = null;

  const pinnedMessage = list.find((m) => m.isPinned);

  return (
    <section className="thread">
      <header className="thread__header">
        <div className="thread__header-inner">
          <div className="thread__header-left">
            <button type="button" className="thread__action-btn thread__action-btn--back" onClick={onOpenSidebar} title="Back">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
            <div className="thread__peer-avatar" style={{ background: avatarUrl ? undefined : senderColor(title) }} onClick={onOpenInfo}>
              {avatarUrl ? <img src={avatarUrl} alt={title} /> : title.trim().charAt(0).toUpperCase()}
            </div>
            <div className="thread__header-info" onClick={onOpenInfo}>
              <h2 className="thread__title">{title}</h2>
              <p className={`thread__subtitle thread__subtitle--${isOnline || isPeerTyping ? 'online' : 'offline'}`}>{subtitle}</p>
            </div>
          </div>
          <div className="thread__header-actions">
            {!isGroup && (
              <>
                <button type="button" className="thread__action-btn" title="Video call" onClick={() => onStartCall?.({ type:'video', peer, conversationId: c._id })}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                </button>
                <button type="button" className="thread__action-btn" title="Voice call" onClick={() => onStartCall?.({ type:'voice', peer, conversationId: c._id })}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.64 3.41 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.79 5.79l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.28 16v.92z"/></svg>
                </button>
              </>
            )}
            <button type="button" className="thread__action-btn" title="Search" onClick={() => { setSearchMode((p) => !p); setShowHeaderMenu(false); if (searchMode) setSearchQuery(''); }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            <button type="button" className="thread__action-btn" title="More" onClick={() => { setShowHeaderMenu((p) => !p); setSearchMode(false); }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
          </div>
        </div>
        {searchMode && (
          <div className="thread__search-bar">
            <input className="thread__search-input" type="search" placeholder="Search messages..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
            {normalizedSearch && <div className="thread__search-info">{filteredList.length} found</div>}
          </div>
        )}
        {showHeaderMenu && (
          <div className="thread__menu">
            <button type="button" className="thread__menu-item" onClick={() => { onOpenInfo?.(); setShowHeaderMenu(false); }}>Contact info</button>
            <button type="button" className="thread__menu-item" onClick={() => { setSearchMode(true); setShowHeaderMenu(false); }}>Search</button>
            <button type="button" className="thread__menu-item" onClick={() => setShowHeaderMenu(false)}>Mute notifications</button>
            <button type="button" className="thread__menu-item" onClick={() => setShowHeaderMenu(false)}>Clear messages</button>
            <button type="button" className="thread__menu-item thread__menu-item--danger" onClick={() => setShowHeaderMenu(false)}>Delete chat</button>
          </div>
        )}
      </header>

      {pinnedMessage && (
        <div className="thread__pinned-banner" onClick={() => bottomRef.current?.scrollIntoView({ behavior:'smooth' })}>
          <span className="thread__pinned-icon">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
          </span>
          <div className="thread__pinned-text">
            <div className="thread__pinned-label">Pinned message</div>
            <div className="thread__pinned-preview">{pinnedMessage.text || '(media)'}</div>
          </div>
        </div>
      )}

      {isBlocked && <div className="thread__banner thread__banner--warning">You blocked this contact.</div>}

      <div className="thread__scroller">
        {hasOlder && (
          <div className="thread__pager">
            <button type="button" className="btn btn--ghost btn--sm" disabled={loading} onClick={() => loadOlderMessages(c._id)}>
              {loading ? 'Loading…' : '↑ Load older messages'}
            </button>
          </div>
        )}
        <ul className="msg-list">
          {filteredList.length === 0 && !loading && (
            <li className="msg-list__empty">{searchQuery ? `No matches for "${searchQuery}"` : 'No messages yet. Say hi 👋'}</li>
          )}
          {filteredList.map((m) => {
            const mine = String(m.senderId?._id || m.senderId) === String(user?.id);
            const dateStr = m.createdAt ? new Date(m.createdAt).toDateString() : null;
            const showSep = dateStr && dateStr !== lastDate;
            if (showSep) lastDate = dateStr;
            const key = m._id || m.clientId;
            const senderObj = typeof m.senderId === 'object' ? m.senderId : null;
            const senderId = senderObj?._id || m.senderId;
            const senderName = senderObj?.username || senderObj?.email || '';
            const isStarred = starredMessageIds?.has(m._id);
            const isDeleted = m.isDeleted;
            const reply = m.replyTo;

            return (
              <Fragment key={key}>
                {showSep && <DateSeparator date={m.createdAt} />}
                <li className="msg-list__item">
                  <div className={`msg ${mine ? 'msg--mine' : 'msg--theirs'}`}>
                    <div className="msg__outer" onContextMenu={(e) => handleContextOpen(e, m)} onDoubleClick={() => reactToMessage?.(m._id, '❤️')}>
                      <div className="msg__bubble">
                        {isGroup && !mine && senderName && (
                          <div className="msg__sender-name" style={{ color: senderColor(senderId) }}>{senderName}</div>
                        )}
                        {reply && (
                          <div className="msg__reply-quote">
                            <div className="msg__reply-quote-sender">{reply.senderName || 'Reply'}</div>
                            <div className="msg__reply-quote-text">{reply.text || '(media)'}</div>
                          </div>
                        )}
                        {m.mediaUrl && m.mediaType?.startsWith('image') && !isDeleted && (
                          <div className="msg__image-container">
                            <img className="msg__image" src={m.mediaUrl} alt="" onClick={() => setLightbox(m.mediaUrl)} />
                          </div>
                        )}
                        {m.mediaUrl && m.mediaType?.startsWith('video') && !isDeleted && (
                          <video className="msg__image" src={m.mediaUrl} controls />
                        )}
                        {m.mediaUrl && m.mediaType?.startsWith('audio') && !isDeleted && (
                          <audio src={m.mediaUrl} controls style={{ width:'100%' }} />
                        )}
                        {m.mediaUrl && !m.mediaType?.match(/^(image|video|audio)/) && !isDeleted && (
                          <a href={m.mediaUrl} download className="msg__doc">
                            <span className="msg__doc-icon">
                              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </span>
                            <div>
                              <div className="msg__doc-name">{m.mediaName || 'Document'}</div>
                              <div className="msg__doc-size">{m.mediaSize ? `${Math.round(m.mediaSize / 1024)} KB` : ''}</div>
                            </div>
                          </a>
                        )}
                        {(m.text || isDeleted) && (
                          <p className={`msg__text${isDeleted ? ' msg__text--deleted' : ''}`}>
                            {isDeleted ? '🚫 This message was deleted' : m.text}
                          </p>
                        )}
                        <div className="msg__meta">
                          {isStarred && <span title="Starred">⭐</span>}
                          {m.editedAt && <span className="msg__edited-tag">edited</span>}
                          <time className="msg__time">{formatTime(m.createdAt)}</time>
                          {mine && <MessageTick status={m.status} />}
                        </div>
                      </div>
                      <ReactionChips reactions={m.reactions} onClick={(emoji) => reactToMessage?.(m._id, emoji)} />
                    </div>
                  </div>
                </li>
              </Fragment>
            );
          })}
          {isPeerTyping && <TypingIndicator />}
        </ul>
        <div ref={bottomRef} />
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y}
          mine={String(contextMenu.msg.senderId?._id || contextMenu.msg.senderId) === String(user?.id)}
          onClose={() => setContextMenu(null)}
          onAction={handleAction}
        />
      )}

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </section>
  );
}
