import { useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../services/api.js';

const AVATAR_COLORS = ['#d97757','#7b64a0','#3c8a99','#5b8d5c','#9c6644','#4a7fa5','#8e5e8e','#5c7a3e'];
function avatarColor(n) { return AVATAR_COLORS[(n || '').charCodeAt(0) % AVATAR_COLORS.length]; }

export default function EditProfileModal({ onClose }) {
  const { user, updateUserProfile } = useAuth();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    statusMessage: user?.statusMessage || '',
  });
  const [avatar, setAvatar] = useState(user?.avatarUrl || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const name = form.username || user?.email || 'You';
  const color = avatarColor(name);

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      await updateUserProfile({ ...form, avatarUrl: avatar });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal edit-profile-modal" style={{ maxHeight:'85vh' }}>
        <div className="modal__header">
          <button type="button" className="modal__close" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <span className="modal__title">Edit Profile</span>
          <button type="button" className="btn btn--primary btn--sm" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        <div className="modal__body" style={{ padding:24, display:'flex', flexDirection:'column', gap:18, overflowY:'auto' }}>
          {/* Avatar */}
          <div className="edit-profile__avatar-row">
            <div
              className="edit-profile__avatar"
              style={{ background: avatar ? undefined : color, width:96, height:96, borderRadius:'50%', display:'grid', placeItems:'center', fontSize:'2.5rem', fontWeight:700, color:'#fff', overflow:'hidden', cursor:'pointer', position:'relative' }}
              onClick={() => fileRef.current?.click()}
            >
              {avatar ? <img src={avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : name.charAt(0).toUpperCase()}
              <span style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.4)', display:'grid', placeItems:'center', opacity:0, transition:'opacity .2s', borderRadius:'50%', fontSize:'.75rem', fontWeight:700 }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity=1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity=0}
              >Edit</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarPick} />
            <span style={{ fontSize:'.82rem', color:'var(--text-secondary)' }}>Tap to change photo</span>
          </div>

          {error && <p className="form-error">{error}</p>}

          {[
            { key:'username', label:'Name', placeholder:'Your name' },
            { key:'statusMessage', label:'About', placeholder:"Hey there! I'm using AuraChat" },
            { key:'phone', label:'Phone', placeholder:'+1 234 567 8900' },
            { key:'bio', label:'Bio', placeholder:'Tell people about yourself' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="edit-profile__field">
              <label className="edit-profile__label">{label}</label>
              <input
                type="text"
                className="edit-profile__input"
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
