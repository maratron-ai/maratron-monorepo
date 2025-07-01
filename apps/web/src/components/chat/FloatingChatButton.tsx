'use client';

import React from 'react';
import { Button } from '@components/ui/button';
import { cn } from '@lib/utils/cn';
import { MessageCircle, X } from 'lucide-react';

interface FloatingChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export function FloatingChatButton({ isOpen, onClick, className }: FloatingChatButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out',
        'bg-primary hover:bg-primary/90 text-primary-foreground',
        'border-2 border-background',
        isOpen && 'rotate-180',
        className
      )}
      aria-label={isOpen ? 'Close chat' : 'Open AI chat assistant'}
    >
      {isOpen ? (
        <X className="w-6 h-6" />
      ) : (
        <MessageCircle className="w-6 h-6" />
      )}
    </Button>
  );
}