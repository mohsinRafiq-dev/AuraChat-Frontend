/**
 * Normalize how we read the "other" person in a 1:1 conversation from API payloads.
 */
export function getPeer(conversation, currentUserId) {
  if (!conversation) return null;
  if (conversation.peer) return conversation.peer;
  const list = conversation.participants || conversation.members || [];
  return list.find((p) => {
    const id = p._id ?? p.id ?? p.userId;
    return id && String(id) !== String(currentUserId);
  });
}

export function peerLabel(conversation, currentUserId) {
  const peer = getPeer(conversation, currentUserId);
  if (!peer) return conversation.title || conversation.name || 'Chat';
  return peer.displayName || peer.username || peer.email || 'Chat';
}

export function peerInitial(conversation, currentUserId) {
  const label = peerLabel(conversation, currentUserId);
  return label.trim().charAt(0).toUpperCase() || '?';
}

export function peerUserId(conversation, currentUserId) {
  const peer = getPeer(conversation, currentUserId);
  if (!peer) return null;
  const id = peer._id ?? peer.id ?? peer.userId;
  return id ? String(id) : null;
}
