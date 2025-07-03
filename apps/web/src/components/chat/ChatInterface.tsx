'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Textarea } from '@components/ui/textarea';
import { Spinner } from '@components/ui/spinner';
import { cn } from '@lib/utils/cn';
import { Send, User, AlertCircle } from 'lucide-react';

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

interface CoachPersona {
  id: string;
  name: string;
  description: string;
  icon: string;
  personality: string;
}

interface ChatInterfaceProps {
  className?: string;
  // Optional external state management for persistence
  externalMessages?: Message[];
  onMessagesChange?: (messages: Message[]) => void;
  isExternalLoaded?: boolean;
  selectedCoach?: CoachPersona | null;
}

export function ChatInterface({ 
  className, 
  externalMessages, 
  onMessagesChange, 
  isExternalLoaded,
  selectedCoach 
}: ChatInterfaceProps) {
  const { status } = useSession();
  
  // Use external messages if provided, otherwise use internal state
  const [internalMessages, setInternalMessages] = useState<Message[]>([]);
  const messages = externalMessages ?? internalMessages;
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      });
    }
  };

  useEffect(() => {
    // Only auto-scroll for assistant messages or when loading
    if (messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant' || isLoading) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;
    
    if (status !== 'authenticated') {
      setError('Please sign in to use the chat feature');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    if (onMessagesChange) {
      onMessagesChange([...messages, userMessage]);
    } else {
      setInternalMessages(prev => [...prev, userMessage]);
    }
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const assistantMessage = await response.json();
      
      const newMessage = {
        ...assistantMessage,
        timestamp: new Date()
      };
      if (onMessagesChange) {
        onMessagesChange([...messages, newMessage]);
      } else {
        setInternalMessages(prev => [...prev, newMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      if (onMessagesChange) {
        onMessagesChange([...messages, errorMessage]);
      } else {
        setInternalMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatMcpStatus = (status?: string) => {
    switch (status) {
      case 'enhanced':
        return 'Enhanced with your personal data';
      case 'no-data-needed':
        return 'General advice';
      case 'fallback':
        return 'Limited functionality';
      default:
        return null;
    }
  };

  if (status === 'loading' || (externalMessages && !isExternalLoaded)) {
    return (
      <Card className={cn('flex items-center justify-center', className)}>
        <CardContent className="p-8">
          <Spinner className="w-8 h-8" />
          <p className="mt-4 text-muted-foreground">Loading chat...</p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Card className={cn('flex items-center justify-center', className)}>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Sign In Required</h3>
          <p className="text-muted-foreground">
            Please sign in to access the AI assistant and get personalized running advice.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      {/* Messages Area */}
      <CardContent className="flex-1 p-4 overflow-hidden flex flex-col">
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <div className="w-16 h-16 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg border-2 border-white/50">
                {selectedCoach?.icon || '🤖'}
              </div>
              <p className="text-base font-medium mb-2">
                {selectedCoach ? `Welcome! I'm ${selectedCoach.name}` : 'Welcome to Maratron AI!'}
              </p>
              <p className="max-w-md mx-auto text-sm">
                {selectedCoach 
                  ? `${selectedCoach.description}. Ask me anything about running, training, or your fitness data!`
                  : 'Ask me anything about running, training, or your fitness data.'
                }
              </p>
              {selectedCoach && (
                <span className="inline-block mt-3 px-3 py-1 text-xs bg-primary/10 text-primary rounded-full">
                  {selectedCoach.personality} coach
                </span>
              )}
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 max-w-full',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-lg shadow-sm border border-white/50">
                  {message.coachIcon || selectedCoach?.icon || '🤖'}
                </div>
              )}
              
              <div
                className={cn(
                  'rounded-lg px-4 py-2 max-w-[80%] break-words',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                )}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                
                {message.role === 'assistant' && message.mcpStatus && (
                  <div className="mt-2 text-xs opacity-70">
                    {formatMcpStatus(message.mcpStatus)}
                  </div>
                )}
                
                {message.error && (
                  <div className="mt-2 text-xs text-destructive opacity-70">
                    Error: {message.error}
                  </div>
                )}
              </div>
              
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-lg shadow-sm border border-white/50">
                {selectedCoach?.icon || '🤖'}
              </div>
              <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                <Spinner className="w-4 h-4" />
                <span className="text-sm text-muted-foreground">
                  {selectedCoach?.name || 'AI'} is thinking...
                </span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </CardContent>

      {/* Input Area */}
      <div className="border-t p-4">
        {error && (
          <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your running, training plans, shoes, or get general running advice..."
            className="resize-none min-h-[44px] max-h-32"
            rows={1}
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="h-11 w-11 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </Card>
  );
}