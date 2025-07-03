'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { X } from 'lucide-react';
import { Button } from '@components/ui/button';
import { ChatInterface } from './ChatInterface';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mcpStatus?: 'enhanced' | 'no-data-needed' | 'fallback';
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
  error?: string;
  timestamp: Date;
  coachName?: string;
  coachIcon?: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  messages?: Message[];
  onMessagesChange?: (messages: Message[]) => void;
  isLoaded?: boolean;
}

interface CoachPersona {
  id: string;
  name: string;
  description: string;
  icon: string;
  personality: string;
}

export function ChatModal({ 
  isOpen, 
  onOpenChange, 
  messages, 
  onMessagesChange, 
  isLoaded 
}: ChatModalProps) {
  const { data: session } = useSession();
  const [selectedCoach, setSelectedCoach] = useState<CoachPersona | null>(null);

  // Fetch user's selected coach
  useEffect(() => {
    const fetchUserCoach = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/users/${session.user.id}`);
          if (response.ok) {
            const userData = await response.json();
            if (userData.selectedCoach) {
              setSelectedCoach(userData.selectedCoach);
            }
          }
        } catch (error) {
          console.error('Failed to fetch user coach:', error);
        }
      }
    };

    if (isOpen) {
      fetchUserCoach();
    }
  }, [session?.user?.id, isOpen]);

  // Handle escape key and body scroll lock
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onOpenChange(false);
      }
    };

    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        // Restore body scroll
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onOpenChange]);

  // Extract coach info from latest message or use selected coach
  const latestMessage = messages?.findLast(m => m.role === 'assistant' && (m.coachName || m.coachIcon));
  const displayCoach = latestMessage ? {
    name: latestMessage.coachName || selectedCoach?.name || 'AI Assistant',
    icon: latestMessage.coachIcon || selectedCoach?.icon || '🤖',
    description: selectedCoach?.description || 'Your AI running companion'
  } : selectedCoach ? {
    name: selectedCoach.name,
    icon: selectedCoach.icon,
    description: selectedCoach.description
  } : {
    name: 'Maratron AI Assistant',
    icon: '🤖',
    description: 'Your AI running companion'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal */}
      <div className="relative grid w-full max-w-5xl gap-0 border bg-background shadow-lg rounded-lg h-[90vh] w-[92vw] p-0 mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-lg">
          <div className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-2xl shadow-sm border border-white/50">
              {displayCoach.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{displayCoach.name}</span>
                {selectedCoach && (
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {selectedCoach.personality}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-normal">{displayCoach.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-xs text-muted-foreground">Online</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0 hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-h-0 p-2">
          <ChatInterface 
            className="h-full border-0 shadow-none"
            externalMessages={messages}
            onMessagesChange={onMessagesChange}
            isExternalLoaded={isLoaded}
            selectedCoach={selectedCoach}
          />
        </div>
      </div>
    </div>
  );
}