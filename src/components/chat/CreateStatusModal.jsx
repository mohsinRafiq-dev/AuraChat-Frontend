import { useRef, useState } from 'react';
import api from '../../services/api.js';

const BG_COLORS = ['#128C7E','#075E54','#25D366','#34B7F1','#ECE5DD','#c45654','#8e5e8e','#3c8a99','#d97757'];

export default function CreateStatusModal({ onClose, onCreated }) {
  const [type, setType] = useState('text');
  const [text, setText] = useState('');
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [imageUrl, setImageUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setImageUrl(reader.result); setType('image'); };
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (type === 'text' && !text.trim()) return;
    setSaving(true);
    try {
      const payload = { type, text, backgroundColor: bgColor, mediaUrl: imageUrl, mediaType: type === 'image' ? 'image/jpeg' : null };
      const r = await api.post('/api/statuses', payload);
      onCreated(r.data.status);
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <button type="button" className="modal__close" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <span className="modal__title">Add Status</span>
          <button type="button" className="btn btn--primary btn--sm" disabled={saving || (type==='text' && !text.trim())} onClick={handleCreate}>
            {saving ? '…' : 'Post'}
          </button>
        </div>

        <div className="create-status__type-tabs">
          {[['text','Text'],['image','Photo']].map(([k,l]) => (
            <button key={k} type="button"
              className={`create-status__type-tab${type === k ? ' create-status__type-tab--active' : ''}`}
              onClick={() => setType(k)}>{l}</button>
          ))}
        </div>

        <div className="create-status__body">
          {type === 'text' && (
            <>
              <div className="create-status__text-preview" style={{ background: bgColor }}>
                <textarea
                  className="create-status__textarea"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a status…"
                  rows={3}
                />
              </div>
              <div className="create-status__colors">
                {BG_COLORS.map((c) => (
                  <button
                    key={c} type="button"
                    className={`create-status__color${bgColor === c ? ' create-status__color--active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setBgColor(c)}
                  />
                ))}
              </div>
            </>
          )}

          {type === 'image' && (
            <>
              {imageUrl ? (
                <img src={imageUrl} alt="" className="create-status__image-preview" />
              ) : (
                <div className="create-status__image-placeholder" onClick={() => fileRef.current?.click()}>
                  <svg width="40" height="40" fill="none" stroke="var(--icon)" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span className="create-status__image-hint">Tap to add photo</span>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleImagePick} />
              {imageUrl && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setImageUrl(null); setType('text'); }}>Remove photo</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
