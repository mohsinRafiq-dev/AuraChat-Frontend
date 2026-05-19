import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useChatContext } from '../../contexts/ChatContext.jsx';
import { useSocket } from '../../contexts/SocketContext.jsx';
import { getPeer } from '../../utils/conversation.js';
import EmojiPicker from './EmojiPicker.jsx';

export default function MessageComposer() {
  const { user } = useAuth();
  const { socket, status } = useSocket();
  const {
    selectedConversation, sendMessage, sendRichMessage, blockedUserIds,
    replyTo, setReplyTo, sendTyping,
  } = useChatContext();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const imgRef = useRef(null);
  const docRef = useRef(null);
  const recorderRef = useRef(null);
  const recordTimerRef = useRef(null);
  const typingDebounceRef = useRef(null);
  const typingActiveRef = useRef(false);
  const inputRef = useRef(null);

  const peer = getPeer(selectedConversation, user?.id);
  const peerId = peer ? String(peer._id ?? peer.id ?? peer.userId) : null;
  const blocked = peerId ? blockedUserIds.has(peerId) : false;

  useEffect(() => {
    setText(''); setShowEmoji(false); setShowAttach(false);
  }, [selectedConversation?._id]);

  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  const stopTyping = useCallback(() => {
    if (typingActiveRef.current && selectedConversation?._id) {
      sendTyping?.(selectedConversation._id, false);
      typingActiveRef.current = false;
    }
  }, [selectedConversation?._id, sendTyping]);

  useEffect(() => () => stopTyping(), [stopTyping]);

  const handleChange = (e) => {
    setText(e.target.value);
    if (!selectedConversation?._id) return;
    if (!typingActiveRef.current) {
      sendTyping?.(selectedConversation._id, true);
      typingActiveRef.current = true;
    }
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(stopTyping, 2500);
  };

  const send = useCallback(() => {
    if (!selectedConversation || !text.trim() || blocked) return;
    const recipientId = peer?._id ?? peer?.id ?? peer?.userId;
    const payload = {
      text: text.trim(),
      replyTo: replyTo ? {
        _id: replyTo._id,
        text: replyTo.text || '',
        senderName: typeof replyTo.senderId === 'object' ? (replyTo.senderId.username || replyTo.senderId.email) : 'You',
      } : undefined,
    };
    if (replyTo) {
      sendRichMessage?.(selectedConversation._id, payload, recipientId);
    } else {
      sendMessage(selectedConversation._id, text.trim(), recipientId);
    }
    setText('');
    setReplyTo?.(null);
    stopTyping();
  }, [selectedConversation, peer, text, replyTo, blocked, sendMessage, sendRichMessage, setReplyTo, stopTyping]);

  const sendMedia = (dataUrl, mediaType, mediaName, mediaSize) => {
    if (!selectedConversation) return;
    const recipientId = peer?._id ?? peer?.id ?? peer?.userId;
    sendRichMessage?.(selectedConversation._id, {
      text: text.trim() || '',
      mediaUrl: dataUrl, mediaType, mediaName, mediaSize,
    }, recipientId);
    setText(''); setShowAttach(false); setReplyTo?.(null);
  };

  const handleFile = (e, kind) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => sendMedia(reader.result, file.type || (kind === 'image' ? 'image/jpeg' : 'application/octet-stream'), file.name, file.size);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => sendMedia(reader.result, 'audio/webm', 'Voice message', blob.size);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true); setRecordTime(0);
      recordTimerRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
    } catch {
      alert('Microphone access denied');
    }
  };

  const stopRecording = (cancel = false) => {
    if (!recorderRef.current) return;
    if (cancel) {
      recorderRef.current.ondataavailable = null;
      recorderRef.current.onstop = () => recorderRef.current.stream?.getTracks().forEach((t) => t.stop());
    }
    recorderRef.current.stop();
    recorderRef.current = null;
    setRecording(false);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
  };

  if (!selectedConversation) return null;

  const fmtRec = () => {
    const m = Math.floor(recordTime / 60), s = recordTime % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const canSend = Boolean(text.trim() && socket?.connected && !blocked);

  return (
    <footer className="composer">
      {replyTo && (
        <div className="composer__reply-preview">
          <div className="composer__reply-preview-body">
            <div className="composer__reply-preview-sender">
              Replying to {typeof replyTo.senderId === 'object' ? (replyTo.senderId.username || replyTo.senderId.email) : 'message'}
            </div>
            <div className="composer__reply-preview-text">{replyTo.text || '(media)'}</div>
          </div>
          <button type="button" className="composer__reply-close" onClick={() => setReplyTo?.(null)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {recording ? (
        <div className="composer__form">
          <button type="button" className="composer__icon-btn" onClick={() => stopRecording(true)} title="Cancel recording">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          </button>
          <div className="composer__recording-indicator">
            <span className="composer__recording-dot" />
            <span className="composer__recording-time">{fmtRec()}</span>
            <span style={{ marginLeft:'auto', fontSize:'.82rem', color:'var(--text-secondary)' }}>Recording…</span>
          </div>
          <button type="button" className="composer__send" onClick={() => stopRecording(false)} title="Send voice message">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      ) : (
        <form className="composer__form" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <div className="composer__actions-left">
            <div style={{ position:'relative' }}>
              <button type="button" className="composer__icon-btn" title="Emoji" onClick={() => { setShowEmoji((p) => !p); setShowAttach(false); }}>
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </button>
              {showEmoji && <EmojiPicker onSelect={(e) => setText((t) => t + e)} onClose={() => setShowEmoji(false)} />}
            </div>
            <div style={{ position:'relative' }}>
              <button type="button" className="composer__icon-btn" title="Attach" onClick={() => { setShowAttach((p) => !p); setShowEmoji(false); }}>
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </button>
              {showAttach && (
                <div className="composer__attach-menu" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="composer__attach-item" onClick={() => imgRef.current?.click()}>
                    <span className="composer__attach-icon" style={{ background:'#bf59cf' }}>
                      <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </span>
                    <span>Photos &amp; Videos</span>
                  </button>
                  <button type="button" className="composer__attach-item" onClick={() => docRef.current?.click()}>
                    <span className="composer__attach-icon" style={{ background:'#5157ae' }}>
                      <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </span>
                    <span>Document</span>
                  </button>
                </div>
              )}
              <input ref={imgRef} type="file" accept="image/*,video/*" style={{ display:'none' }} onChange={(e) => handleFile(e, 'image')} />
              <input ref={docRef} type="file" style={{ display:'none' }} onChange={(e) => handleFile(e, 'doc')} />
            </div>
          </div>

          <div className="composer__input-wrap">
            <textarea
              ref={inputRef}
              className="composer__input"
              rows={1}
              placeholder={blocked ? 'You blocked this user.' : socket?.connected ? 'Type a message' : 'Connecting…'}
              value={text}
              onChange={handleChange}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              disabled={blocked}
            />
          </div>

          {canSend ? (
            <button className="composer__send" type="submit" aria-label="Send">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          ) : (
            <button className="composer__record" type="button" aria-label="Record voice" onClick={startRecording}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
          )}
        </form>
      )}
    </footer>
  );
}
