/**
 * Chat API Route - Hybrid MCP + LLM Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@lib/auth';
import { getMCPClient } from '@lib/mcp/client';
import { authenticateUser, validateChatRequest, handleMCPEnhancedChat } from './chat-handler';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    const authResult = await authenticateUser(session);
    
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate Anthropic API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('Missing ANTHROPIC_API_KEY environment variable');
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const requestBody = await request.json();
    const validation = validateChatRequest(requestBody);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Get MCP client and handle enhanced chat
    // In Docker mode, MCP client may not be needed due to direct database access
    let mcpClient;
    try {
      mcpClient = getMCPClient();
    } catch (error) {
      console.warn('MCP client initialization failed, using fallback mode:', error);
      mcpClient = null;
    }
    
    const chatResponse = await handleMCPEnhancedChat(
      validation.messages!,
      authResult.userId!,
      mcpClient,
      validation.timezone
    );

    // Return enhanced response with MCP integration details
    return NextResponse.json({
      id: Date.now().toString(),
      role: 'assistant',
      content: chatResponse.content,
      mcpStatus: chatResponse.mcpStatus,
      toolCalls: chatResponse.toolCalls,
      error: chatResponse.error
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Provide specific error handling for different failure modes
    if (error instanceof Error) {
      // Check for Anthropic API specific errors
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'AI service authentication failed' },
          { status: 503 }
        );
      }
      
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again in a moment.' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check endpoint with MCP status
  const anthropicConfigured = !!process.env.ANTHROPIC_API_KEY;
  const isDocker = process.env.DOCKER === 'true' || process.env.RUNNING_IN_DOCKER === 'true';
  
  let mcpStatus = 'unknown';
  let availableTools: string[] = [];
  
  // Always use MCP for consistent AI intelligence across all environments
  try {
    const mcpClient = getMCPClient();
    await mcpClient.connect();
    availableTools = await mcpClient.listTools();
    mcpStatus = 'connected';
  } catch {
    mcpStatus = 'disconnected';
  }
  
  return NextResponse.json({
    message: 'Maratron Chat API - Consistent MCP + LLM',
    status: 'active',
    aiProvider: 'Claude 3.5 (Anthropic)',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
    configured: anthropicConfigured,
    mcpStatus,
    availableTools,
    mode: isDocker ? 'docker' : 'local',
    features: [
      'Intelligent query routing',
      'User context management',
      'Personalized responses',
      'Error resilience with fallback',
      'Consistent MCP integration across all environments'
    ]
  });
}