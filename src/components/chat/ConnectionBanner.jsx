import { useSocket } from '../../contexts/SocketContext.jsx';

const COPY = {
  disconnected: { tone: 'muted', text: 'Offline. Messages will send when you are back online.' },
  connecting: { tone: 'pending', text: 'Connecting to realtime…' },
  connected: { tone: 'ok', text: 'Live' },
  reconnecting: { tone: 'warn', text: 'Reconnecting…' },
  failed: { tone: 'bad', text: 'Could not reconnect. Refresh the page or check your network.' },
  auth_error: { tone: 'bad', text: 'Session invalid. Signed out.' }
};

export default function ConnectionBanner() {
  const { status, reconnectAttempts } = useSocket();
  const meta = COPY[status] || COPY.disconnected;

  if (status === 'connected') {
    return (
      <div className={`conn conn--${meta.tone}`} aria-live="polite">
        <span className="conn__pulse" />
        {meta.text}
      </div>
    );
  }

  return (
    <div className={`conn conn--${meta.tone}`} role="status" aria-live="assertive">
      {meta.text}
      {status === 'reconnecting' && reconnectAttempts > 0 ? (
        <span className="conn__detail"> (attempt {reconnectAttempts})</span>
      ) : null}
    </div>
  );
}
