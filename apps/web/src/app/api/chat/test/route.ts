/**
 * Simple test endpoint to check MCP connection
 */

import { NextResponse } from 'next/server';
import { getMCPClient } from '../../../../lib/mcp/client';

export async function GET() {
  try {
    const mcpClient = getMCPClient();
    const tools = await mcpClient.listTools();
    
    return NextResponse.json({
      status: 'success',
      message: 'MCP connection successful',
      availableTools: tools
    });
  } catch (error) {
    console.error('MCP connection test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'MCP connection failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}