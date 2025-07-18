/**
 * Chat Handler - Business logic for MCP-enhanced chat API with Function Calling
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { MaratronMCPClient } from '@lib/mcp/client';
import { MCPToolCall } from '@lib/mcp/types';
import { prisma } from '@lib/prisma';
import { buildChatSystemPrompt, hasSelectedCoach, getCoachDisplayName } from '@lib/coaches/prompt-builder';
import type { UserWithCoach } from '@lib/coaches/prompt-builder';
import { validateChatMessage } from '@lib/utils/validation/apiValidator';
import { cache } from '@lib/cache/cache-manager';

export interface AuthResult {
  isAuthenticated: boolean;
  userId?: string;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  timezone?: string;
  error?: string;
}

export interface ChatResponse {
  content: string;
  mcpStatus: 'enhanced' | 'no-data-needed' | 'fallback';
  systemPrompt: string;
  toolCalls: MCPToolCall[];
  error?: string;
  coachName?: string;
  coachIcon?: string;
}

/**
 * Create MCP tool definitions for Claude function calling
 * Note: User context is automatically set by the system
 */
function createMCPTools(mcpClient: MaratronMCPClient) {
  return {

    getSmartUserContext: tool({
      description: 'Get comprehensive, intelligent user context for personalized responses',
      parameters: z.object({}),
      execute: async () => {
        try {
          // User context already set by session handler
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
          // User context already set by session handler
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
          
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
        runType: z.enum(['easy', 'tempo', 'intervals', 'long', 'race', 'recovery']).optional().default('easy').describe('Type of run'),
        distance: z.number().optional().default(5.0).describe('Distance of the planned run')
      }),
      execute: async ({ runType = 'easy', distance = 5.0 }) => {
        try {
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
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
          // User context already set by session handler
          const result = await mcpClient.callTool({
            name: 'analyze_post_race_performance',
            arguments: { race_distance: raceDistance, race_time: raceTime, race_date: raceDate, effort_level: effortLevel }
          });
          return result.content[0]?.text || 'Error analyzing post-race performance';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    getCurrentDateTime: tool({
      description: 'Get current date and time in user\'s timezone',
      parameters: z.object({}),
      execute: async () => {
        try {
          const result = await mcpClient.callTool({
            name: 'get_current_datetime',
            arguments: {}
          });
          return result.content[0]?.text || 'Time unavailable';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    // =========================================================================
    // WEATHER TOOLS
    // =========================================================================

    getCurrentWeather: tool({
      description: 'Get current weather conditions for running planning',
      parameters: z.object({
        location: z.string().optional().describe('Location name (city, state/country) or coordinates (lat,lon). If not provided, uses user default location if available.')
      }),
      execute: async ({ location }) => {
        try {
          const result = await mcpClient.callTool({
            name: 'get_current_weather',
            arguments: { location }
          });
          return result.content[0]?.text || 'Weather unavailable';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    getWeatherForecast: tool({
      description: 'Get weather forecast for running planning',
      parameters: z.object({
        location: z.string().optional().describe('Location name (city, state/country) or coordinates (lat,lon). If not provided, uses user default location if available.'),
        days: z.number().optional().default(5).describe('Number of days to forecast (1-5)')
      }),
      execute: async ({ location, days = 5 }) => {
        try {
          const result = await mcpClient.callTool({
            name: 'get_weather_forecast',
            arguments: { location, days }
          });
          return result.content[0]?.text || 'Forecast unavailable';
        } catch (error) {
          return `Error: ${String(error)}`;
        }
      }
    }),

    analyzeWeatherImpact: tool({
      description: 'Analyze weather impact on running performance and provide recommendations',
      parameters: z.object({
        location: z.string().optional().describe('Location name (city, state/country) or coordinates (lat,lon). If not provided, uses user default location if available.')
      }),
      execute: async ({ location }) => {
        try {
          const result = await mcpClient.callTool({
            name: 'analyze_weather_impact',
            arguments: { location }
          });
          return result.content[0]?.text || 'Weather analysis unavailable';
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
 * Validate chat request format with enhanced security
 */
export function validateChatRequest(request: unknown): ValidationResult {
  const typedRequest = request as { messages?: unknown[]; timezone?: string } | null;
  
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

  // Validate each message with enhanced validation
  const validatedMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
  
  for (const message of typedRequest.messages) {
    const validation = validateChatMessage(message);
    
    if (!validation.isValid) {
      return {
        isValid: false,
        error: validation.error
      };
    }
    
    validatedMessages.push(validation.sanitizedMessage!);
  }

  // Extract timezone if provided
  const timezone = typedRequest.timezone || undefined;

  return {
    isValid: true,
    messages: validatedMessages,
    timezone
  };
}

/**
 * Handle MCP-enhanced chat with function calling integration
 */
export async function handleMCPEnhancedChat(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  userId: string,
  mcpClient: MaratronMCPClient | null,
  timezone?: string
): Promise<ChatResponse> {
  const toolCalls: MCPToolCall[] = [];
  let mcpStatus: 'enhanced' | 'no-data-needed' | 'fallback' = 'fallback';
  let coachName: string | undefined;
  let coachIcon: string | undefined;

  // Fetch user with selected coach for persona integration
  let user: UserWithCoach | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: { selectedCoach: true }
    });

    if (user && hasSelectedCoach(user)) {
      coachName = getCoachDisplayName(user) || undefined;
      coachIcon = user.selectedCoach?.icon;
    }
  } catch (error) {
    console.warn('Failed to fetch user coach information:', error);
    // Continue with default behavior
  }

  // Create base system prompt
  const baseSystemPrompt = `You are Maratron AI, an expert running and fitness coach powered by Claude 3.5.

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

**Date & Time Context:**
- getCurrentDateTime: Get current date and time in user's timezone

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

  // Create coach-enhanced system prompt
  const userContext = user ? `User: ${user.name}` : '';
  const systemPrompt = user 
    ? buildChatSystemPrompt(user, userContext)
    : baseSystemPrompt;

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
        toolCalls,
        coachName,
        coachIcon
      };
    }

    // Set user context for this session (only if not already set)
    try {
      if (!mcpClient.isUserContextSet(userId, timezone)) {
        console.log(`🔧 Setting user context with caching for: ${userId}`);
        
        // Use cached user context or fetch fresh data
        const userContextData = await cache.user.context(userId, async () => {
          console.log(`📊 Fetching fresh user context data for: ${userId}`);
          
          // Fetch basic user data that MCP will need
          const userData = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              name: true,
              email: true,
              defaultDistanceUnit: true,
              defaultElevationUnit: true,
              trainingLevel: true,
              goals: true,
              createdAt: true
            }
          });
          
          if (!userData) {
            console.warn(`User ${userId} not found in database`);
            return null; // Return null instead of throwing
          }
          
          // Get recent run count for context
          const recentRunCount = await prisma.run.count({
            where: {
              userId: userId,
              date: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
              }
            }
          });
          
          return {
            ...userData,
            recentRunCount,
            cachedAt: new Date().toISOString()
          };
        });
        
        if (userContextData) {
          console.log(`✅ User context data loaded (${userContextData?.cachedAt ? 'from cache' : 'fresh fetch'})`);
          
          // Set user context in MCP server (will skip if already set)
          await mcpClient.setUserContext(userId, timezone);
          console.log(`User context set for: ${userId}${timezone ? ` with timezone: ${timezone}` : ''}`);
        } else {
          console.warn(`⚠️ User ${userId} not found - continuing with limited context`);
          // Still set basic user context for MCP even if user data is missing
          await mcpClient.setUserContext(userId, timezone);
        }
      } else {
        console.log(`⚡ User context already established for: ${userId} - skipping cache/MCP setup`);
      }
    } catch (error) {
      console.warn(`Failed to set user context for ${userId}:`, error);
      // Continue anyway - some tools might still work
    }

    // Create MCP tools for function calling
    const tools = createMCPTools(mcpClient);
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
    const toolResults: string[] = [];
    if (planningResult.toolCalls && planningResult.toolCalls.length > 0) {
      console.log('🔄 Phase 2: Executing tools...');
      
      // Ensure user context is set before executing any tools (skip redundant context setting)
      console.log(`✅ User context already set, proceeding with tool execution`);
      // Note: User context was already set above with caching, no need to set again
      
      // Build toolCalls array for tracking
      for (const toolCall of planningResult.toolCalls) {
        toolCalls.push({
          name: toolCall.toolName,
          arguments: toolCall.args as Record<string, unknown>
        });
      }

      // Execute all tools in parallel
      console.log(`🛠️ Executing ${planningResult.toolCalls.length} tools in parallel...`);
      const toolPromises = planningResult.toolCalls.map(async (toolCall) => {
        try {
          console.log(`🛠️ Starting tool: ${toolCall.toolName}`);
          const toolFunction = tools[toolCall.toolName as keyof typeof tools];
          if (toolFunction && 'execute' in toolFunction) {
            const result = await (toolFunction.execute as (args: Record<string, unknown>) => Promise<string>)(toolCall.args as Record<string, unknown>);
            console.log(`✅ Tool ${toolCall.toolName} returned ${String(result).length} characters`);
            return String(result);
          }
          return `Tool ${toolCall.toolName} not found`;
        } catch (error) {
          console.error(`❌ Tool ${toolCall.toolName} failed:`, error);
          return `Error executing ${toolCall.toolName}: ${String(error)}`;
        }
      });

      // Wait for all tools to complete
      const parallelResults = await Promise.all(toolPromises);
      toolResults.push(...parallelResults);
      console.log(`✅ All ${planningResult.toolCalls.length} tools completed in parallel`);

      // Phase 3: Generate final response with tool results
      console.log('🔄 Phase 3: Generating final response with tool data...');
      
      const finalMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages,
        { 
          role: 'user' as const, 
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
        toolCalls,
        coachName,
        coachIcon
      };
    } else {
      // No tools needed, return planning result
      console.log('📝 No tools needed, returning direct response');
      return {
        content: planningResult.text,
        mcpStatus,
        systemPrompt,
        toolCalls,
        coachName,
        coachIcon
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
        error: 'Function calling failed, using basic mode',
        coachName,
        coachIcon
      };
    } catch (fallbackError) {
      console.error('Fallback generation also failed:', fallbackError);
      
      return {
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.',
        mcpStatus: 'fallback',
        systemPrompt,
        toolCalls,
        error: 'All generation methods failed',
        coachName,
        coachIcon
      };
    }
  }
}

/**
 * Alias for handleMCPEnhancedChat for backwards compatibility and testing
 */
export const generateEnhancedChat = handleMCPEnhancedChat;