/**
 * Chat API Route - Integrates with Maratron MCP Server
 */

import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@lib/auth';

// MCP tools will be re-enabled once we get the basic chat working

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Create system message
    const systemMessage = {
      role: 'system' as const,
      content: `You are Maratron AI, a helpful running and fitness assistant. 

You can help users with:
- General running advice and training tips
- Answering questions about fitness and nutrition
- Providing motivational support
- Discussing running techniques and strategies

Be encouraging, knowledgeable about running, and provide helpful advice.

Note: Advanced data tools are currently being set up and will be available soon.

Current user ID: ${session.user.id}`
    };
    
    // Generate the response (non-streaming for now to test)
    const result = await generateText({
      model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Return a simple JSON response that useChat can handle
    return NextResponse.json({
      id: Date.now().toString(),
      role: 'assistant',
      content: result.text,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Maratron Chat API',
    status: 'active',
    availableTools: [] // MCP tools disabled - will be re-enabled later
  });
}