import { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useChatContext } from '../../contexts/ChatContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';

export default function ChatSettingsDrawer({ open, onClose, drawerRef, autoScroll, setAutoScroll, showTimestamps, setShowTimestamps }) {
  const { user, logout } = useAuth();
  const { conversations, unreadCounts, selectedConversation } = useChatContext();
  const { theme, toggleTheme } = useTheme();

  const totalUnread = useMemo(
    () => Object.values(unreadCounts || {}).reduce((sum, count) => sum + count, 0),
    [unreadCounts]
  );

  const activeChat = selectedConversation ? selectedConversation.title || 'Open chat' : 'No chat selected';
  const arrival = conversations.length > 0 ? `${conversations.length} conversations` : 'No conversations yet';

  if (!open) return null;

  return (
    <aside ref={drawerRef} className="settings-drawer" aria-label="Chat settings">
      <div className="settings-drawer__header">
        <div>
          <p className="settings-drawer__eyebrow">Profile & settings</p>
          <h2 className="settings-drawer__title">Your workspace</h2>
        </div>
        <button type="button" className="settings-drawer__close" onClick={onClose} aria-label="Close settings">
          ✕
        </button>
      </div>

      <div className="settings-drawer__profile">
        <div className="settings-drawer__avatar" aria-hidden>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Profile avatar" />
          ) : (
            (user?.username || user?.email || 'U').charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <p className="settings-drawer__name">{user?.username || user?.email || 'Guest'}</p>
          <p className="settings-drawer__subtext">{user?.email || 'No email available'}</p>
        </div>
      </div>

      <div className="settings-drawer__group">
        <div className="settings-drawer__group-header">
          <p className="settings-drawer__group-title">Quick controls</p>
          <p className="settings-drawer__group-note">Customize how your chat behaves.</p>
        </div>
        <button type="button" className="settings-drawer__option" onClick={toggleTheme}>
          <span>{theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</span>
          <span className="settings-drawer__option-badge">{theme === 'dark' ? 'Dark' : 'Light'}</span>
        </button>
        <button
          type="button"
          className="settings-drawer__option"
          onClick={() => setAutoScroll((value) => !value)}
        >
          <span>Auto-scroll new messages</span>
          <span className="settings-drawer__option-badge">{autoScroll ? 'On' : 'Off'}</span>
        </button>
        <button
          type="button"
          className="settings-drawer__option"
          onClick={() => setShowTimestamps((value) => !value)}
        >
          <span>Show message timestamps</span>
          <span className="settings-drawer__option-badge">{showTimestamps ? 'On' : 'Off'}</span>
        </button>
      </div>

      <div className="settings-drawer__group">
        <p className="settings-drawer__group-title">Activity</p>
        <div className="settings-drawer__stats">
          <div>
            <p className="settings-drawer__stat-value">{conversations.length}</p>
            <p className="settings-drawer__stat-label">Conversations</p>
          </div>
          <div>
            <p className="settings-drawer__stat-value">{totalUnread}</p>
            <p className="settings-drawer__stat-label">Unread</p>
          </div>
          <div>
            <p className="settings-drawer__stat-value">{selectedConversation ? 'Open' : 'None'}</p>
            <p className="settings-drawer__stat-label">Active chat</p>
          </div>
        </div>
      </div>

      <div className="settings-drawer__group">
        <p className="settings-drawer__group-title">About Aura Chat</p>
        <p className="settings-drawer__about-text">
          Beautiful UI, live presence, message search, and instant reactions. Keep this app open to stay connected.
        </p>
      </div>

      <button type="button" className="settings-drawer__logout" onClick={logout}>
        Log out
      </button>
    </aside>
  );
}
