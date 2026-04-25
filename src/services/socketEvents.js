/**
 * Central map of Socket.IO event names shared by UI hooks.
 * Keeps string literals out of components and avoids typos across the app.
 */
export const SOCKET_EVENTS = {
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_READ: 'message_read',
  MARK_READ: 'mark_read',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_PRESENCE_SNAPSHOT: 'user:presence_snapshot',
  SYNC_CONVERSATIONS: 'sync_conversations'
};
