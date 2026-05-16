import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../services/api.js';
import StatusViewer from './StatusViewer.jsx';
import CreateStatusModal from './CreateStatusModal.jsx';

const AVATAR_COLORS = ['#d97757','#7b64a0','#3c8a99','#5b8d5c','#9c6644','#4a7fa5','#8e5e8e','#5c7a3e'];
function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function StatusTab() {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState([]);
  const [viewerOpen, setViewerOpen] = useState(null); // { statuses, index }
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    api.get('/api/statuses').then((r) => setStatuses(r.data.statuses || [])).catch(() => {});
  }, []);

  const myStatuses = statuses.filter((s) => {
    const uid = typeof s.userId === 'object' ? s.userId.id : s.userId;
    return String(uid) === String(user?.id);
  });

  const grouped = statuses.reduce((acc, s) => {
    const uid = typeof s.userId === 'object' ? String(s.userId.id) : String(s.userId);
    if (uid === String(user?.id)) return acc;
    if (!acc[uid]) acc[uid] = { uid, user: s.userId, items: [] };
    acc[uid].items.push(s);
    return acc;
  }, {});
  const contacts = Object.values(grouped);

  const myName = user?.username || user?.email || 'You';
  const myColor = avatarColor(myName);

  return (
    <div className="status-tab">
      {/* My status */}
      <div className="status-tab__section-label">My status</div>
      <div
        className="status-my"
        onClick={() => myStatuses.length > 0 ? setViewerOpen({ statuses: myStatuses, index: 0 }) : setCreateOpen(true)}
      >
        <div className={`status-avatar-ring${myStatuses.length > 0 ? ' status-avatar-ring--has-status' : ' status-avatar-ring--no-status'}`}>
          <div className="status-avatar" style={{ background: user?.avatarUrl ? undefined : myColor }}>
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : myName.charAt(0).toUpperCase()}
          </div>
          {myStatuses.length === 0 && (
            <div className="status-add-btn">
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
          )}
        </div>
        <div className="status-my__body">
          <div className="status-my__name">My Status</div>
          <div className="status-my__sub">
            {myStatuses.length > 0 ? `${myStatuses.length} update${myStatuses.length > 1 ? 's' : ''}` : 'Tap to add status update'}
          </div>
        </div>
      </div>

      {/* Contacts statuses */}
      {contacts.length > 0 && (
        <>
          <div className="status-tab__section-label">Recent updates</div>
          {contacts.map((g) => {
            const name = typeof g.user === 'object' ? (g.user.username || g.user.email) : 'Unknown';
            const color = avatarColor(name);
            const avatarUrl = typeof g.user === 'object' ? g.user.avatarUrl : null;
            const latest = g.items[0];
            return (
              <div
                key={g.uid}
                className="status-contact-row"
                onClick={() => setViewerOpen({ statuses: g.items, index: 0 })}
              >
                <div className="status-avatar-ring status-avatar-ring--has-status">
                  <div className="status-avatar" style={{ background: avatarUrl ? undefined : color }}>
                    {avatarUrl ? <img src={avatarUrl} alt="" /> : name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="status-contact-row__body">
                  <div className="status-contact-row__name">{name}</div>
                  <div className="status-contact-row__time">{fmtStatusTime(latest?.createdAt)}</div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {contacts.length === 0 && myStatuses.length === 0 && (
        <div className="sidebar__empty" style={{ paddingTop: 40 }}>
          <p>No status updates yet.</p>
          <button type="button" className="btn btn--primary btn--sm" style={{ marginTop: 8 }} onClick={() => setCreateOpen(true)}>
            Add status
          </button>
        </div>
      )}

      {viewerOpen && (
        <StatusViewer
          statuses={viewerOpen.statuses}
          startIndex={viewerOpen.index}
          onClose={() => setViewerOpen(null)}
        />
      )}
      {createOpen && <CreateStatusModal onClose={() => setCreateOpen(false)} onCreated={(s) => { setStatuses((prev) => [s, ...prev]); setCreateOpen(false); }} />}
    </div>
  );
}

function fmtStatusTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
