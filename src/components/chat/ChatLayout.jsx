import { useState } from 'react';
import ConversationSidebar from './ConversationSidebar.jsx';
import MessageThread from './MessageThread.jsx';
import MessageComposer from './MessageComposer.jsx';
import ContactInfoPanel from './ContactInfoPanel.jsx';
import CallOverlay from './CallOverlay.jsx';
import { useChatContext } from '../../contexts/ChatContext.jsx';

export default function ChatLayout() {
  const { selectedConversation } = useChatContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [activeCall, setActiveCall] = useState(null); // { type:'voice'|'video', peer, conversationId }

  return (
    <div className="chat-app">
      {/* Left Sidebar */}
      <ConversationSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onConversationSelect={() => setSidebarOpen(false)}
        onStartCall={(callInfo) => setActiveCall(callInfo)}
      />
      {sidebarOpen && (
        <div className="sidebar__backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Chat Area */}
      <div className="chat-main">
        <MessageThread
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenInfo={() => setInfoPanelOpen(true)}
          onStartCall={(callInfo) => setActiveCall(callInfo)}
        />
        <MessageComposer />
      </div>

      {/* Right Info Panel */}
      {infoPanelOpen && selectedConversation && (
        <ContactInfoPanel
          onClose={() => setInfoPanelOpen(false)}
          onStartCall={(callInfo) => setActiveCall(callInfo)}
        />
      )}

      {/* Call Overlay */}
      {activeCall && (
        <CallOverlay
          call={activeCall}
          onEnd={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}
