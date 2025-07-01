'use client';

import { useState, useEffect, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mcpStatus?: 'enhanced' | 'no-data-needed' | 'fallback';
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
  error?: string;
  timestamp: Date;
}

const STORAGE_KEY = 'maratron-chat-history';
const MAX_MESSAGES = 50; // Limit to prevent localStorage bloat

export function usePersistentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedMessages: Message[] = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      }
    } catch (error) {
      console.warn('Failed to load chat history:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return; // Don't save until we've loaded initial state
    
    try {
      // Keep only the most recent messages to prevent storage bloat
      const messagesToStore = messages.slice(-MAX_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToStore));
    } catch (error) {
      console.warn('Failed to save chat history:', error);
    }
  }, [messages, isLoaded]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear chat history:', error);
    }
  }, []);

  const updateLastMessage = useCallback((updatedMessage: Partial<Message>) => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      
      const lastIndex = prev.length - 1;
      const updated = [...prev];
      updated[lastIndex] = { ...updated[lastIndex], ...updatedMessage };
      return updated;
    });
  }, []);

  return {
    messages,
    isLoaded,
    addMessage,
    clearMessages,
    updateLastMessage,
    setMessages
  };
}