import { NextRequest, NextResponse } from 'next/server';
import { getMCPClient } from '@lib/mcp/client';
import { withErrorHandler } from '@lib/utils/errorHandling';

export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Try to use MCP client to get motivational context (server-side only)
    try {
      const mcpClient = getMCPClient();
      await mcpClient.connect();
      await mcpClient.setUserContext(userId);
      
      const result = await mcpClient.callTool({
        name: 'get_motivational_context',
        arguments: {}
      });

      if (!result.isError && result.content[0]?.text) {
        // Parse motivational data from MCP response
        const contextText = result.content[0].text;
        let contextData;
        
        try {
          contextData = JSON.parse(contextText);
        } catch {
          // Return empty data on parse error
          contextData = {
            achievements: [],
            alerts: []
          };
        }

        return NextResponse.json(contextData);
      }
    } catch (mcpError) {
      console.warn('MCP achievements request failed, using fallback:', mcpError);
    }

    // Return empty data when MCP fails, let client handle local calculations
    return NextResponse.json({
      achievements: [],
      alerts: []
    });
  } catch (error) {
    console.error('Achievements API error:', error);
    
    // Return empty data on error, let client handle local calculations
    return NextResponse.json({
      achievements: [],
      alerts: []
    });
  }
});