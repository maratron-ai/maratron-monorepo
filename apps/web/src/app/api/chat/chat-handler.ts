/**
 * Chat Handler - Business logic for MCP-enhanced chat API
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { MaratronMCPClient } from '@lib/mcp/client';
import { MCPToolCall } from '@lib/mcp/types';
import { needsUserData, gatherUserData, createPersonalizedPrompt } from '@lib/utils/chat-query-routing';
import { getUserDataDirect, isDockerEnvironment } from '@lib/database/direct-access';

export interface AuthResult {
  isAuthenticated: boolean;
  userId?: string;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  messages?: Array<{ role: string; content: string }>;
  error?: string;
}

export interface ChatResponse {
  content: string;
  mcpStatus: 'enhanced' | 'no-data-needed' | 'fallback';
  systemPrompt: string;
  toolCalls: MCPToolCall[];
  error?: string;
}

/**
 * Authenticate user session
 */
export async function authenticateUser(session: unknown): Promise<AuthResult> {
  const typedSession = session as { user?: { id?: string } } | null;
  
  if (!typedSession?.user?.id) {
    return {
      isAuthenticated: false,
      error: 'Authentication required'
    };
  }

  return {
    isAuthenticated: true,
    userId: typedSession.user.id
  };
}

/**
 * Validate chat request format
 */
export function validateChatRequest(request: unknown): ValidationResult {
  const typedRequest = request as { messages?: unknown[] } | null;
  
  if (!typedRequest?.messages || !Array.isArray(typedRequest.messages)) {
    return {
      isValid: false,
      error: 'Messages array is required'
    };
  }

  if (typedRequest.messages.length === 0) {
    return {
      isValid: false,
      error: 'Messages array cannot be empty'
    };
  }

  // Validate message structure
  for (const message of typedRequest.messages) {
    const typedMessage = message as { role?: string; content?: string };
    
    if (!typedMessage.role || !typedMessage.content) {
      return {
        isValid: false,
        error: 'Each message must have role and content'
      };
    }

    if (!['user', 'assistant', 'system'].includes(typedMessage.role)) {
      return {
        isValid: false,
        error: 'Invalid message role'
      };
    }
  }

  return {
    isValid: true,
    messages: typedRequest.messages as Array<{ role: string; content: string }>
  };
}

/**
 * Handle MCP-enhanced chat with intelligent query routing
 */
export async function handleMCPEnhancedChat(
  messages: Array<{ role: string; content: string }>,
  userId: string,
  mcpClient: MaratronMCPClient | null
): Promise<ChatResponse> {
  const toolCalls: MCPToolCall[] = [];
  let userData: Record<string, unknown> = {};
  let userContext = null;
  let mcpStatus: 'enhanced' | 'no-data-needed' | 'fallback' = 'no-data-needed';

  try {
    // Analyze the latest user message to determine if data is needed
    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.role === 'user') {
      const queryAnalysis = needsUserData(latestMessage.content);
      
      if (queryAnalysis.requiresData) {
        // Use direct database access in Docker, MCP otherwise
        if (isDockerEnvironment()) {
          userData = await getUserDataDirect(userId, queryAnalysis.dataTypes);
          
          // Set basic user context for Docker mode
          userContext = {
            userId,
            preferences: userData.preferences || {
              distanceUnit: 'miles',
              responseDetail: 'detailed',
              maxResults: 10
            }
          };
          
          mcpStatus = 'enhanced';
        } else if (mcpClient) {
          // Always set user context for personalization
          await mcpClient.setUserContext(userId);
          
          // Get user context for preferences
          userContext = await mcpClient.getUserContext();
          
          // Gather user data via MCP
          userData = await gatherUserData(queryAnalysis.dataTypes, userId, mcpClient);
          
          mcpStatus = 'enhanced';
        } else {
          console.warn('No MCP client available and not in Docker mode, using fallback');
          mcpStatus = 'fallback';
        }
        
        // Record the tool calls made
        queryAnalysis.mcpTools.forEach(tool => {
          toolCalls.push({
            name: tool,
            arguments: {}
          });
        });
      }
    }
  } catch (error) {
    console.warn('Data gathering failed, falling back to standard response:', error);
    mcpStatus = 'fallback';
  }

  // Create personalized system prompt
  const systemPrompt = createPersonalizedPrompt(userData, userContext);

  // Create system message
  const systemMessage = {
    role: 'system' as const,
    content: systemPrompt
  };

  try {
    // Generate response using Claude with personalized context
    const result = await generateText({
      model: anthropic(process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022'),
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      maxTokens: 1000,
    });

    return {
      content: result.text,
      mcpStatus,
      systemPrompt,
      toolCalls
    };
  } catch (error) {
    console.error('Claude generation failed:', error);
    
    // Fallback response
    return {
      content: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.',
      mcpStatus: 'fallback',
      systemPrompt,
      toolCalls,
      error: 'Claude generation failed'
    };
  }
}