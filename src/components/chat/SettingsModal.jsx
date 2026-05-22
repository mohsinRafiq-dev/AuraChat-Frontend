import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import StarredMessagesModal from './StarredMessagesModal.jsx';
import BlockedContactsModal from './BlockedContactsModal.jsx';

const WALLPAPERS = [
  { id: 'default', label: 'Default', color: 'var(--bg)' },
  { id: 'dark', label: 'Charcoal', color: '#0e1116' },
  { id: 'teal',  label: 'Teal', color: '#0d2b30' },
  { id: 'plum',  label: 'Plum', color: '#241423' },
  { id: 'sand',  label: 'Sand', color: '#3a2f25' },
];

function loadSettings() {
  try { return JSON.parse(localStorage.getItem('aurachat-settings') || '{}'); } catch { return {}; }
}
function saveSettings(s) {
  localStorage.setItem('aurachat-settings', JSON.stringify(s));
}

export default function SettingsModal({ onClose }) {
  const { theme, toggleTheme } = useTheme();
  const [s, setS] = useState(() => ({
    notifications: true, sound: true, enterToSend: true, readReceipts: true,
    wallpaper: 'default', fontSize: 'medium', ...loadSettings(),
  }));
  const [showStarred, setShowStarred] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);

  const update = (k, v) => {
    const next = { ...s, [k]: v };
    setS(next); saveSettings(next);
    if (k === 'wallpaper') {
      const w = WALLPAPERS.find((x) => x.id === v);
      document.documentElement.style.setProperty('--bg', w?.color || 'var(--bg)');
    }
  };

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const p = await Notification.requestPermission();
      update('notifications', p === 'granted');
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <button type="button" className="modal__close" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <span className="modal__title">Settings</span>
        </div>
        <div className="modal__body" style={{ padding:'8px 0' }}>

          <Section title="Appearance">
            <Row label="Theme" value={theme === 'dark' ? 'Dark' : 'Light'} onClick={toggleTheme} />
            <Row label="Chat wallpaper">
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {WALLPAPERS.map((w) => (
                  <button key={w.id} type="button" onClick={() => update('wallpaper', w.id)} title={w.label}
                    style={{ width:28, height:28, borderRadius:'50%', background:w.color, border: s.wallpaper === w.id ? '2px solid var(--green)' : '2px solid transparent', cursor:'pointer' }}
                  />
                ))}
              </div>
            </Row>
            <Row label="Font size">
              <select value={s.fontSize} onChange={(e) => update('fontSize', e.target.value)} style={{ background:'var(--input-bg)', border:'none', color:'var(--text)', padding:'6px 10px', borderRadius:6, fontSize:'.85rem' }}>
                <option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option>
              </select>
            </Row>
          </Section>

          <Section title="Notifications">
            <Toggle label="Show desktop notifications" checked={s.notifications} onChange={() => s.notifications ? update('notifications', false) : requestNotifications()} />
            <Toggle label="Notification sounds" checked={s.sound} onChange={() => update('sound', !s.sound)} />
          </Section>

          <Section title="Chats">
            <Toggle label="Enter sends message" checked={s.enterToSend} onChange={() => update('enterToSend', !s.enterToSend)} />
            <Toggle label="Read receipts" checked={s.readReceipts} onChange={() => update('readReceipts', !s.readReceipts)} />
          </Section>

          <Section title="Privacy">
            <Row label="Starred messages" onClick={() => setShowStarred(true)} chevron />
            <Row label="Blocked contacts" onClick={() => setShowBlocked(true)} chevron />
          </Section>

          <Section title="About">
            <div style={{ padding:'10px 20px', color:'var(--text-secondary)', fontSize:'.82rem', lineHeight:1.5 }}>
              AuraChat · WhatsApp-style real-time chat<br/>
              Version 1.0.0 · 2026
            </div>
          </Section>

        </div>
      </div>

      {showStarred && <StarredMessagesModal onClose={() => setShowStarred(false)} />}
      {showBlocked && <BlockedContactsModal onClose={() => setShowBlocked(false)} />}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ borderBottom:'8px solid var(--bg)', padding:'8px 0' }}>
      <div style={{ padding:'10px 20px 6px', fontSize:'.75rem', fontWeight:700, color:'var(--green)', textTransform:'uppercase', letterSpacing:'.08em' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, onClick, chevron, children }) {
  return (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', cursor: onClick ? 'pointer' : 'default' }}>
      <span style={{ fontSize:'.9rem' }}>{label}</span>
      {value && <span style={{ fontSize:'.82rem', color:'var(--text-secondary)' }}>{value}</span>}
      {children}
      {chevron && (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color:'var(--icon)' }}><polyline points="9 18 15 12 9 6"/></svg>
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', cursor:'pointer' }}>
      <span style={{ fontSize:'.9rem' }}>{label}</span>
      <span className="toggle">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="toggle__slider" />
      </span>
    </label>
  );
}
