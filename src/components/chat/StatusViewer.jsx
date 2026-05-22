import { useEffect, useRef, useState } from 'react';
import api from '../../services/api.js';

export default function StatusViewer({ statuses, startIndex = 0, onClose }) {
  const [current, setCurrent] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const DURATION = 5000;
  const timerRef = useRef(null);

  const status = statuses[current];
  const name = typeof status?.userId === 'object' ? (status.userId.username || status.userId.email) : 'Unknown';

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current);
        if (current < statuses.length - 1) {
          setCurrent((c) => c + 1);
        } else {
          onClose();
        }
      }
    }, 50);
    // Mark viewed
    if (status?._id || status?.id) {
      api.post(`/api/statuses/${status._id || status.id}/view`).catch(() => {});
    }
    return () => clearInterval(timerRef.current);
  }, [current]);

  if (!status) return null;

  return (
    <div className="status-viewer" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Progress bars */}
      <div className="status-viewer__progress">
        {statuses.map((_, i) => (
          <div key={i} className="status-viewer__progress-bar">
            <div
              className="status-viewer__progress-fill"
              style={{ width: i < current ? '100%' : i === current ? `${progress}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="status-viewer__header">
        <div className="status-viewer__avatar">
          {status.userId?.avatarUrl ? (
            <img src={status.userId.avatarUrl} alt="" />
          ) : (
            <div className="status-viewer__avatar-fallback">{name.charAt(0).toUpperCase()}</div>
          )}
        </div>
        <div>
          <div className="status-viewer__name">{name}</div>
          <div className="status-viewer__time">{fmtTime(status.createdAt)}</div>
        </div>
        <button type="button" className="status-viewer__close" onClick={onClose}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Content */}
      <div className="status-viewer__content"
        style={{ background: status.type === 'text' ? (status.backgroundColor || '#128C7E') : '#000' }}
      >
        {status.type === 'text' && (
          <div className="status-viewer__text-content" style={status.fontStyle === 'serif' ? { fontFamily:'Georgia,serif' } : undefined}>
            {status.text}
          </div>
        )}
        {status.type === 'image' && status.mediaUrl && (
          <img src={status.mediaUrl} alt="" className="status-viewer__image" />
        )}
      </div>

      {/* Navigation tap zones */}
      <div className="status-viewer__nav">
        <div className="status-viewer__nav-zone" onClick={() => current > 0 && setCurrent((c) => c - 1)} />
        <div className="status-viewer__nav-zone" onClick={() => { if (current < statuses.length - 1) setCurrent((c) => c + 1); else onClose(); }} />
      </div>

      {/* Reply input */}
      <div className="status-viewer__reply">
        <input className="status-viewer__reply-input" type="text" placeholder={`Reply to ${name}…`} />
      </div>
    </div>
  );
}

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' });
}
