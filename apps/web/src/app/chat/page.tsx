/**
 * Chat Page - Maratron AI Assistant
 */

import { Metadata } from 'next';
import { ChatPageClient } from './ChatPageClient';

export const metadata: Metadata = {
  title: 'Maratron AI Assistant',
  description: 'Chat with your personal running and fitness AI assistant'
};

export default function ChatPage() {
  return <ChatPageClient />;
}