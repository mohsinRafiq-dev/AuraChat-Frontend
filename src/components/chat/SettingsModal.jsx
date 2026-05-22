import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import StarredMessagesModal from './StarredMessagesModal.jsx';
import BlockedContactsModal from './BlockedContactsModal.jsx';

const WALLPAPERS = [
  { id: 'default',  label: 'Default',  swatch: 'var(--bg)' },
  { id: 'charcoal', label: 'Charcoal', swatch: '#0e1116' },
  { id: 'teal',     label: 'Teal',     swatch: '#0d2b30' },
  { id: 'plum',     label: 'Plum',     swatch: '#241423' },
  { id: 'sand',     label: 'Sand',     swatch: '#3a2f25' },
];

const SETTINGS_KEY = 'aurachat-settings';
function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return {}; }
}
function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

export function applySettings() {
  const s = loadSettings();
  if (s.wallpaper) document.documentElement.setAttribute('data-wallpaper', s.wallpaper === 'default' ? '' : s.wallpaper);
  if (s.fontSize)  document.documentElement.setAttribute('data-font-size', s.fontSize);
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
    if (k === 'wallpaper') document.documentElement.setAttribute('data-wallpaper', v === 'default' ? '' : v);
    if (k === 'fontSize')  document.documentElement.setAttribute('data-font-size', v);
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) return;
    const p = await Notification.requestPermission();
    update('notifications', p === 'granted');
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
        <div className="modal__body p-0">

          <Section title="Appearance">
            <Row label="Theme" value={theme === 'dark' ? 'Dark' : 'Light'} onClick={toggleTheme} />
            <Row label="Chat wallpaper">
              <div className="settings-row__wallpaper">
                {WALLPAPERS.map((w) => (
                  <button
                    key={w.id} type="button" title={w.label}
                    onClick={() => update('wallpaper', w.id)}
                    className={`settings-row__wallpaper-swatch${s.wallpaper === w.id ? ' settings-row__wallpaper-swatch--active' : ''}`}
                    style={{ background: w.swatch }}
                  />
                ))}
              </div>
            </Row>
            <Row label="Font size">
              <select className="settings-row__select" value={s.fontSize} onChange={(e) => update('fontSize', e.target.value)}>
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
            <div className="settings-about">
              AuraChat · WhatsApp-style real-time chat<br/>
              Version 1.0.0
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
    <div className="settings-section">
      <div className="settings-section__title">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, onClick, chevron, children }) {
  return (
    <div className={`settings-row${onClick ? ' settings-row--clickable' : ''}`} onClick={onClick}>
      <span className="settings-row__label">{label}</span>
      {value && <span className="settings-row__value">{value}</span>}
      {children}
      {chevron && (
        <svg className="settings-row__chevron" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="settings-row settings-row--clickable">
      <span className="settings-row__label">{label}</span>
      <span className="toggle">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="toggle__slider" />
      </span>
    </label>
  );
}
