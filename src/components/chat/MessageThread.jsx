import { Fragment, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useChatContext } from '../../contexts/ChatContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { getPeer, peerLabel, peerUserId } from '../../utils/conversation.js';

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/** WhatsApp-style tick indicator for message status */
function MessageTick({ status }) {
  if (status === 'failed') {
    return <span className="msg__tick msg__tick--failed" title="Failed">✕</span>;
  }
  if (status === 'sending') {
    return (
      <span className="msg__tick msg__tick--sending" title="Sending">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M1 5.5L5 9.5L15 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }
  if (status === 'sent') {
    return (
      <span className="msg__tick msg__tick--sent" title="Sent">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M1 5.5L5 9.5L15 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }
  if (status === 'delivered') {
    return (
      <span className="msg__tick msg__tick--delivered" title="Delivered">
        <svg width="20" height="11" viewBox="0 0 20 11" fill="none">
          <path d="M1 5.5L5 9.5L15 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 5.5L10 9.5L20 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }
  if (status === 'read') {
    return (
      <span className="msg__tick msg__tick--read" title="Read">
        <svg width="20" height="11" viewBox="0 0 20 11" fill="none">
          <path d="M1 5.5L5 9.5L15 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 5.5L10 9.5L20 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }
  // Default: single grey tick
  return (
    <span className="msg__tick msg__tick--sent" title="Sent">
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
        <path d="M1 5.5L5 9.5L15 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text, query) {
  if (!query) return text;
  const splitRegex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  const testRegex = new RegExp(`(${escapeRegExp(query)})`, 'i');
  return text.split(splitRegex).map((chunk, index) =>
    testRegex.test(chunk) ? (
      <mark key={index} className="msg__highlight">
        {chunk}
      </mark>
    ) : (
      chunk
    )
  );
}

function DateSeparator({ date }) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label;
  if (d.toDateString() === today.toDateString()) {
    label = 'Today';
  } else if (d.toDateString() === yesterday.toDateString()) {
    label = 'Yesterday';
  } else {
    label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <li className="msg-date-sep" aria-label={label}>
      <span className="msg-date-sep__pill">{label}</span>
    </li>
  );
}

export default function MessageThread() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    selectedConversation,
    messages,
    messageHasOlder,
    loading,
    loadOlderMessages,
    onlineUsers,
    deleteConversation,
    blockUser,
    unblockUser,
    muteConversation,
    unmuteConversation,
    mutedConversations,
    blockedUserIds,
    selectConversation
  } = useChatContext();
  const bottomRef = useRef(null);
  const menuRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const list = selectedConversation ? messages[selectedConversation._id] || [] : [];

  useEffect(() => {
    if (!autoScroll) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [list.length, selectedConversation?._id, autoScroll]);

  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  useEffect(() => {
    setSearchMode(false);
    setSearchQuery('');
    setShowMenu(false);
  }, [selectedConversation?._id]);

  if (!selectedConversation) {
    return (
      <section className="thread thread--empty" aria-label="Messages">
        <div className="thread__placeholder">
          <div className="thread__placeholder-icon">
            <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h2>Select a conversation</h2>
          <p>Choose someone from the sidebar to start chatting in real time.</p>
        </div>
      </section>
    );
  }

  const title = peerLabel(selectedConversation, user?.id);
  const peer = getPeer(selectedConversation, user?.id);
  const peerAvatarUrl = peer?.avatarUrl || null;
  const peerId = peerUserId(selectedConversation, user?.id);
  const isOnline = peerId ? onlineUsers?.has(peerId) : false;
  const isBlocked = peerId ? blockedUserIds.has(peerId) : false;
  const isMuted = selectedConversation ? mutedConversations.has(selectedConversation._id) : false;
  const hasOlder = Boolean(messageHasOlder?.[selectedConversation._id]);

  const normalizedSearch = String(searchQuery || '').trim().toLowerCase();
  const filteredList = normalizedSearch
    ? list.filter((m) => String(m.text || '').toLowerCase().includes(normalizedSearch))
    : list;
  const matchCount = normalizedSearch ? filteredList.length : 0;

  // Avatar gradient
  const colors = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  ];
  const colorIdx = title.charCodeAt(0) % colors.length;

  // Group messages by date for separators
  let lastDate = null;

  return (
    <section className="thread" aria-label="Messages">
      <header className="thread__header">
        <div className="thread__header-inner">
          <div className="thread__header-left">
            <button
              type="button"
              className="thread__action-btn"
              aria-label="Back to chats"
              title="Back to chats"
              onClick={() => selectConversation(null)}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="thread__peer-avatar" aria-hidden style={{ background: colors[colorIdx] }}>
              {peerAvatarUrl ? (
                <img src={peerAvatarUrl} alt={`${title} avatar`} />
              ) : (
                title.trim().charAt(0).toUpperCase()
              )}
            </div>
            <div className="thread__header-info">
              <h2 className="thread__title">{title}</h2>
              <p className={`thread__subtitle thread__subtitle--${isOnline ? 'online' : 'offline'}`}>
                <span className={`thread__presence-dot thread__presence-dot--${isOnline ? 'online' : 'offline'}`} />
                {isOnline ? 'Online now' : 'Offline'}
              </p>
            </div>
          </div>
          <div className="thread__header-actions">
            <button
              className="thread__action-btn"
              aria-label="Toggle theme"
              title="Toggle dark/light theme"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              ) : (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              )}
            </button>
            <button
              className="thread__action-btn"
              aria-label="Search"
              title="Search in chat"
              aria-pressed={searchMode}
              onClick={() => {
                setShowMenu(false);
                setSearchMode((prev) => !prev);
                if (searchMode) setSearchQuery('');
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <button
              className="thread__action-btn"
              aria-label="More options"
              title="More options"
              aria-expanded={showMenu}
              onClick={() => {
                setShowMenu((prev) => !prev);
                setSearchMode(false);
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
          </div>
        </div>
        {searchMode ? (
          <div className="thread__search-bar">
            <label className="thread__search-label" htmlFor="chat-search-input">
              <span className="sr-only">Search messages</span>
              <input
                id="chat-search-input"
                className="thread__search-input"
                type="search"
                placeholder="Search messages in this chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
            {normalizedSearch ? (
              <div className="thread__search-info">
                {matchCount} result{matchCount === 1 ? '' : 's'} found
              </div>
            ) : null}
          </div>
        ) : null}
        {showMenu ? (
          <div className="thread__menu" ref={menuRef}>
            <button
              type="button"
              className="thread__menu-item"
              onClick={() => {
                if (isBlocked) {
                  unblockUser(peerId);
                } else {
                  blockUser(peerId);
                }
                setShowMenu(false);
              }}
            >
              {isBlocked ? 'Unblock user' : 'Block user'}
            </button>
            <button
              type="button"
              className="thread__menu-item"
              onClick={() => {
                if (isMuted) {
                  unmuteConversation(selectedConversation._id);
                } else {
                  muteConversation(selectedConversation._id);
                }
                setShowMenu(false);
              }}
            >
              {isMuted ? 'Unmute chat' : 'Mute chat'}
            </button>
            <button
              type="button"
              className="thread__menu-item thread__menu-item--danger"
              onClick={() => {
                deleteConversation(selectedConversation._id);
                setShowMenu(false);
              }}
            >
              Delete chat
            </button>
          </div>
        ) : null}
      </header>
      {isBlocked ? (
        <div className="thread__banner thread__banner--warning">
          You have blocked this contact. You can still view chat history, but sending is disabled.
        </div>
      ) : isMuted ? (
        <div className="thread__banner thread__banner--muted">
          This chat is muted. New messages will not update unread badges.
        </div>
      ) : null}
      <div className="thread__scroller">
        {hasOlder ? (
          <div className="thread__pager">
            <button
              type="button"
              className="btn btn--ghost btn--sm thread__load-more"
              disabled={loading}
              onClick={() => loadOlderMessages(selectedConversation._id)}
            >
              {loading ? 'Loading…' : '↑ Load older messages'}
            </button>
          </div>
        ) : null}
        {loading && list.length === 0 ? (
          <div className="thread__loading">
            <div className="sidebar__empty-spinner" />
            <p>Loading messages…</p>
          </div>
        ) : null}
        <ul className="msg-list">
          {filteredList.length === 0 ? (
            <li className="msg-list__item msg-list__empty">
              {searchQuery ? (
                <p>No messages match "{searchQuery}".</p>
              ) : (
                <p>No messages yet. Send one to start the conversation.</p>
              )}
            </li>
          ) : (
            filteredList.map((m) => {
              const mine = String(m.senderId) === String(user?.id);
              const msgDate = m.createdAt ? new Date(m.createdAt).toDateString() : null;
              let showDateSep = false;
              if (msgDate && msgDate !== lastDate) {
                showDateSep = true;
                lastDate = msgDate;
              }
              const key = m._id || m.clientId;
              return (
                <Fragment key={key}>
                  {showDateSep && <DateSeparator date={m.createdAt} />}
                  <li className="msg-list__item">
                    <div className={`msg${mine ? ' msg--mine' : ''}`}>
                      <div className="msg__bubble">
                        <p className="msg__text">
                          {highlightText(String(m.text || ''), normalizedSearch)}
                        </p>
                        <div className="msg__meta">
                          {showTimestamps ? <time dateTime={m.createdAt}>{formatTime(m.createdAt)}</time> : null}
                          {mine ? <MessageTick status={m.status} /> : null}
                        </div>
                      </div>
                    </div>
                  </li>
                </Fragment>
              );
            })
          )}
        </ul>
        <div ref={bottomRef} />
      </div>
    </section>
  );
}
