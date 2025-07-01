'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { ChatInterface } from './ChatInterface';
import { Bot } from 'lucide-react';

interface ChatModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatModal({ isOpen, onOpenChange }: ChatModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] h-[80vh] max-h-[600px] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bot className="w-6 h-6 text-primary" />
            Maratron AI Assistant
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 p-2">
          <ChatInterface className="h-full border-0 shadow-none" />
        </div>
      </DialogContent>
    </Dialog>
  );
}