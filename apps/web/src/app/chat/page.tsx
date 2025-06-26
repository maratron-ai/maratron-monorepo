/**
 * Chat Page - Maratron AI Assistant
 */

import { Metadata } from 'next';
import { ChatInterface } from '@components/chat/ChatInterface';

export const metadata: Metadata = {
  title: 'Maratron AI Assistant',
  description: 'Chat with your personal running and fitness AI assistant'
};

export default function ChatPage() {
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <div className="container mx-auto px-4 max-w-4xl flex-shrink-0 py-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Maratron AI Assistant
        </h1>
        <p className="text-muted-foreground mt-2">
          Get personalized insights about your running and fitness data
        </p>
      </div>
      
      <div className="flex-1 min-h-0 container mx-auto px-4 max-w-4xl pb-6">
        <ChatInterface className="h-full max-h-full" />
      </div>
    </div>
  );
}