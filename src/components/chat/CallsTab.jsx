import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useChatContext } from '../../contexts/ChatContext.jsx';
import NewChatModal from './NewChatModal.jsx';

const AVATAR_COLORS = ['#d97757','#7b64a0','#3c8a99','#5b8d5c','#9c6644','#4a7fa5','#8e5e8e','#5c7a3e'];
function avatarColor(n) { return AVATAR_COLORS[(n || '').charCodeAt(0) % AVATAR_COLORS.length]; }

export default function CallsTab({ onStartCall }) {
  const { user } = useAuth();
  const { conversations } = useChatContext();
  const [newCallOpen, setNewCallOpen] = useState(false);

  // Mock recent calls from conversations (in real app store call history)
  const recentCalls = conversations.slice(0, 8).map((c, i) => {
    const name = c.isGroup ? (c.groupName || 'Group') : (c.peer?.username || c.peer?.email || 'Unknown');
    const types = ['incoming', 'outgoing', 'missed'];
    const callTypes = ['voice', 'video'];
    return {
      id: c._id,
      name,
      avatarUrl: c.peer?.avatarUrl || null,
      type: types[i % 3],
      callType: callTypes[i % 2],
      time: new Date(Date.now() - i * 3600000),
      conversation: c,
    };
  });

  return (
    <div className="calls-tab">
      <button type="button" className="calls-tab__new-call-btn" onClick={() => setNewCallOpen(true)}>
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.64 3.41 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.79 5.79l.96-.96a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 21.28 16v.92z"/>
          <line x1="18" y1="2" x2="18" y2="8"/><line x1="15" y1="5" x2="21" y2="5"/>
        </svg>
        New call
      </button>

      {recentCalls.length === 0 ? (
        <div className="sidebar__empty">
          <p>No recent calls.</p>
        </div>
      ) : (
        recentCalls.map((call) => (
          <div key={call.id} className="call-row">
            <div className="call-row__avatar" style={{ background: call.avatarUrl ? undefined : avatarColor(call.name) }}>
              {call.avatarUrl ? <img src={call.avatarUrl} alt={call.name} /> : call.name.charAt(0).toUpperCase()}
            </div>
            <div className="call-row__body">
              <div className="call-row__name">{call.name}</div>
              <div className={`call-row__meta${call.type === 'missed' ? ' call-row__meta--missed' : ''}`}>
                <CallDirectionIcon type={call.type} />
                {call.type === 'incoming' ? 'Incoming' : call.type === 'outgoing' ? 'Outgoing' : 'Missed'}
                <span>·</span>
                {fmtCallTime(call.time)}
              </div>
            </div>
            <button
              type="button"
              className="call-row__btn"
              title={`${call.callType === 'video' ? 'Video' : 'Voice'} call`}
              onClick={() => onStartCall?.({ type: call.callType, peer: call.conversation?.peer, conversationId: call.id })}
            >
              {call.callType === 'video' ? (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              ) : (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.64 3.41 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.79 5.79l.96-.96a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 21.28 16v.92z"/>
                </svg>
              )}
            </button>
          </div>
        ))
      )}

      {newCallOpen && <NewChatModal onClose={() => setNewCallOpen(false)} mode="call" />}
    </div>
  );
}

function CallDirectionIcon({ type }) {
  if (type === 'incoming') return (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-green">
      <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 7 17 17 17"/>
    </svg>
  );
  if (type === 'outgoing') return (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-muted">
      <line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 7 17 17 7 17"/>
    </svg>
  );
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-danger">
      <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 7 17 17 17"/>
    </svg>
  );
}

function fmtCallTime(date) {
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
