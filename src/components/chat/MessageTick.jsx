/**
 * Delivery status indicator: sending / sent / delivered / read / failed.
 *
 * Lives in its own module because two surfaces render it — the message bubble
 * in the thread, and the last-message preview in the conversation list. They
 * must agree, or the same message shows a different state depending on where
 * you look at it.
 */
export default function MessageTick({ status }) {
  if (status === 'failed') {
    return <span className="msg__tick msg__tick--failed" title="Failed">✕</span>;
  }
  if (status === 'sending') {
    return (
      <span className="msg__tick msg__tick--sending" title="Sending">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </span>
    );
  }
  if (status === 'read') {
    return (
      <span className="msg__tick msg__tick--read" title="Read">
        <svg width="18" height="11" viewBox="0 0 20 11" fill="none"><path d="M1 5.5L5 9.5L15 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 5.5L10 9.5L20 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
    );
  }
  if (status === 'delivered') {
    return (
      <span className="msg__tick msg__tick--delivered" title="Delivered">
        <svg width="18" height="11" viewBox="0 0 20 11" fill="none"><path d="M1 5.5L5 9.5L15 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 5.5L10 9.5L20 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
    );
  }
  return (
    <span className="msg__tick msg__tick--sent" title="Sent">
      <svg width="14" height="11" viewBox="0 0 16 11" fill="none"><path d="M1 5.5L5 9.5L15 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </span>
  );
}
