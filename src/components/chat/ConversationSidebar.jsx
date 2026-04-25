import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useChatContext } from '../../contexts/ChatContext.jsx';
import { peerInitial, peerLabel, peerUserId } from '../../utils/conversation.js';
import NewChatModal from './NewChatModal.jsx';

export default function ConversationSidebar({ open = true, onClose, onConversationSelect }) {
  const { user, logout, updateUserProfile } = useAuth();
  const {
    conversations,
    selectedConversation,
    selectConversation,
    loading,
    error,
    onlineUsers,
    unreadCounts,
    blockedUserIds,
    mutedConversations
  } = useChatContext();
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const profileMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const label = peerLabel(c, user?.id);
    return label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalUnread = Object.values(unreadCounts || {}).reduce((sum, n) => sum + n, 0);
  const { theme, toggleTheme } = useTheme();

  const profileLabel = user?.username || user?.email || 'Your profile';
  const profileInitial = (user?.username || user?.email || 'U').charAt(0).toUpperCase();
  const profileEmail = user?.email || 'No email linked';
  const profileAvatarUrl = user?.avatarUrl || null;
  const avatarColors = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  ];
  const selectedAvatarColor = profileLabel ? avatarColors[profileLabel.charCodeAt(0) % avatarColors.length] : avatarColors[0];

  useEffect(() => {
    if (!profileMenuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  const handleAvatarUpload = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const avatarUrl = typeof reader.result === 'string' ? reader.result : null;
      if (!avatarUrl) return;
      setUploadingAvatar(true);
      try {
        await updateUserProfile({ avatarUrl });
      } catch (error) {
        console.error('Unable to update profile image', error);
      } finally {
        setUploadingAvatar(false);
        input.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside className={`sidebar${open ? ' sidebar--open' : ''}`} aria-label="Conversations">
      {/* Header */}
      <div className="sidebar__header">
        <div className="sidebar__header-top">
          <div className="sidebar__brand-group">
            <div className="sidebar__logo-icon">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <div className="sidebar__title">Messages</div>
              {totalUnread > 0 && (
                <span className="sidebar__unread-summary">{totalUnread} unread</span>
              )}
            </div>
          </div>
          <div className="sidebar__header-actions">
            <button
              type="button"
              className="sidebar__icon-btn sidebar__icon-btn--close"
              onClick={onClose}
              aria-label="Close conversations"
              title="Close conversations"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
            <button
              type="button"
              className="sidebar__icon-btn"
              onClick={() => setNewChatOpen(true)}
              aria-label="New chat"
              title="New chat"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <button
              type="button"
              className="sidebar__icon-btn sidebar__icon-btn--danger"
              onClick={logout}
              aria-label="Log out"
              title="Log out"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
        {/* Search */}
        <div className="sidebar__search">
          <svg className="sidebar__search-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="sidebar__search-input"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {newChatOpen ? <NewChatModal onClose={() => setNewChatOpen(false)} /> : null}
      {error ? <p className="sidebar__error">{error}</p> : null}

      {/* Conversation list */}
      <nav className="sidebar__list">
        {loading && conversations.length === 0 ? (
          <div className="sidebar__empty">
            <div className="sidebar__empty-spinner" />
            <p>Loading conversations…</p>
          </div>
        ) : null}
        {!loading && filteredConversations.length === 0 ? (
          <div className="sidebar__empty">
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ opacity: 0.3 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p>
              {searchQuery ? 'No results found.' : 'No conversations yet.'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => setNewChatOpen(true)}
              >
                Start a chat
              </button>
            )}
          </div>
        ) : null}
        {filteredConversations.map((c) => {
          const active = selectedConversation?._id === c._id;
          const label = peerLabel(c, user?.id);
          const initial = peerInitial(c, user?.id);
          const peerId = peerUserId(c, user?.id);
          const peerAvatarUrl = c.peer?.avatarUrl || null;
          const isOnline = peerId ? onlineUsers?.has(peerId) : false;
          const isBlocked = peerId ? blockedUserIds.has(peerId) : false;
          const isMutedRow = mutedConversations.has(c._id);
          const unread = unreadCounts?.[c._id] || 0;
          const hasUnread = !active && unread > 0;

          // Random gradient backgrounds for avatars
          const colors = [
            'linear-gradient(135deg, #667eea, #764ba2)',
            'linear-gradient(135deg, #f093fb, #f5576c)',
            'linear-gradient(135deg, #4facfe, #00f2fe)',
            'linear-gradient(135deg, #43e97b, #38f9d7)',
            'linear-gradient(135deg, #fa709a, #fee140)',
            'linear-gradient(135deg, #a18cd1, #fbc2eb)',
          ];
          const colorIdx = label.charCodeAt(0) % colors.length;

          return (
            <button
              key={c._id}
              type="button"
              className={`conv-row${active ? ' conv-row--active' : ''}${hasUnread ? ' conv-row--unread' : ''}`}
              onClick={() => {
                selectConversation(c);
                onConversationSelect?.();
              }}
            >
              <span className="conv-row__avatar-wrap" aria-hidden>
                <span className="conv-row__avatar" style={{ background: colors[colorIdx] }}>
                  {peerAvatarUrl ? (
                    <img src={peerAvatarUrl} alt={`${label} avatar`} />
                  ) : (
                    initial
                  )}
                </span>
                {isOnline && <span className="conv-row__online-dot" aria-label="Online" />}
              </span>
              <span className="conv-row__body">
                <span className="conv-row__top-line">
                  <span className="conv-row__title">{label}</span>
                  {c.lastMessage?.createdAt && (
                    <span className="conv-row__time">
                      {new Date(c.lastMessage.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </span>
                <span className="conv-row__bottom-line">
                  {c.lastMessage?.text ? (
                    <span className={`conv-row__preview${hasUnread ? ' conv-row__preview--unread' : ''}`}>
                      {c.lastMessage.text}
                    </span>
                  ) : (
                    <span className="conv-row__preview conv-row__preview--empty">No messages yet</span>
                  )}
                  {isBlocked && (
                    <span className="conv-row__status conv-row__status--blocked">Blocked</span>
                  )}
                  {!isBlocked && isMutedRow && (
                    <span className="conv-row__status conv-row__status--muted">Muted</span>
                  )}
                  {hasUnread ? (
                    <span className="conv-row__badge" aria-label={`${unread} unread messages`}>
                      {unread > 99 ? '99+' : unread}
                    </span>
                  ) : null}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar__profile-footer" ref={profileMenuRef}>
        <button
          type="button"
          className="sidebar__profile-trigger"
          aria-haspopup="menu"
          aria-expanded={profileMenuOpen}
          onClick={() => setProfileMenuOpen((open) => !open)}
          title="Open profile menu"
        >
          {profileAvatarUrl ? (
            <img
              src={profileAvatarUrl}
              alt={`${profileLabel} avatar`}
              className="sidebar__profile-trigger-img"
            />
          ) : (
            <span className="sidebar__profile-trigger-badge" style={{ background: selectedAvatarColor }}>
              {profileInitial}
            </span>
          )}
        </button>

        {profileMenuOpen ? (
          <div className="sidebar__profile-menu" role="menu">
            <div className="sidebar__profile-menu-header">
              <div className="sidebar__profile-menu-avatar" style={{ background: selectedAvatarColor }}>
                {profileAvatarUrl ? (
                  <img src={profileAvatarUrl} alt="Profile" />
                ) : (
                  profileInitial
                )}
              </div>
              <div>
                <p className="sidebar__profile-menu-name">{profileLabel}</p>
                <p className="sidebar__profile-menu-email">{profileEmail}</p>
              </div>
            </div>
            <button
              type="button"
              className="sidebar__profile-menu-item"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? 'Uploading…' : 'Change profile picture'}
            </button>
            <button
              type="button"
              className="sidebar__profile-menu-item"
              onClick={() => {
                toggleTheme();
                setProfileMenuOpen(false);
              }}
            >
              {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            </button>
            <button
              type="button"
              className="sidebar__profile-menu-item sidebar__profile-menu-item--danger"
              onClick={logout}
            >
              Log out
            </button>
          </div>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAvatarUpload}
        />
      </div>
    </aside>
  );
}
