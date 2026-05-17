import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import api from '../services/api.js';
import { SOCKET_EVENTS } from '../services/socketEvents.js';
import { createClientId } from '../lib/ids.js';
import { peerUserId } from '../utils/conversation.js';

const initialState = {
  conversations: [],
  selectedConversation: null,
  messages: {},
  messageHasOlder: {},
  onlineUsers: new Set(),
  mutedConversations: new Set(),
  blockedUserIds: new Set(),
  archivedConversations: new Set(),
  starredMessageIds: new Set(),
  unreadCounts: {},
  /** { [conversationId]: Set<userId> } — users currently typing */
  typingUsers: {},
  /** Currently selected message to reply to */
  replyTo: null,
  /** Currently selected message ID to edit */
  editingMessageId: null,
  loading: false,
  error: null
};

function messageKey(m) {
  if (m?._id) return `id:${m._id}`;
  if (m?.clientId) return `cid:${m.clientId}`;
  return null;
}

function hasMessage(list, payload) {
  const key = messageKey(payload);
  if (!key) return false;
  return list.some((m) => messageKey(m) === key);
}

function chatReducer(state, action) {
  switch (action.type) {
    case 'SET_CONVERSATIONS': {
      // Extract unread counts from the API payload and merge into state
      const counts = {};
      for (const c of action.payload) {
        if (c.unreadCount > 0) counts[c._id] = c.unreadCount;
      }
      return { ...state, conversations: action.payload, unreadCounts: { ...state.unreadCounts, ...counts } };
    }
    case 'SELECT_CONVERSATION':
      return { ...state, selectedConversation: action.payload };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.conversationId]: action.payload
        },
        messageHasOlder: {
          ...state.messageHasOlder,
          [action.conversationId]: Boolean(action.hasMore)
        }
      };
    case 'PREPEND_MESSAGES': {
      const existing = state.messages[action.conversationId] || [];
      const seen = new Set(
        existing
          .map((m) => (m._id != null ? String(m._id) : m.clientId ? `cid:${m.clientId}` : null))
          .filter(Boolean)
      );
      const older = (action.payload || []).filter((m) => {
        const id = m._id ? String(m._id) : m.clientId ? `cid:${m.clientId}` : null;
        return id && !seen.has(id);
      });
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.conversationId]: [...older, ...existing]
        },
        messageHasOlder: {
          ...state.messageHasOlder,
          [action.conversationId]: Boolean(action.hasMore)
        }
      };
    }
    case 'APPEND_MESSAGE': {
      const items = state.messages[action.conversationId] || [];
      if (hasMessage(items, action.payload)) return state;
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.conversationId]: [...items, action.payload]
        }
      };
    }
    case 'ACK_MESSAGE': {
      const items = state.messages[action.conversationId] || [];
      const idx = items.findIndex((m) => m.clientId === action.clientId);
      if (idx === -1) return state;
      const next = [...items];
      next[idx] = {
        ...items[idx],
        ...action.serverMessage,
        clientId: action.clientId,
        // Use server's actual status (sent if recipient offline, delivered if online)
        status: action.serverMessage?.status || 'sent'
      };
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.conversationId]: next
        }
      };
    }
    case 'MESSAGE_SEND_FAILED': {
      const items = state.messages[action.conversationId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.conversationId]: items.map((m) =>
            m.clientId === action.clientId ? { ...m, status: 'failed' } : m
          )
        }
      };
    }
    case 'UPDATE_STATUS': {
      const items = state.messages[action.conversationId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.conversationId]: items.map((message) => {
            // Support both single messageId and array of messageIds
            const match = action.messageIds
              ? action.messageIds.includes(message._id)
              : message._id === action.messageId;
            return match ? { ...message, status: action.status } : message;
          })
        }
      };
    }
    case 'USER_CAME_ONLINE': {
      const next = new Set(state.onlineUsers);
      next.add(String(action.userId));
      return { ...state, onlineUsers: next };
    }
    case 'USER_WENT_OFFLINE': {
      const next = new Set(state.onlineUsers);
      next.delete(String(action.userId));
      return { ...state, onlineUsers: next };
    }
    case 'SET_ONLINE_USERS':
      return { ...state, onlineUsers: new Set(action.payload.map(String)) };
    case 'INCREMENT_UNREAD': {
      if (state.mutedConversations.has(action.conversationId)) return state;
      const prev = state.unreadCounts[action.conversationId] || 0;
      return {
        ...state,
        unreadCounts: { ...state.unreadCounts, [action.conversationId]: prev + 1 }
      };
    }
    case 'CLEAR_UNREAD':
      return {
        ...state,
        unreadCounts: { ...state.unreadCounts, [action.conversationId]: 0 }
      };
    case 'MUTE_CONVERSATION': {
      const next = new Set(state.mutedConversations);
      next.add(action.conversationId);
      return { ...state, mutedConversations: next, unreadCounts: { ...state.unreadCounts, [action.conversationId]: 0 } };
    }
    case 'UNMUTE_CONVERSATION': {
      const next = new Set(state.mutedConversations);
      next.delete(action.conversationId);
      return { ...state, mutedConversations: next };
    }
    case 'BLOCK_USER': {
      const next = new Set(state.blockedUserIds);
      next.add(String(action.userId));
      return { ...state, blockedUserIds: next };
    }
    case 'UNBLOCK_USER': {
      const next = new Set(state.blockedUserIds);
      next.delete(String(action.userId));
      return { ...state, blockedUserIds: next };
    }
    case 'UPDATE_MESSAGE': {
      const items = state.messages[action.conversationId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.conversationId]: items.map((m) =>
            m._id === action.payload._id ? { ...m, ...action.payload } : m
          )
        }
      };
    }
    case 'REMOVE_MESSAGE': {
      const items = state.messages[action.conversationId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.conversationId]: items.map((m) =>
            m._id === action.messageId ? { ...m, isDeleted: true, text: 'This message was deleted' } : m
          )
        }
      };
    }
    case 'ARCHIVE_CONVERSATION': {
      const next = new Set(state.archivedConversations);
      next.add(action.conversationId);
      return { ...state, archivedConversations: next };
    }
    case 'UNARCHIVE_CONVERSATION': {
      const next = new Set(state.archivedConversations);
      next.delete(action.conversationId);
      return { ...state, archivedConversations: next };
    }
    case 'STAR_MESSAGE': {
      const next = new Set(state.starredMessageIds);
      next.add(action.messageId);
      return { ...state, starredMessageIds: next };
    }
    case 'UNSTAR_MESSAGE': {
      const next = new Set(state.starredMessageIds);
      next.delete(action.messageId);
      return { ...state, starredMessageIds: next };
    }
    case 'SET_REPLY_TO':
      return { ...state, replyTo: action.payload };
    case 'SET_EDITING':
      return { ...state, editingMessageId: action.payload };
    case 'TYPING_START': {
      const cur = state.typingUsers[action.conversationId] || new Set();
      const next = new Set(cur);
      next.add(String(action.userId));
      return { ...state, typingUsers: { ...state.typingUsers, [action.conversationId]: next } };
    }
    case 'TYPING_STOP': {
      const cur = state.typingUsers[action.conversationId];
      if (!cur) return state;
      const next = new Set(cur);
      next.delete(String(action.userId));
      return { ...state, typingUsers: { ...state.typingUsers, [action.conversationId]: next } };
    }
    case 'DELETE_CONVERSATION': {
      const nextConversations = state.conversations.filter((c) => c._id !== action.conversationId);
      const nextMessages = { ...state.messages };
      delete nextMessages[action.conversationId];
      const nextUnread = { ...state.unreadCounts };
      delete nextUnread[action.conversationId];
      return {
        ...state,
        conversations: nextConversations,
        messages: nextMessages,
        unreadCounts: nextUnread,
        selectedConversation:
          state.selectedConversation?._id === action.conversationId ? null : state.selectedConversation
      };
    }
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export function useChat(socket, user) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const selectedRef = useRef(state.selectedConversation);
  const messagesRef = useRef(state.messages);
  const hasOlderRef = useRef(state.messageHasOlder);

  useEffect(() => {
    selectedRef.current = state.selectedConversation;
  }, [state.selectedConversation]);

  useEffect(() => {
    messagesRef.current = state.messages;
    hasOlderRef.current = state.messageHasOlder;
  }, [state.messages, state.messageHasOlder]);

  const loadConversations = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await api.get('/api/conversations');
      dispatch({ type: 'SET_CONVERSATIONS', payload: response.data.conversations });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Unable to load conversations.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadMessages = useCallback(async (conversationId, opts = {}) => {
    if (!conversationId) return;
    const { before } = opts;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (before) params.set('before', before);
      const response = await api.get(`/api/messages/${conversationId}?${params.toString()}`);
      dispatch({
        type: 'SET_MESSAGES',
        payload: response.data.messages,
        conversationId,
        hasMore: response.data.hasMore
      });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Unable to load messages.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadOlderMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    const list = messagesRef.current[conversationId] || [];
    if (!hasOlderRef.current[conversationId]) return;
    const first = list[0];
    if (!first?._id) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const params = new URLSearchParams({ limit: '50', before: String(first._id) });
      const response = await api.get(`/api/messages/${conversationId}?${params.toString()}`);
      dispatch({
        type: 'PREPEND_MESSAGES',
        conversationId,
        payload: response.data.messages,
        hasMore: response.data.hasMore
      });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Unable to load older messages.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const selectConversation = useCallback(
    (conversation) => {
      dispatch({ type: 'SELECT_CONVERSATION', payload: conversation });
      if (conversation) {
        loadMessages(conversation._id);
        // Clear unread badge for this conversation
        dispatch({ type: 'CLEAR_UNREAD', conversationId: conversation._id });
        // Tell the backend we've read all messages in this conversation
        if (socket?.connected) {
          socket.emit(SOCKET_EVENTS.MARK_READ, { conversationId: conversation._id });
        }
      }
    },
    [loadMessages, socket]
  );

  const startDirectChat = useCallback(
    async ({ participantEmail, participantId }) => {
      const body =
        participantEmail != null && String(participantEmail).trim() !== ''
          ? { participantEmail: String(participantEmail).trim().toLowerCase() }
          : { participantId };
      const { data } = await api.post('/api/conversations', body);
      await loadConversations();
      selectConversation(data.conversation);
      if (socket?.connected) {
        socket.emit(SOCKET_EVENTS.SYNC_CONVERSATIONS);
      }
      return data.conversation;
    },
    [loadConversations, selectConversation, socket]
  );

  const sendMessage = useCallback(
    (conversationId, content, recipientId) => {
      if (!socket?.connected || !user?.id) return;
      const clientId = createClientId();
      const optimistic = {
        clientId,
        conversationId,
        recipientId,
        text: content,
        senderId: user.id,
        createdAt: new Date().toISOString(),
        status: 'sending'
      };

      socket.emit(SOCKET_EVENTS.SEND_MESSAGE, optimistic, (ack) => {
        if (ack?.success && ack.message) {
          dispatch({
            type: 'ACK_MESSAGE',
            conversationId,
            clientId,
            serverMessage: ack.message
          });
        } else if (ack?.success) {
          dispatch({
            type: 'ACK_MESSAGE',
            conversationId,
            clientId,
            serverMessage: { ...optimistic, _id: ack.messageId }
          });
        } else if (ack?.code === 429) {
          dispatch({ type: 'MESSAGE_SEND_FAILED', conversationId, clientId });
        } else {
          dispatch({ type: 'MESSAGE_SEND_FAILED', conversationId, clientId });
        }
      });

      dispatch({ type: 'APPEND_MESSAGE', conversationId, payload: optimistic });
    },
    [socket, user]
  );

  const muteConversation = useCallback((conversationId) => {
    if (!conversationId) return;
    dispatch({ type: 'MUTE_CONVERSATION', conversationId });
  }, []);

  const unmuteConversation = useCallback((conversationId) => {
    if (!conversationId) return;
    dispatch({ type: 'UNMUTE_CONVERSATION', conversationId });
  }, []);

  const blockUser = useCallback((userId) => {
    if (!userId) return;
    dispatch({ type: 'BLOCK_USER', userId });
  }, []);

  const unblockUser = useCallback((userId) => {
    if (!userId) return;
    dispatch({ type: 'UNBLOCK_USER', userId });
  }, []);

  const archiveConversation = useCallback(async (conversationId) => {
    if (!conversationId) return;
    dispatch({ type: 'ARCHIVE_CONVERSATION', conversationId });
    try { await api.post(`/api/conversations/${conversationId}/archive`); } catch {}
  }, []);

  const unarchiveConversation = useCallback(async (conversationId) => {
    if (!conversationId) return;
    dispatch({ type: 'UNARCHIVE_CONVERSATION', conversationId });
    try { await api.delete(`/api/conversations/${conversationId}/archive`); } catch {}
  }, []);

  const setReplyTo = useCallback((message) => {
    dispatch({ type: 'SET_REPLY_TO', payload: message });
  }, []);

  const setEditing = useCallback((messageId) => {
    dispatch({ type: 'SET_EDITING', payload: messageId });
  }, []);

  const starMessage = useCallback((messageId) => {
    dispatch({ type: 'STAR_MESSAGE', messageId });
  }, []);

  const unstarMessage = useCallback((messageId) => {
    dispatch({ type: 'UNSTAR_MESSAGE', messageId });
  }, []);

  const editMessage = useCallback((messageId, text) => {
    if (!socket?.connected || !messageId || !text?.trim()) return;
    socket.emit(SOCKET_EVENTS.EDIT_MESSAGE, { messageId, text: text.trim() });
  }, [socket]);

  const deleteMessage = useCallback((messageId, forEveryone = false) => {
    if (!socket?.connected || !messageId) return;
    socket.emit(SOCKET_EVENTS.DELETE_MESSAGE, { messageId, forEveryone });
  }, [socket]);

  const reactToMessage = useCallback((messageId, emoji) => {
    if (!socket?.connected || !messageId) return;
    socket.emit(SOCKET_EVENTS.REACT_MESSAGE, { messageId, emoji });
  }, [socket]);

  const sendTyping = useCallback((conversationId, isTyping) => {
    if (!socket?.connected || !conversationId) return;
    socket.emit(isTyping ? SOCKET_EVENTS.TYPING_START : SOCKET_EVENTS.TYPING_STOP, { conversationId });
  }, [socket]);

  const sendRichMessage = useCallback(
    (conversationId, payload, recipientId) => {
      if (!socket?.connected || !user?.id) return;
      const clientId = createClientId();
      const optimistic = {
        clientId,
        conversationId,
        recipientId,
        senderId: user.id,
        createdAt: new Date().toISOString(),
        status: 'sending',
        ...payload,
      };

      socket.emit(SOCKET_EVENTS.SEND_MESSAGE, optimistic, (ack) => {
        if (ack?.success && ack.message) {
          dispatch({ type: 'ACK_MESSAGE', conversationId, clientId, serverMessage: ack.message });
        } else if (ack?.success) {
          dispatch({ type: 'ACK_MESSAGE', conversationId, clientId, serverMessage: { ...optimistic, _id: ack.messageId } });
        } else {
          dispatch({ type: 'MESSAGE_SEND_FAILED', conversationId, clientId });
        }
      });

      dispatch({ type: 'APPEND_MESSAGE', conversationId, payload: optimistic });
    },
    [socket, user]
  );

  const deleteConversation = useCallback(async (conversationId) => {
    if (!conversationId) return;
    try {
      await api.delete(`/api/conversations/${conversationId}`);
      dispatch({ type: 'DELETE_CONVERSATION', conversationId });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Unable to delete this conversation.' });
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (message) => {
      dispatch({ type: 'APPEND_MESSAGE', conversationId: message.conversationId, payload: message });
      // If this conversation is NOT currently open, increment unread badge
      if (selectedRef.current?._id !== message.conversationId) {
        dispatch({ type: 'INCREMENT_UNREAD', conversationId: message.conversationId });
      } else if (socket?.connected) {
        // Conversation is open — mark as read immediately
        socket.emit(SOCKET_EVENTS.MARK_READ, { conversationId: message.conversationId });
      }
    };

    const handleDelivered = ({ conversationId, messageId, status }) => {
      dispatch({ type: 'UPDATE_STATUS', conversationId, messageId, status: status || 'delivered' });
    };

    const handleRead = ({ conversationId, messageIds }) => {
      dispatch({ type: 'UPDATE_STATUS', conversationId, messageIds, status: 'read' });
    };

    const refreshAfterReconnect = () => {
      loadConversations();
      const current = selectedRef.current;
      if (current?._id) {
        loadMessages(current._id);
      }
    };

    const handleUserOnline = ({ userId }) => {
      dispatch({ type: 'USER_CAME_ONLINE', userId });
    };

    const handleUserOffline = ({ userId }) => {
      dispatch({ type: 'USER_WENT_OFFLINE', userId });
    };

    const handlePresenceSnapshot = ({ onlineUserIds }) => {
      dispatch({ type: 'SET_ONLINE_USERS', payload: onlineUserIds });
    };

    const handleMessageEdited = (message) => {
      dispatch({ type: 'UPDATE_MESSAGE', conversationId: message.conversationId, payload: message });
    };

    const handleMessageDeleted = (message) => {
      dispatch({ type: 'REMOVE_MESSAGE', conversationId: message.conversationId, messageId: message._id });
    };

    const handleMessageReacted = (message) => {
      dispatch({ type: 'UPDATE_MESSAGE', conversationId: message.conversationId, payload: message });
    };

    const handleTypingStart = ({ conversationId, userId }) => {
      if (!conversationId || !userId) return;
      dispatch({ type: 'TYPING_START', conversationId, userId });
    };

    const handleTypingStop = ({ conversationId, userId }) => {
      if (!conversationId || !userId) return;
      dispatch({ type: 'TYPING_STOP', conversationId, userId });
    };

    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, handleIncoming);
    socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, handleDelivered);
    socket.on(SOCKET_EVENTS.MESSAGE_READ, handleRead);
    socket.on(SOCKET_EVENTS.USER_ONLINE, handleUserOnline);
    socket.on(SOCKET_EVENTS.USER_OFFLINE, handleUserOffline);
    socket.on(SOCKET_EVENTS.USER_PRESENCE_SNAPSHOT, handlePresenceSnapshot);
    socket.on(SOCKET_EVENTS.MESSAGE_EDITED, handleMessageEdited);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
    socket.on(SOCKET_EVENTS.MESSAGE_REACTED, handleMessageReacted);
    socket.on(SOCKET_EVENTS.TYPING_START, handleTypingStart);
    socket.on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
    socket.io.on('reconnect', refreshAfterReconnect);

    return () => {
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, handleIncoming);
      socket.off(SOCKET_EVENTS.MESSAGE_DELIVERED, handleDelivered);
      socket.off(SOCKET_EVENTS.MESSAGE_READ, handleRead);
      socket.off(SOCKET_EVENTS.USER_ONLINE, handleUserOnline);
      socket.off(SOCKET_EVENTS.USER_OFFLINE, handleUserOffline);
      socket.off(SOCKET_EVENTS.USER_PRESENCE_SNAPSHOT, handlePresenceSnapshot);
      socket.off(SOCKET_EVENTS.MESSAGE_EDITED, handleMessageEdited);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
      socket.off(SOCKET_EVENTS.MESSAGE_REACTED, handleMessageReacted);
      socket.off(SOCKET_EVENTS.TYPING_START, handleTypingStart);
      socket.off(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
      socket.io.off('reconnect', refreshAfterReconnect);
    };
  }, [socket, loadConversations, loadMessages]);

  return useMemo(
    () => ({
      ...state,
      loadConversations,
      selectConversation,
      loadMessages,
      loadOlderMessages,
      sendMessage,
      sendRichMessage,
      startDirectChat,
      deleteConversation,
      blockUser,
      unblockUser,
      muteConversation,
      unmuteConversation,
      archiveConversation,
      unarchiveConversation,
      setReplyTo,
      setEditing,
      starMessage,
      unstarMessage,
      editMessage,
      deleteMessage,
      reactToMessage,
      sendTyping,
      onlineUsers: state.onlineUsers,
      unreadCounts: state.unreadCounts
    }),
    [
      state,
      loadConversations,
      selectConversation,
      loadMessages,
      loadOlderMessages,
      sendMessage,
      sendRichMessage,
      startDirectChat,
      deleteConversation,
      blockUser,
      unblockUser,
      muteConversation,
      unmuteConversation,
      archiveConversation,
      unarchiveConversation,
      setReplyTo,
      setEditing,
      starMessage,
      unstarMessage,
      editMessage,
      deleteMessage,
      reactToMessage,
      sendTyping
    ]
  );
}
