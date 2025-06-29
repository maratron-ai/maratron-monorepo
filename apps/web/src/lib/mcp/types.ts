/**
 * MCP-related TypeScript types for the Maratron chatbot
 */

export interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: MCPToolCall[];
  toolResults?: MCPToolResult[];
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MCPServerConfig {
  host?: string;
  port?: number;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface UserContext {
  userId: string;
  preferences: {
    distanceUnit: 'miles' | 'kilometers';
    responseDetail: 'brief' | 'detailed';
    maxResults: number;
  };
  currentSession?: {
    lastTopic?: string;
    lastAction?: string;
    mood?: string;
  };
}