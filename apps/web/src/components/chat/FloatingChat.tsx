'use client';

import React, { useState } from 'react';
import { FloatingChatButton } from './FloatingChatButton';
import { ChatModal } from './ChatModal';

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <FloatingChatButton 
        isOpen={isOpen} 
        onClick={() => setIsOpen(!isOpen)} 
      />
      <ChatModal 
        isOpen={isOpen} 
        onOpenChange={setIsOpen} 
      />
    </>
  );
}