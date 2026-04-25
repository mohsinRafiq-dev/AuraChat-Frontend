import { useCallback, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useChatContext } from '../../contexts/ChatContext.jsx';
import { useSocket } from '../../contexts/SocketContext.jsx';
import { getPeer } from '../../utils/conversation.js';

export default function MessageComposer() {
  const { user } = useAuth();
  const { socket, status } = useSocket();
  const { selectedConversation, sendMessage, blockedUserIds } = useChatContext();
  const [text, setText] = useState('');
  const peer = getPeer(selectedConversation, user?.id);
  const peerId = peer ? String(peer._id ?? peer.id ?? peer.userId) : null;
  const blocked = peerId ? blockedUserIds.has(peerId) : false;

  const canSend =
    Boolean(
      selectedConversation &&
      text.trim() &&
      socket?.connected &&
      status === 'connected' &&
      !blocked
    );

  const send = useCallback(() => {
    if (!selectedConversation || !text.trim() || blocked) return;
    const peer = getPeer(selectedConversation, user?.id);
    const recipientId = peer?._id ?? peer?.id ?? peer?.userId;
    if (!recipientId) return;
    sendMessage(selectedConversation._id, text.trim(), recipientId);
    setText('');
  }, [selectedConversation, sendMessage, text, user?.id, blocked]);

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      send();
    },
    [send]
  );

  if (!selectedConversation) {
    return null;
  }

  return (
    <footer className="composer">
      <form className="composer__form" onSubmit={onSubmit}>
        <label className="composer__label" htmlFor="chat-input">
          <span className="sr-only">Message</span>
          <textarea
            id="chat-input"
            className="composer__input"
            rows={1}
            placeholder={blocked ? 'You have blocked this user.' : socket?.connected ? 'Write a message…' : 'Waiting for connection…'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={blocked}
          />
        </label>
        <button className="composer__send" type="submit" disabled={!canSend} aria-label="Send">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </footer>
  );
}
