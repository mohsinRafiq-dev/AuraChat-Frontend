import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext.jsx';
import { SOCKET_EVENTS } from '../../services/socketEvents.js';

const AVATAR_COLORS = ['#d97757','#7b64a0','#3c8a99','#5b8d5c','#9c6644','#4a7fa5','#8e5e8e','#5c7a3e'];
function avatarColor(n) { return AVATAR_COLORS[(n || '').charCodeAt(0) % AVATAR_COLORS.length]; }

export default function CallOverlay({ call, onEnd }) {
  const { socket } = useSocket();
  const [status, setStatus] = useState('calling'); // calling | connected | ended
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  const peer = call.peer;
  const peerName = peer?.username || peer?.email || 'Unknown';
  const peerColor = avatarColor(peerName);

  useEffect(() => {
    // Emit call invite
    if (socket?.connected && call.conversationId) {
      socket.emit(SOCKET_EVENTS.CALL_INVITE, {
        conversationId: call.conversationId,
        type: call.type,
        to: peer?._id || peer?.id,
      });
    }

    // Simulate connection after 3s for demo
    const connectTimer = setTimeout(() => {
      setStatus('connected');
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }, 3000);

    return () => {
      clearTimeout(connectTimer);
      if (timerRef.current) clearInterval(timerRef.current);
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
      if (pcRef.current) pcRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleEnd = () => { setStatus('ended'); setTimeout(onEnd, 1500); };
    const handleReject = () => { setStatus('ended'); setTimeout(onEnd, 1500); };
    socket.on(SOCKET_EVENTS.CALL_END, handleEnd);
    socket.on(SOCKET_EVENTS.CALL_REJECT, handleReject);
    return () => {
      socket.off(SOCKET_EVENTS.CALL_END, handleEnd);
      socket.off(SOCKET_EVENTS.CALL_REJECT, handleReject);
    };
  }, [socket]);

  const handleEnd = () => {
    if (socket?.connected) socket.emit(SOCKET_EVENTS.CALL_END, { conversationId: call.conversationId, to: peer?._id || peer?.id });
    setStatus('ended');
    setTimeout(onEnd, 500);
  };

  const fmtElapsed = () => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  return (
    <div className="call-overlay">
      {call.type === 'video' && status === 'connected' ? (
        <div className="call-overlay__video-grid">
          <video ref={remoteVideoRef} className="call-overlay__video" autoPlay playsInline />
          <video ref={localVideoRef} className="call-overlay__self-video" autoPlay playsInline muted />
        </div>
      ) : (
        <div className="call-overlay__info">
          <div className="call-overlay__avatar" style={{ background: peer?.avatarUrl ? undefined : peerColor }}>
            {peer?.avatarUrl ? <img src={peer.avatarUrl} alt="" /> : peerName.charAt(0).toUpperCase()}
          </div>
          <div className="call-overlay__name">{peerName}</div>
          <div className="call-overlay__status">
            {status === 'calling' ? `${call.type === 'video' ? 'Video' : 'Voice'} calling…` : status === 'connected' ? fmtElapsed() : 'Call ended'}
          </div>
        </div>
      )}

      <div className="call-overlay__controls">
        {call.type === 'video' && (
          <button type="button" className="call-btn call-btn--video" onClick={() => setCameraOff((v) => !v)}>
            <div className="call-btn__circle">
              {cameraOff ? (
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8"/><polygon points="23 7 16 12 23 17 23 7"/></svg>
              ) : (
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              )}
            </div>
            <span className="call-btn__label">{cameraOff ? 'Camera off' : 'Camera'}</span>
          </button>
        )}
        <button type="button" className="call-btn call-btn--mute" onClick={() => setMuted((v) => !v)}>
          <div className="call-btn__circle">
            {muted ? (
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><path d="M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            ) : (
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            )}
          </div>
          <span className="call-btn__label">{muted ? 'Unmute' : 'Mute'}</span>
        </button>
        <button type="button" className="call-btn call-btn--speaker" onClick={() => setSpeakerOn((v) => !v)}>
          <div className="call-btn__circle">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          </div>
          <span className="call-btn__label">Speaker</span>
        </button>
        <button type="button" className="call-btn call-btn--end" onClick={handleEnd}>
          <div className="call-btn__circle">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.93.37 1.92.62 2.94.73a2 2 0 0 1 1.76 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.33 12 19.79 19.79 0 0 1 1.26 3.37 2 2 0 0 1 3.24 1.21l3 .01a2 2 0 0 1 2 1.72c.11 1.02.36 2.02.73 2.95a2 2 0 0 1-.45 2.11L7.25 9.27a16 16 0 0 0 3.41 4.04z"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </div>
          <span className="call-btn__label">End</span>
        </button>
      </div>
    </div>
  );
}
