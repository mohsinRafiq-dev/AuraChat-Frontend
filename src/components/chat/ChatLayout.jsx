import { useState } from 'react';
import ConnectionBanner from './ConnectionBanner.jsx';
import ConversationSidebar from './ConversationSidebar.jsx';
import MessageComposer from './MessageComposer.jsx';
import MessageThread from './MessageThread.jsx';

export default function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`chat-layout${sidebarOpen ? ' chat-layout--sidebar-open' : ''}`}>
      <div className="chat-layout__hero">
        <button
          type="button"
          className="chat-layout__toggle-sidebar"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open conversations"
          title="Open conversations"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </svg>
        </button>
        <div className="chat-brand">
          <div className="chat-brand__mark">A</div>
          <div>
            <p className="chat-brand__eyebrow">Aura Chat</p>
            <h1 className="chat-brand__title">Fast, modern messaging.</h1>
          </div>
        </div>
        <ConnectionBanner />
      </div>
      <div className="chat-layout__body">
        <ConversationSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onConversationSelect={() => setSidebarOpen(false)}
        />
        {sidebarOpen ? <div className="sidebar__backdrop" onClick={() => setSidebarOpen(false)} /> : null}
        <main className="chat-main">
          <MessageThread />
          <MessageComposer />
        </main>
      </div>
    </div>
  );
}
