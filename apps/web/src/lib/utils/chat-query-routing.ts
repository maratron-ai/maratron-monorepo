/**
 * Intelligent query routing for MCP-enhanced chat
 * Determines when user queries require data vs general advice
 */

import { MaratronMCPClient } from '@lib/mcp/client';
import { UserContext } from '@lib/mcp/types';

export interface QueryAnalysisResult {
  requiresData: boolean;
  dataTypes: ('runs' | 'shoes' | 'profile' | 'goals')[];
  mcpTools: string[];
}

/**
 * Analyzes user query to determine if user data is needed
 */
export function needsUserData(message: string): QueryAnalysisResult {
  const lowerMessage = message.toLowerCase();
  
  const patterns = {
    runs: [
      'recent run', 'last run', 'weekly mileage', 'my run', 'my pace', 
      'my distance', 'my time', 'how did my', 'how far did i', 'how fast',
      'this week', 'last week', 'pace trends', 'am i improving',
      'how are my runs', 'my progress', 'my running', 'running stats'
    ],
    shoes: [
      'shoe', 'miles on', 'retirement', 'retire', 'wear',
      'my shoes', 'which shoes', 'shoe mileage', 'new shoes', 'get new shoes'
    ],
    profile: [
      'my vdot', 'current vdot', 'personal record', 'my pr', 'my weight', 
      'my goal', 'my stats', 'my profile', 'my information', 'about me',
      'what\'s my', 'how much do i weigh', 'what are my goals', 'running stats', 'goals'
    ],
    goals: [
      'training plan', 'workout', 'next run', 'should i run',
      'rest day', 'schedule', 'what should i run', 'next workout', 'goals'
    ]
  };

  const dataTypes: ('runs' | 'shoes' | 'profile' | 'goals')[] = [];
  const mcpTools: string[] = [];

  // Check each pattern category
  for (const [category, categoryPatterns] of Object.entries(patterns)) {
    const hasMatch = categoryPatterns.some(pattern => 
      lowerMessage.includes(pattern)
    );
    
    if (hasMatch) {
      dataTypes.push(category as 'runs' | 'shoes' | 'profile' | 'goals');
    }
  }

  // If any data type is needed, we'll use the smart context tool
  if (dataTypes.length > 0) {
    mcpTools.push('get_smart_user_context');
  }

  return {
    requiresData: dataTypes.length > 0,
    dataTypes,
    mcpTools
  };
}

/**
 * Gathers user data from MCP server based on required data types
 */
export async function gatherUserData(
  dataTypes: string[],
  userId: string,
  mcpClient: MaratronMCPClient
): Promise<Record<string, unknown>> {
  if (dataTypes.length === 0) {
    return {};
  }

  try {
    // Use smart context to get comprehensive user data
    const result = await mcpClient.callTool({
      name: 'get_smart_user_context',
      arguments: {}
    });

    if (result.content && Array.isArray(result.content) && result.content.length > 0) {
      const content = result.content[0];
      if (content.type === 'text') {
        try {
          const rawData = JSON.parse(content.text) as Record<string, unknown>;
          
          // Transform data to match expected structure for different data types
          const transformedData: Record<string, unknown> = { ...rawData };
          
          // Map data types to expected properties
          if (dataTypes.includes('runs') && rawData.recent_runs) {
            transformedData.runs = rawData.recent_runs;
          }
          if (dataTypes.includes('shoes') && rawData.shoes) {
            transformedData.shoes = rawData.shoes;
          }
          if (dataTypes.includes('profile') && rawData.profile) {
            transformedData.profile = rawData.profile;
          }
          if (dataTypes.includes('goals') && rawData.goals) {
            transformedData.goals = rawData.goals;
          }
          
          return transformedData;
        } catch {
          console.error('Failed to parse MCP response:', content.text);
          return {};
        }
      }
    }

    return {};
  } catch (error) {
    console.error('Failed to gather user data:', error);
    return {};
  }
}

/**
 * Creates personalized system prompt based on user data and context
 */
export function createPersonalizedPrompt(
  userData: Record<string, unknown> | null | undefined,
  userContext: UserContext | null
): string {
  let prompt = `You are Maratron AI, an expert running and fitness coach powered by Claude 3.5.

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
- Ask clarifying questions to provide personalized recommendations`;

  // Add user-specific context if available
  if (userData || userContext) {
    prompt += '\n\nUser Context:';
    
    // Add preferences
    const preferences = userData?.preferences || userContext?.preferences;
    if (preferences) {
      if (preferences.distance_unit || preferences.distanceUnit) {
        const unit = preferences.distance_unit || preferences.distanceUnit;
        prompt += `\n- Preferred distance unit: ${unit}`;
      }
      
      if (preferences.response_detail || preferences.responseDetail) {
        const detail = preferences.response_detail || preferences.responseDetail;
        prompt += `\n- Response detail preference: ${detail}`;
      }
    }

    // Add recent runs data
    if (userData?.recent_runs && Array.isArray(userData.recent_runs)) {
      prompt += `\n- recent runs: ${userData.recent_runs.length} runs available`;
      
      if (userData.recent_runs.length > 0) {
        const latestRun = userData.recent_runs[0];
        if (latestRun.distance && latestRun.pace) {
          prompt += ` (latest: ${latestRun.distance} miles at ${latestRun.pace} pace)`;
        }
      }
    }

    // Add shoes data
    if (userData?.shoes && Array.isArray(userData.shoes)) {
      prompt += `\n- Active shoes: ${userData.shoes.length} pairs being tracked`;
    }

    // Add goals/training data
    if (userData?.training_plan || userData?.goals) {
      prompt += `\n- Has active training plan and goals`;
    }
  }

  prompt += '\n\nUse this context to provide personalized, relevant advice.';
  
  return prompt;
}