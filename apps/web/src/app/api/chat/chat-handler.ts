/**
 * Chat Handler - Business logic for MCP-enhanced chat API with Function Calling
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { MaratronMCPClient } from '@lib/mcp/client';
import { MCPToolCall } from '@lib/mcp/types';

export interface AuthResult {
  isAuthenticated: boolean;
  userId?: string;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
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
 * Create MCP tool definitions for Claude function calling
 * Note: User context is automatically set by the system
 */
function createMCPTools(mcpClient: MaratronMCPClient, userId: string) {
  return {

    getSmartUserContext: tool({
      description: 'Get comprehensive, intelligent user context for personalized responses',
      parameters: z.object({}),
      execute: async () => {
        try {
          // First set user context
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'get_smart_user_context',
            arguments: {}
          });
          return result.content[0]?.text || 'No context available';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    getUserRuns: tool({
      description: 'Get the current user\'s recent running data with detailed metrics',
      parameters: z.object({
        limit: z.number().optional().describe('Number of runs to retrieve (default: 5)')
      }),
      execute: async ({ limit = 5 }) => {
        try {
          // First set user context
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          // Call the correct MCP tool for user runs data
          const result = await mcpClient.callTool({
            name: 'get_user_runs',
            arguments: { limit }
          });
          return result.content[0]?.text || 'No runs available';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    addRun: tool({
      description: 'Add a new run record for the current user',
      parameters: z.object({
        date: z.string().describe('Run date in YYYY-MM-DD format'),
        duration: z.string().describe('Duration in HH:MM:SS format'),
        distance: z.number().describe('Distance covered'),
        distanceUnit: z.enum(['miles', 'kilometers']).optional().describe('Distance unit'),
        name: z.string().optional().describe('Name for the run'),
        notes: z.string().optional().describe('Notes about the run'),
        pace: z.string().optional().describe('Pace information'),
        elevationGain: z.number().optional().describe('Elevation gain')
      }),
      execute: async (params) => {
        try {
          // User context is already set, MCP tools will use current user
          const result = await mcpClient.callTool({
            name: 'add_run',
            arguments: { ...params }
          });
          return result.content[0]?.text || 'Run added successfully';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    analyzeUserPatterns: tool({
      description: 'Analyze user running patterns and provide insights',
      parameters: z.object({}),
      execute: async () => {
        try {
          const result = await mcpClient.callTool({
            name: 'analyze_user_patterns',
            arguments: {}
          });
          return result.content[0]?.text || 'No patterns available';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    getMotivationalContext: tool({
      description: 'Get motivational context to provide encouraging responses',
      parameters: z.object({}),
      execute: async () => {
        try {
          const result = await mcpClient.callTool({
            name: 'get_motivational_context',
            arguments: {}
          });
          return result.content[0]?.text || 'Stay motivated!';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    updateConversationIntelligence: tool({
      description: 'Update conversation intelligence with context from the current interaction',
      parameters: z.object({
        userMessage: z.string().describe('The user\'s message'),
        aiResponse: z.string().describe('The AI\'s response'),
        intent: z.string().optional().describe('Intent of the conversation'),
        sentiment: z.string().optional().describe('User sentiment')
      }),
      execute: async (params) => {
        try {
          const result = await mcpClient.callTool({
            name: 'update_conversation_intelligence',
            arguments: params
          });
          return result.content[0]?.text || 'Context updated';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    addShoe: tool({
      description: 'Add a new running shoe to track mileage and usage for the current user',
      parameters: z.object({
        name: z.string().describe('Name/model of the shoe'),
        maxDistance: z.number().describe('Maximum recommended mileage'),
        distanceUnit: z.enum(['miles', 'kilometers']).optional().describe('Distance unit'),
        notes: z.string().optional().describe('Notes about the shoe')
      }),
      execute: async (params) => {
        try {
          const result = await mcpClient.callTool({
            name: 'add_shoe',
            arguments: { ...params }
          });
          return result.content[0]?.text || 'Shoe added successfully';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    getDatabaseSummary: tool({
      description: 'Get a summary of database statistics and information',
      parameters: z.object({}),
      execute: async () => {
        try {
          const summary = await mcpClient.getDatabaseSummary();
          return summary;
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    listUserShoes: tool({
      description: 'Get current user\'s shoe collection and mileage information',
      parameters: z.object({
        limit: z.number().optional().describe('Number of shoes to retrieve (default: 10)')
      }),
      execute: async ({ limit = 10 }) => {
        try {
          console.log(`🔍 Executing listUserShoes tool with limit: ${limit}`);
          
          // First set user context
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          // Call the correct MCP tool for user shoes data
          const result = await mcpClient.callTool({
            name: 'get_user_shoes',
            arguments: { limit }
          });
          const data = result.content[0]?.text || 'No shoe data available';
          console.log(`✅ Tool result length: ${data.length} characters`);
          console.log(`📊 Tool data preview: "${data.substring(0, 100)}..."`);
          return data;
        } catch (error) {
          console.error(`❌ Tool execution error:`, error);
          return `Error: ${String(error)}`;
        }
      }
    })
  };
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
    messages: typedRequest.messages as Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  };
}

/**
 * Handle MCP-enhanced chat with function calling integration
 */
export async function handleMCPEnhancedChat(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  userId: string,
  mcpClient: MaratronMCPClient | null
): Promise<ChatResponse> {
  const toolCalls: MCPToolCall[] = [];
  let mcpStatus: 'enhanced' | 'no-data-needed' | 'fallback' = 'fallback';

  // Create enhanced system prompt for running coach
  const systemPrompt = `You are Maratron AI, an expert running and fitness coach powered by Claude 3.5.

Your expertise includes:
- Personalized training advice based on running science
- Injury prevention and recovery guidance  
- Nutrition strategies for endurance athletes
- Race preparation and pacing strategies
- Mental training and motivation techniques

Guidelines:
- Provide evidence-based advice following current sports science
- Be encouraging yet realistic about training progression
- Always prioritize safety and injury prevention
- Use natural, conversational language (not overly technical or pedagogical)
- When you need user-specific data, use the available tools directly
- User context is automatically managed - you can access user data immediately

Available Tools:
- getSmartUserContext: Get comprehensive user context and insights about their running
- getUserRuns: Get user's recent running data with metrics and analysis
- addRun: Add new run records (date, duration, distance, notes, etc.)
- addShoe: Add new running shoes to track mileage and usage
- listUserShoes: Get user's shoe collection and mileage information
- analyzeUserPatterns: Analyze running patterns and provide insights
- getMotivationalContext: Get motivational context for encouraging responses
- updateConversationIntelligence: Track conversation context and sentiment
- getDatabaseSummary: Get database statistics (for debugging only)

The user's context is automatically set - you can immediately use any tool to access their personal running data, add new records, or provide personalized advice. Never ask users for their user ID or mention setting context.`;

  try {
    if (!mcpClient) {
      console.warn('No MCP client available, using basic response mode');
      mcpStatus = 'fallback';
      
      // Generate basic response without tools
      const result = await generateText({
        model: anthropic(process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'),
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        maxTokens: 1000,
      });

      return {
        content: result.text,
        mcpStatus,
        systemPrompt,
        toolCalls
      };
    }

    // Automatically set user context for this session
    try {
      await mcpClient.setUserContext(userId);
      console.log(`User context set for: ${userId}`);
    } catch (error) {
      console.warn(`Failed to set user context for ${userId}:`, error);
      // Continue anyway - some tools might still work
    }

    // Create MCP tools for function calling
    const tools = createMCPTools(mcpClient, userId);
    mcpStatus = 'enhanced';

    // Two-phase approach: Tool planning + execution + final response
    console.log('🔄 Phase 1: Determine tool usage...');
    
    // Phase 1: Determine what tools to call
    const planningResult = await generateText({
      model: anthropic(process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      tools,
      temperature: 0.7,
      maxTokens: 1500,
    });

    console.log(`📋 Planning result - tool calls: ${planningResult.toolCalls?.length || 0}`);

    // Phase 2: Execute tools and collect results
    let toolResults: string[] = [];
    if (planningResult.toolCalls && planningResult.toolCalls.length > 0) {
      console.log('🔄 Phase 2: Executing tools...');
      
      // Ensure user context is set before executing any tools
      try {
        console.log(`🔧 Setting user context for tool execution: ${userId}`);
        await mcpClient.setUserContext(userId);
        console.log(`✅ User context confirmed for tool execution`);
      } catch (error) {
        console.error(`❌ Failed to set user context for tools:`, error);
        // Still continue, but note the issue
      }
      
      for (const toolCall of planningResult.toolCalls) {
        toolCalls.push({
          name: toolCall.toolName,
          arguments: toolCall.args as Record<string, unknown>
        });

        try {
          console.log(`🛠️ Executing tool: ${toolCall.toolName}`);
          const toolFunction = tools[toolCall.toolName as keyof typeof tools];
          if (toolFunction && 'execute' in toolFunction) {
            const toolResult = await toolFunction.execute(toolCall.args as any);
            toolResults.push(toolResult);
            console.log(`✅ Tool ${toolCall.toolName} returned ${String(toolResult).length} characters`);
          }
        } catch (error) {
          console.error(`❌ Tool ${toolCall.toolName} failed:`, error);
          toolResults.push(`Error executing ${toolCall.toolName}: ${String(error)}`);
        }
      }

      // Phase 3: Generate final response with tool results
      console.log('🔄 Phase 3: Generating final response with tool data...');
      
      const finalMessages = [
        { role: 'system', content: systemPrompt },
        ...messages,
        { 
          role: 'user', 
          content: `Based on the following tool execution results, provide a comprehensive response to the user:\n\n${toolResults.join('\n\n')}`
        }
      ];

      const finalResult = await generateText({
        model: anthropic(process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'),
        messages: finalMessages,
        temperature: 0.7,
        maxTokens: 2000,
      });

      console.log(`✅ Final response length: ${finalResult.text.length} characters`);
      
      return {
        content: finalResult.text,
        mcpStatus,
        systemPrompt,
        toolCalls
      };
    } else {
      // No tools needed, return planning result
      console.log('📝 No tools needed, returning direct response');
      return {
        content: planningResult.text,
        mcpStatus,
        systemPrompt,
        toolCalls
      };
    }

  } catch (error) {
    console.error('Enhanced chat generation failed:', error);
    
    // Fallback to basic response
    try {
      const fallbackResult = await generateText({
        model: anthropic(process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'),
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful running coach. Provide general running advice based on the user\'s question.' 
          },
          ...messages
        ],
        temperature: 0.7,
        maxTokens: 1000,
      });

      return {
        content: fallbackResult.text,
        mcpStatus: 'fallback',
        systemPrompt,
        toolCalls,
        error: 'Function calling failed, using basic mode'
      };
    } catch (fallbackError) {
      console.error('Fallback generation also failed:', fallbackError);
      
      return {
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.',
        mcpStatus: 'fallback',
        systemPrompt,
        toolCalls,
        error: 'All generation methods failed'
      };
    }
  }
}