/**
 * Chat API Route - Integrates with Maratron MCP Server
 */

import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
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

    // Validate Anthropic API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('Missing ANTHROPIC_API_KEY environment variable');
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: 503 }
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

    // Create system message optimized for Claude
    const systemMessage = {
      role: 'system' as const,
      content: `You are Maratron AI, an expert running and fitness coach powered by Claude 3.5.

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
- Ask clarifying questions to provide personalized recommendations
- Use metric and imperial units as appropriate

Current user: ${session.user.id}
Note: Advanced user data integration coming soon.`
    };
    
    // Generate the response using Claude 3.5
    const result = await generateText({
      model: anthropic(process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022'),
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
  // Health check endpoint
  const anthropicConfigured = !!process.env.ANTHROPIC_API_KEY;
  
  return NextResponse.json({
    message: 'Maratron Chat API',
    status: 'active',
    aiProvider: 'Claude 3.5 (Anthropic)',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
    configured: anthropicConfigured,
    availableTools: [] // MCP tools will be re-enabled later
  });
}