import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useChatContext } from '../../contexts/ChatContext.jsx';
import { peerInitial, peerLabel, peerUserId } from '../../utils/conversation.js';
import NewChatModal from './NewChatModal.jsx';
import StatusTab from './StatusTab.jsx';
import CallsTab from './CallsTab.jsx';
import EditProfileModal from './EditProfileModal.jsx';
import SettingsModal from './SettingsModal.jsx';
import StarredMessagesModal from './StarredMessagesModal.jsx';

const AVATAR_COLORS = [
  '#d97757','#7b64a0','#3c8a99','#5b8d5c',
  '#9c6644','#4a7fa5','#8e5e8e','#5c7a3e',
];
function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function ConversationSidebar({ open, onClose, onConversationSelect, onStartCall }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    conversations, selectedConversation, selectConversation,
    loading, error, onlineUsers, unreadCounts, blockedUserIds, mutedConversations,
    archivedConversations,
  } = useChatContext();

  const [activeTab, setActiveTab] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [newChatMode, setNewChatMode] = useState(null); // 'direct' | 'group' | null
  const [showSettings, setShowSettings] = useState(false);
  const [showStarred, setShowStarred] = useState(false);
  const profileMenuRef = useRef(null);

  const profileLabel = user?.username || user?.email || 'You';
  const profileInitial = profileLabel.charAt(0).toUpperCase();
  const profileColor = avatarColor(profileLabel);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handler = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [profileMenuOpen]);

  const visibleConversations = conversations.filter((c) => {
    const isArchived = archivedConversations?.has(c._id);
    if (showArchived) return isArchived;
    return !isArchived;
  });

  const filteredConversations = visibleConversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    return peerLabel(c, user?.id).toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalUnread = Object.values(unreadCounts || {}).reduce((s, n) => s + n, 0);
  const archivedCount = conversations.filter((c) => archivedConversations?.has(c._id)).length;

  return (
    <aside className={`sidebar${open ? ' sidebar--open' : ''}`} aria-label="Conversations">

      {/* Header */}
      <div className="sidebar__header">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button
            type="button"
            className="sidebar__icon-btn sidebar__icon-btn--close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <span className="sidebar__brand">AuraChat</span>
        </div>
        <div className="sidebar__actions">
          <button
            type="button"
            className="sidebar__icon-btn"
            onClick={() => setNewChatMode('direct')}
            title="New chat"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/>
            </svg>
          </button>
          <button
            type="button"
            className="sidebar__icon-btn"
            onClick={() => setProfileMenuOpen((v) => !v)}
            aria-label="Menu"
            title="Menu"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Profile Menu */}
      {profileMenuOpen && (
        <div className="sidebar__profile-menu" ref={profileMenuRef}>
          <div className="sidebar__profile-menu-header">
            <div className="sidebar__profile-menu-avatar" style={{ background: user?.avatarUrl ? undefined : profileColor }}>
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : profileInitial}
            </div>
            <div>
              <p className="sidebar__profile-menu-name">{profileLabel}</p>
              <p className="sidebar__profile-menu-email">{user?.email}</p>
            </div>
          </div>
          <button type="button" className="sidebar__profile-menu-item" onClick={() => { setEditProfileOpen(true); setProfileMenuOpen(false); }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Edit profile
          </button>
          <button type="button" className="sidebar__profile-menu-item" onClick={() => { setShowStarred(true); setProfileMenuOpen(false); }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Starred messages
          </button>
          <button type="button" className="sidebar__profile-menu-item" onClick={() => { setShowSettings(true); setProfileMenuOpen(false); }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Settings
          </button>
          <button type="button" className="sidebar__profile-menu-item" onClick={() => { toggleTheme(); setProfileMenuOpen(false); }}>
            {theme === 'dark' ? (
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button type="button" className="sidebar__profile-menu-item sidebar__profile-menu-item--danger" onClick={logout}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Log out
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="sidebar__tabs">
        {[['chats','Chats'],['status','Status'],['calls','Calls']].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`sidebar__tab${activeTab === key ? ' sidebar__tab--active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
            {key === 'chats' && totalUnread > 0 && (
              <span style={{ marginLeft:4, background:'var(--badge)', color:'#fff', borderRadius:8, padding:'0 5px', fontSize:'.68rem', fontWeight:700 }}>
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'chats' && (
        <>
          {/* Search */}
          <div className="sidebar__search">
            <svg className="sidebar__search-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="sidebar__search-input"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {error && <p className="sidebar__error">{error}</p>}

          {/* Archived toggle */}
          {archivedCount > 0 && !searchQuery && (
            <button
              type="button"
              className="sidebar__archived-row"
              onClick={() => setShowArchived((v) => !v)}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
              </svg>
              {showArchived ? 'Back to chats' : `Archived (${archivedCount})`}
            </button>
          )}

          {/* Conversation list */}
          <nav className="sidebar__list">
            {loading && conversations.length === 0 && (
              <div className="sidebar__empty">
                <div className="spinner" />
              </div>
            )}
            {!loading && filteredConversations.length === 0 && (
              <div className="sidebar__empty">
                <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color:'var(--icon)', margin:'0 auto' }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p>{searchQuery ? 'No results found.' : 'No conversations yet.'}</p>
                {!searchQuery && (
                  <button type="button" className="btn btn--primary btn--sm" style={{ marginTop:8 }} onClick={() => setNewChatMode('direct')}>
                    Start a chat
                  </button>
                )}
              </div>
            )}
            {filteredConversations.map((c) => (
              <ConvRow
                key={c._id}
                conv={c}
                active={selectedConversation?._id === c._id}
                userId={user?.id}
                onlineUsers={onlineUsers}
                unreadCounts={unreadCounts}
                blockedUserIds={blockedUserIds}
                mutedConversations={mutedConversations}
                onClick={() => { selectConversation(c); onConversationSelect?.(); }}
              />
            ))}
          </nav>
        </>
      )}

      {activeTab === 'status' && <StatusTab />}
      {activeTab === 'calls' && <CallsTab onStartCall={onStartCall} />}

      {/* Profile trigger at bottom */}
      {activeTab === 'chats' && (
        <div className="sidebar__profile-trigger-wrapper">
          <button
            type="button"
            className="sidebar__profile-trigger"
            onClick={() => setProfileMenuOpen((v) => !v)}
            aria-label="Your profile"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="profile" className="sidebar__profile-trigger-img" />
            ) : (
              <span className="sidebar__profile-trigger-badge" style={{ background: profileColor }}>
                {profileInitial}
              </span>
            )}
          </button>
          <div style={{ display:'flex', gap:4 }}>
            <button
              type="button"
              className="sidebar__icon-btn"
              title="New group"
              onClick={() => setNewChatMode('group')}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </button>
            <button
              type="button"
              className="sidebar__icon-btn"
              title="New direct chat"
              onClick={() => setNewChatMode('direct')}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {editProfileOpen && <EditProfileModal onClose={() => setEditProfileOpen(false)} />}
      {newChatMode && <NewChatModal mode={newChatMode} onClose={() => setNewChatMode(null)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showStarred && <StarredMessagesModal onClose={() => setShowStarred(false)} />}
    </aside>
  );
}

function ConvRow({ conv, active, userId, onlineUsers, unreadCounts, blockedUserIds, mutedConversations, onClick }) {
  const label = peerLabel(conv, userId);
  const initial = peerInitial(conv, userId);
  const peerId = peerUserId(conv, userId);
  const isOnline = peerId ? onlineUsers?.has(peerId) : false;
  const isBlocked = peerId ? blockedUserIds?.has(peerId) : false;
  const isMuted = mutedConversations?.has(conv._id);
  const unread = unreadCounts?.[conv._id] || 0;
  const hasUnread = !active && unread > 0;
  const color = avatarColor(label);

  return (
    <button
      type="button"
      className={`conv-row${active ? ' conv-row--active' : ''}`}
      onClick={onClick}
    >
      <span className="conv-row__avatar-wrap">
        <span className="conv-row__avatar" style={{ background: conv.groupAvatar || (!conv.peer?.avatarUrl ? color : undefined) }}>
          {conv.peer?.avatarUrl ? <img src={conv.peer.avatarUrl} alt={label} /> : (conv.groupAvatar ? <img src={conv.groupAvatar} alt={label} /> : initial)}
        </span>
        {isOnline && !conv.isGroup && <span className="conv-row__online-dot" />}
      </span>
      <span className="conv-row__body">
        <span className="conv-row__top-line">
          <span className="conv-row__title">{label}</span>
          {conv.lastMessage?.createdAt && (
            <span className={`conv-row__time${hasUnread ? ' conv-row__time--unread' : ''}`}>
              {fmtTime(conv.lastMessage.createdAt)}
            </span>
          )}
        </span>
        <span className="conv-row__bottom-line">
          <span className={`conv-row__preview${hasUnread ? ' conv-row__preview--unread' : ''}${!conv.lastMessage?.text ? ' conv-row__preview--empty' : ''}`}>
            {conv.lastMessage?.text || 'No messages yet'}
          </span>
          {isBlocked && <span className="conv-row__status conv-row__status--blocked">Blocked</span>}
          {!isBlocked && isMuted && <span className="conv-row__status conv-row__status--muted">Muted</span>}
          {hasUnread && (
            <span className="conv-row__badge">{unread > 99 ? '99+' : unread}</span>
          )}
        </span>
      </span>
    </button>
  );
}

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000 && d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' });
  }
  if (diff < 7 * 86400000) {
    return d.toLocaleDateString(undefined, { weekday:'short' });
  }
  return d.toLocaleDateString(undefined, { month:'numeric', day:'numeric' });
}
