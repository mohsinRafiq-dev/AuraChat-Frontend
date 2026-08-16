import { useEffect, useState } from 'react';
import ConversationSidebar from './ConversationSidebar.jsx';
import MessageThread from './MessageThread.jsx';
import MessageComposer from './MessageComposer.jsx';
import ContactInfoPanel from './ContactInfoPanel.jsx';
import CallOverlay from './CallOverlay.jsx';
import { useChatContext } from '../../contexts/ChatContext.jsx';

const MOBILE_QUERY = '(max-width: 840px)';

function useIsMobile() {
  const get = () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches;
  const [isMobile, setIsMobile] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const handler = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler);
    };
  }, []);
  return isMobile;
}

export default function ChatLayout() {
  const { selectedConversation, selectConversation } = useChatContext();
  const isMobile = useIsMobile();
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [activeCall, setActiveCall] = useState(null);

  // Close info panel automatically when conversation changes / clears
  useEffect(() => {
    if (!selectedConversation) setInfoPanelOpen(false);
  }, [selectedConversation]);

  // Mobile back button on thread → deselect conversation (returns to chat list)
  const handleBack = () => selectConversation(null);

  // Browser back button on mobile → also deselect (so it feels native)
  useEffect(() => {
    if (!isMobile || !selectedConversation) return;
    const handler = () => selectConversation(null);
    window.history.pushState({ aurachat: true }, '');
    window.addEventListener('popstate', handler);
    return () => {
      window.removeEventListener('popstate', handler);
    };
  }, [isMobile, selectedConversation, selectConversation]);

  const callMount = activeCall && (
    <CallOverlay call={activeCall} onEnd={() => setActiveCall(null)} />
  );

  if (isMobile) {
    return (
      <div className="chat-app chat-app--mobile">
        {!selectedConversation ? (
          <ConversationSidebar
            mobile
            onConversationSelect={() => { /* no-op: thread will mount automatically when selected */ }}
            onStartCall={(callInfo) => setActiveCall(callInfo)}
          />
        ) : infoPanelOpen ? (
          <ContactInfoPanel
            onClose={() => setInfoPanelOpen(false)}
            onStartCall={(callInfo) => setActiveCall(callInfo)}
          />
        ) : (
          <div className="chat-main">
            <MessageThread
              onOpenSidebar={handleBack}
              onOpenInfo={() => setInfoPanelOpen(true)}
              onStartCall={(callInfo) => setActiveCall(callInfo)}
            />
            <MessageComposer />
          </div>
        )}
        {callMount}
      </div>
    );
  }

  // Desktop: persistent 2- (or 3-) pane layout
  return (
    <div className="chat-app">
      <ConversationSidebar
        onConversationSelect={() => {}}
        onStartCall={(callInfo) => setActiveCall(callInfo)}
      />

      <div className="chat-main">
        <MessageThread
          onOpenSidebar={handleBack}
          onOpenInfo={() => setInfoPanelOpen(true)}
          onStartCall={(callInfo) => setActiveCall(callInfo)}
        />
        <MessageComposer />
      </div>

      {infoPanelOpen && selectedConversation && (
        <ContactInfoPanel
          onClose={() => setInfoPanelOpen(false)}
          onStartCall={(callInfo) => setActiveCall(callInfo)}
        />
      )}

      {callMount}
    </div>
  );
}
