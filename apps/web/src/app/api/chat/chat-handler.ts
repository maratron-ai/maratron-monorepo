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
    }),

    // =========================================================================
    // ADVANCED TRAINING & ANALYTICS TOOLS
    // =========================================================================

    generateTrainingPlan: tool({
      description: 'Generate an intelligent training plan based on user\'s current fitness and goals',
      parameters: z.object({
        goalType: z.enum(['race', 'distance', 'speed', 'endurance']).describe('Type of training goal'),
        targetDistance: z.number().describe('Target distance for the goal'),
        targetTime: z.string().optional().describe('Optional target time (HH:MM:SS format)'),
        weeks: z.number().optional().default(12).describe('Number of weeks for the plan'),
        distanceUnit: z.enum(['miles', 'kilometers']).optional().default('miles')
      }),
      execute: async ({ goalType, targetDistance, targetTime, weeks = 12, distanceUnit = 'miles' }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'generate_training_plan',
            arguments: { goal_type: goalType, target_distance: targetDistance, target_time: targetTime, weeks, distance_unit: distanceUnit }
          });
          return result.content[0]?.text || 'Error generating training plan';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    getActiveTrainingPlan: tool({
      description: 'Get the current active training plan with progress tracking and weekly schedule',
      parameters: z.object({}),
      execute: async () => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'get_active_training_plan',
            arguments: {}
          });
          return result.content[0]?.text || 'No active training plan found';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    setRunningGoal: tool({
      description: 'Set a specific running goal with tracking (distance PR, race time, weekly mileage, etc.)',
      parameters: z.object({
        goalType: z.enum(['distance_pr', 'race_time', 'weekly_mileage', 'consistency']).describe('Type of goal'),
        targetValue: z.number().describe('Numeric target (distance, time in minutes, etc.)'),
        targetDate: z.string().optional().describe('Optional target date (YYYY-MM-DD)'),
        description: z.string().optional().describe('Optional description of the goal')
      }),
      execute: async ({ goalType, targetValue, targetDate, description }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'set_running_goal',
            arguments: { goal_type: goalType, target_value: targetValue, target_date: targetDate, description }
          });
          return result.content[0]?.text || 'Error setting goal';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    getGoalProgress: tool({
      description: 'Get progress tracking for all active running goals with motivation and insights',
      parameters: z.object({}),
      execute: async () => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'get_goal_progress',
            arguments: {}
          });
          return result.content[0]?.text || 'No goals found';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    getPerformanceTrends: tool({
      description: 'Get detailed performance trends and analytics over time periods',
      parameters: z.object({
        period: z.enum(['1month', '3months', '6months', '1year']).optional().default('3months').describe('Analysis period')
      }),
      execute: async ({ period = '3months' }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'get_performance_trends',
            arguments: { period }
          });
          return result.content[0]?.text || 'Error analyzing performance trends';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    predictRaceTime: tool({
      description: 'Predict race time based on current fitness using VDOT methodology',
      parameters: z.object({
        distance: z.number().describe('Race distance'),
        goalDate: z.string().describe('Race date (YYYY-MM-DD)'),
        distanceUnit: z.enum(['miles', 'kilometers']).optional().default('miles')
      }),
      execute: async ({ distance, goalDate, distanceUnit = 'miles' }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'predict_race_time',
            arguments: { distance, goal_date: goalDate, distance_unit: distanceUnit }
          });
          return result.content[0]?.text || 'Error predicting race time';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    getSocialFeed: tool({
      description: 'Get personalized social feed with posts from followed users and running groups',
      parameters: z.object({
        limit: z.number().optional().default(10).describe('Number of posts to retrieve')
      }),
      execute: async ({ limit = 10 }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'get_social_feed',
            arguments: { limit }
          });
          return result.content[0]?.text || 'No social feed available';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    createRunPost: tool({
      description: 'Create a social media post from a run to share with followers and groups',
      parameters: z.object({
        runId: z.string().describe('ID of the run to share'),
        caption: z.string().optional().describe('Optional caption for the post'),
        shareToGroups: z.enum(['true', 'false']).optional().default('false').describe('Share to all joined groups')
      }),
      execute: async ({ runId, caption, shareToGroups = 'false' }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'create_run_post',
            arguments: { run_id: runId, caption, share_to_groups: shareToGroups }
          });
          return result.content[0]?.text || 'Error creating post';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    // =========================================================================
    // HEALTH & RECOVERY TOOLS
    // =========================================================================

    analyzeInjuryRisk: tool({
      description: 'Analyze injury risk based on training load, patterns, and history',
      parameters: z.object({
        timePeriod: z.enum(['2weeks', '4weeks', '8weeks', '12weeks']).optional().default('4weeks').describe('Period to analyze')
      }),
      execute: async ({ timePeriod = '4weeks' }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'analyze_injury_risk',
            arguments: { time_period: timePeriod }
          });
          return result.content[0]?.text || 'Error analyzing injury risk';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    getRecoveryRecommendations: tool({
      description: 'Get personalized recovery recommendations based on recent training',
      parameters: z.object({
        focusArea: z.enum(['general', 'legs', 'aerobic', 'strength', 'flexibility']).optional().default('general').describe('Recovery focus area')
      }),
      execute: async ({ focusArea = 'general' }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'get_recovery_recommendations',
            arguments: { focus_area: focusArea }
          });
          return result.content[0]?.text || 'Error getting recovery recommendations';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    analyzeTrainingLoad: tool({
      description: 'Analyze training load progression and provide optimization recommendations',
      parameters: z.object({
        period: z.enum(['2weeks', '4weeks', '8weeks', '12weeks']).optional().default('4weeks').describe('Analysis period')
      }),
      execute: async ({ period = '4weeks' }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'analyze_training_load',
            arguments: { period }
          });
          return result.content[0]?.text || 'Error analyzing training load';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    getHealthInsights: tool({
      description: 'Get comprehensive health insights based on training patterns and user profile',
      parameters: z.object({}),
      execute: async () => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'get_health_insights',
            arguments: {}
          });
          return result.content[0]?.text || 'Error getting health insights';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    // =========================================================================
    // ROUTE & ENVIRONMENT TOOLS
    // =========================================================================

    analyzeEnvironmentImpact: tool({
      description: 'Analyze how different training environments affect performance',
      parameters: z.object({
        timePeriod: z.enum(['2weeks', '4weeks', '8weeks', '12weeks']).optional().default('4weeks').describe('Period to analyze')
      }),
      execute: async ({ timePeriod = '4weeks' }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'analyze_environment_impact',
            arguments: { time_period: timePeriod }
          });
          return result.content[0]?.text || 'Error analyzing environment impact';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    getRouteRecommendations: tool({
      description: 'Get intelligent route recommendations based on goals and conditions',
      parameters: z.object({
        goalType: z.enum(['speed', 'endurance', 'recovery', 'hills', 'general']).optional().default('general').describe('Type of training'),
        distance: z.number().optional().default(5.0).describe('Target distance for the route'),
        conditions: z.enum(['hot', 'cold', 'rainy', 'windy', 'any']).optional().default('any').describe('Weather/environmental conditions')
      }),
      execute: async ({ goalType = 'general', distance = 5.0, conditions = 'any' }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'get_route_recommendations',
            arguments: { goal_type: goalType, distance, conditions }
          });
          return result.content[0]?.text || 'Error getting route recommendations';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    analyzeElevationImpact: tool({
      description: 'Analyze how elevation affects performance and provide hill training recommendations',
      parameters: z.object({}),
      execute: async () => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'analyze_elevation_impact',
            arguments: {}
          });
          return result.content[0]?.text || 'Error analyzing elevation impact';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    getSeasonalTrainingAdvice: tool({
      description: 'Get seasonal training advice based on current conditions and time of year',
      parameters: z.object({
        season: z.enum(['spring', 'summer', 'fall', 'winter', 'current']).optional().default('current').describe('Season to get advice for')
      }),
      execute: async ({ season = 'current' }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'get_seasonal_training_advice',
            arguments: { season }
          });
          return result.content[0]?.text || 'Error getting seasonal advice';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    optimizeTrainingEnvironment: tool({
      description: 'Analyze training environment patterns and suggest optimizations',
      parameters: z.object({}),
      execute: async () => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'optimize_training_environment',
            arguments: {}
          });
          return result.content[0]?.text || 'Error optimizing training environment';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    // =========================================================================
    // EQUIPMENT & GEAR TOOLS
    // =========================================================================

    analyzeShoeRotation: tool({
      description: 'Analyze shoe rotation patterns and provide optimization recommendations',
      parameters: z.object({}),
      execute: async () => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'analyze_shoe_rotation',
            arguments: {}
          });
          return result.content[0]?.text || 'Error analyzing shoe rotation';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    getGearRecommendations: tool({
      description: 'Get intelligent gear recommendations based on training goals and conditions',
      parameters: z.object({
        scenario: z.enum(['racing', 'long_runs', 'speed_work', 'trails', 'weather', 'general']).optional().default('general').describe('Training scenario'),
        season: z.enum(['spring', 'summer', 'fall', 'winter', 'current']).optional().default('current').describe('Season for recommendations')
      }),
      execute: async ({ scenario = 'general', season = 'current' }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'get_gear_recommendations',
            arguments: { scenario, season }
          });
          return result.content[0]?.text || 'Error getting gear recommendations';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    trackEquipmentMaintenance: tool({
      description: 'Track equipment maintenance needs and provide scheduling recommendations',
      parameters: z.object({
        equipmentType: z.enum(['shoes', 'all']).optional().default('shoes').describe('Type of equipment to track')
      }),
      execute: async ({ equipmentType = 'shoes' }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'track_equipment_maintenance',
            arguments: { equipment_type: equipmentType }
          });
          return result.content[0]?.text || 'Error tracking equipment maintenance';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    optimizeGearSelection: tool({
      description: 'Get optimized gear selection recommendations for specific runs',
      parameters: z.object({
        runType: z.enum(['easy', 'tempo', 'intervals', 'long', 'race', 'recovery']).optional().default('general').describe('Type of run'),
        distance: z.number().optional().default(5.0).describe('Distance of the planned run')
      }),
      execute: async ({ runType = 'general', distance = 5.0 }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'optimize_gear_selection',
            arguments: { run_type: runType, distance }
          });
          return result.content[0]?.text || 'Error optimizing gear selection';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    planEquipmentLifecycle: tool({
      description: 'Plan equipment lifecycle and replacement strategies',
      parameters: z.object({}),
      execute: async () => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'plan_equipment_lifecycle',
            arguments: {}
          });
          return result.content[0]?.text || 'Error planning equipment lifecycle';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    // =========================================================================
    // COMPETITION & RACING TOOLS
    // =========================================================================

    createRaceStrategy: tool({
      description: 'Create a comprehensive race strategy based on fitness and race details',
      parameters: z.object({
        raceDistance: z.number().describe('Distance of the race in miles'),
        goalTime: z.string().describe('Target finish time (HH:MM:SS format)'),
        raceDate: z.string().describe('Race date (YYYY-MM-DD format)'),
        courseType: z.enum(['road', 'trail', 'track', 'hilly', 'flat']).optional().default('road').describe('Type of course')
      }),
      execute: async ({ raceDistance, goalTime, raceDate, courseType = 'road' }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'create_race_strategy',
            arguments: { race_distance: raceDistance, goal_time: goalTime, race_date: raceDate, course_type: courseType }
          });
          return result.content[0]?.text || 'Error creating race strategy';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    analyzeRaceReadiness: tool({
      description: 'Analyze readiness for an upcoming race based on training history',
      parameters: z.object({
        raceDistance: z.number().describe('Distance of the upcoming race'),
        raceDate: z.string().describe('Date of the race (YYYY-MM-DD format)')
      }),
      execute: async ({ raceDistance, raceDate }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'analyze_race_readiness',
            arguments: { race_distance: raceDistance, race_date: raceDate }
          });
          return result.content[0]?.text || 'Error analyzing race readiness';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    benchmarkPerformance: tool({
      description: 'Benchmark performance against previous runs and estimated potential',
      parameters: z.object({
        timePeriod: z.enum(['3months', '6months', '1year', 'all']).optional().default('1year').describe('Period for comparison')
      }),
      execute: async ({ timePeriod = '1year' }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'benchmark_performance',
            arguments: { time_period: timePeriod }
          });
          return result.content[0]?.text || 'Error benchmarking performance';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    planRaceCalendar: tool({
      description: 'Plan an optimal race calendar based on goals and training cycles',
      parameters: z.object({
        season: z.enum(['spring', 'summer', 'fall', 'winter', 'current', 'year']).optional().default('current').describe('Target season'),
        focus: z.enum(['5k', '10k', 'half', 'marathon', 'trail', 'general']).optional().default('general').describe('Training focus')
      }),
      execute: async ({ season = 'current', focus = 'general' }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'plan_race_calendar',
            arguments: { season, focus }
          });
          return result.content[0]?.text || 'Error planning race calendar';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    analyzePostRacePerformance: tool({
      description: 'Analyze post-race performance and provide insights for future improvement',
      parameters: z.object({
        raceDistance: z.number().describe('Distance of the completed race'),
        raceTime: z.string().describe('Actual finish time (HH:MM:SS format)'),
        raceDate: z.string().describe('Date of the race (YYYY-MM-DD format)'),
        effortLevel: z.enum(['maximum', 'hard', 'moderate', 'easy']).optional().default('maximum').describe('Perceived effort')
      }),
      execute: async ({ raceDistance, raceTime, raceDate, effortLevel = 'maximum' }) => {
        try {
          await mcpClient.callTool({
            name: 'set_current_user_tool',
            arguments: { user_id: userId }
          });
          
          const result = await mcpClient.callTool({
            name: 'analyze_post_race_performance',
            arguments: { race_distance: raceDistance, race_time: raceTime, race_date: raceDate, effort_level: effortLevel }
          });
          return result.content[0]?.text || 'Error analyzing post-race performance';
        } catch (error) {
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

**Core Data Access:**
- getSmartUserContext: Get comprehensive user context and insights about their running
- getUserRuns: Get user's recent running data with metrics and analysis
- listUserShoes: Get user's shoe collection and mileage information
- analyzeUserPatterns: Analyze running patterns and provide insights
- getMotivationalContext: Get motivational context for encouraging responses

**Data Management:**
- addRun: Add new run records (date, duration, distance, notes, etc.)
- addShoe: Add new running shoes to track mileage and usage

**Advanced Training & Analytics:**
- generateTrainingPlan: Create intelligent training plans based on user's fitness and goals
- getActiveTrainingPlan: Get current training plan with progress tracking
- setRunningGoal: Set specific running goals (distance PR, race time, weekly mileage, consistency)
- getGoalProgress: Track progress toward all active goals with motivation
- getPerformanceTrends: Detailed performance analytics over different time periods
- predictRaceTime: VDOT-based race time predictions with confidence levels

**Social Features:**
- getSocialFeed: Get personalized social feed from followed users and groups
- createRunPost: Share runs socially with captions and group sharing

**Conversation Intelligence:**
- updateConversationIntelligence: Track conversation context and sentiment
- getDatabaseSummary: Get database statistics (for debugging only)

**Advanced Capabilities:**
You can now provide sophisticated training guidance, generate personalized training plans, set and track goals, analyze performance trends, predict race times, and help users engage with the running community. Use these tools intelligently based on what the user is asking for.

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