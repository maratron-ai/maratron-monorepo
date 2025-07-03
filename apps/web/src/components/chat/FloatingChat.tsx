'use client';

import React, { useState } from 'react';
import { FloatingChatButton } from './FloatingChatButton';
import { ChatModal } from './ChatModal';
import { usePersistentChat } from '@hooks/usePersistentChat';

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isLoaded, setMessages, clearMessages } = usePersistentChat();

  return (
    <>
      <FloatingChatButton 
        isOpen={isOpen} 
        onClick={() => setIsOpen(!isOpen)} 
      />
      <ChatModal 
        isOpen={isOpen} 
        onOpenChange={setIsOpen}
        messages={messages}
        onMessagesChange={setMessages}
        onClearMessages={clearMessages}
        isLoaded={isLoaded}
      />
    </>
  );
}