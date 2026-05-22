import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useChatContext } from '../../contexts/ChatContext.jsx';
import { getPeer, peerUserId } from '../../utils/conversation.js';
import api from '../../services/api.js';

const AVATAR_COLORS = ['#d97757','#7b64a0','#3c8a99','#5b8d5c','#9c6644','#4a7fa5','#8e5e8e','#5c7a3e'];
function avatarColor(n) { return AVATAR_COLORS[(n || '').charCodeAt(0) % AVATAR_COLORS.length]; }

export default function ContactInfoPanel({ onClose, onStartCall }) {
  const { user } = useAuth();
  const {
    selectedConversation, messages, onlineUsers, blockedUserIds,
    mutedConversations, blockUser, unblockUser, muteConversation,
    unmuteConversation, deleteConversation, archiveConversation,
    unarchiveConversation, archivedConversations,
  } = useChatContext();

  const [showDisappearing, setShowDisappearing] = useState(false);
  const [disappearDuration, setDisappearDuration] = useState(86400);

  if (!selectedConversation) return null;

  const c = selectedConversation;
  const isGroup = c.isGroup;
  const peer = !isGroup ? getPeer(c, user?.id) : null;
  const peerId = !isGroup ? peerUserId(c, user?.id) : null;
  const isOnline = peerId ? onlineUsers?.has(peerId) : false;
  const isBlocked = peerId ? blockedUserIds?.has(peerId) : false;
  const isMuted = mutedConversations?.has(c._id);
  const isArchived = archivedConversations?.has(c._id);
  const name = isGroup ? (c.groupName || 'Group') : (peer?.username || peer?.email || 'Unknown');
  const color = avatarColor(name);
  const avatarUrl = isGroup ? c.groupAvatar : peer?.avatarUrl;

  // Media from messages
  const convoMessages = messages[c._id] || [];
  const mediaMessages = convoMessages.filter((m) => m.mediaUrl && (m.mediaType?.startsWith('image') || m.mediaType?.startsWith('video')));

  const handleSetDisappearing = async () => {
    try {
      await api.patch(`/api/conversations/${c._id}/disappearing`, {
        enabled: true, duration: disappearDuration,
      });
      setShowDisappearing(false);
    } catch {}
  };

  return (
    <div className="info-panel">
      <div className="info-panel__header">
        <button type="button" className="info-panel__close" onClick={onClose}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <span className="info-panel__title">{isGroup ? 'Group Info' : 'Contact Info'}</span>
      </div>

      {/* Avatar & name */}
      <div className="info-panel__avatar-section">
        <div className="info-panel__avatar" style={{ background: avatarUrl ? undefined : color }}>
          {avatarUrl ? <img src={avatarUrl} alt={name} /> : name.charAt(0).toUpperCase()}
        </div>
        <h2 className="info-panel__name">{name}</h2>
        {!isGroup && (
          <p className={isOnline ? 'info-panel__online' : 'info-panel__offline'}>
            {isOnline ? 'Online' : peer?.lastSeen ? `Last seen ${fmtLastSeen(peer.lastSeen)}` : 'Offline'}
          </p>
        )}
        {isGroup && (
          <p className="info-panel__offline">{c.participants?.length || 0} participants</p>
        )}
      </div>

      {/* Quick actions */}
      <div className="info-panel__actions">
        {!isGroup && (
          <>
            <button type="button" className="info-panel__action-btn" onClick={() => onStartCall?.({ type:'voice', peer, conversationId:c._id })}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.64 3.41 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.79 5.79l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.28 16v.92z"/></svg>
              Voice
            </button>
            <button type="button" className="info-panel__action-btn" onClick={() => onStartCall?.({ type:'video', peer, conversationId:c._id })}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              Video
            </button>
          </>
        )}
        <button type="button" className="info-panel__action-btn" onClick={() => isMuted ? unmuteConversation(c._id) : muteConversation(c._id)}>
          {isMuted ? (
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
          ) : (
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          )}
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
        <button type="button" className="info-panel__action-btn" onClick={() => isArchived ? unarchiveConversation?.(c._id) : archiveConversation?.(c._id)}>
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
          {isArchived ? 'Unarchive' : 'Archive'}
        </button>
      </div>

      {/* About/Bio */}
      {!isGroup && (peer?.bio || peer?.statusMessage) && (
        <div className="info-panel__section">
          <div className="info-panel__section-title">About</div>
          <p className="info-panel__bio">{peer?.statusMessage || peer?.bio}</p>
        </div>
      )}

      {/* Group description */}
      {isGroup && c.groupDescription && (
        <div className="info-panel__section">
          <div className="info-panel__section-title">Description</div>
          <p className="info-panel__bio">{c.groupDescription}</p>
        </div>
      )}

      {/* Phone */}
      {!isGroup && peer?.phone && (
        <div className="info-panel__section">
          <div className="info-panel__section-title">Phone</div>
          <p className="info-panel__phone">{peer.phone}</p>
          <p className="info-panel__label">Mobile</p>
        </div>
      )}

      {/* Media */}
      {mediaMessages.length > 0 && (
        <div className="info-panel__section">
          <div className="info-panel__section-title">Media, Links & Docs</div>
          <div className="info-panel__media-grid">
            {mediaMessages.slice(0, 6).map((m) => (
              <div key={m._id} className="info-panel__media-thumb">
                <img src={m.mediaUrl} alt="" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Group members */}
      {isGroup && (
        <div className="info-panel__section">
          <div className="info-panel__section-title">{c.participants?.length} Participants</div>
          {(c.participants || []).map((p) => {
            const pName = p.username || p.email || 'Unknown';
            const isAdmin = (c.admins || []).includes(String(p.id));
            return (
              <div key={p.id} className="info-panel__member-row">
                <div className="info-panel__member-avatar" style={{ background: p.avatarUrl ? undefined : avatarColor(pName) }}>
                  {p.avatarUrl ? <img src={p.avatarUrl} alt="" /> : pName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="info-panel__member-name">{pName}</div>
                  {isAdmin && <div className="info-panel__member-admin">Group Admin</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Settings */}
      <div className="info-panel__section">
        <div className="info-panel__setting-row cursor-pointer" onClick={() => setShowDisappearing((v) => !v)}>
          <span className="info-panel__setting-label">Disappearing messages</span>
          <span className="info-panel__setting-value">
            {c.disappearingMessages?.enabled ? `${c.disappearingMessages.duration / 3600}h` : 'Off'}
          </span>
        </div>
        {showDisappearing && (
          <div className="info-panel__disappear-options">
            {[
              [3600, '1 hour'], [86400, '24 hours'], [604800, '7 days'], [2592000, '30 days'],
            ].map(([val, label]) => (
              <label key={val} className="info-panel__disappear-option">
                <input type="radio" name="disappear" value={val} checked={disappearDuration === val} onChange={() => setDisappearDuration(val)} />
                {label}
              </label>
            ))}
            <button type="button" className="btn btn--primary btn--sm" onClick={handleSetDisappearing}>Apply</button>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="info-panel__danger-section">
        {!isGroup && peerId && (
          <button type="button" className="info-panel__danger-btn" onClick={() => isBlocked ? unblockUser(peerId) : blockUser(peerId)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            {isBlocked ? 'Unblock' : 'Block'} {peer?.username || peer?.email}
          </button>
        )}
        <button type="button" className="info-panel__danger-btn" onClick={() => { deleteConversation(c._id); onClose(); }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          Delete {isGroup ? 'group' : 'chat'}
        </button>
      </div>
    </div>
  );
}

function fmtLastSeen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' });
  return d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
}
