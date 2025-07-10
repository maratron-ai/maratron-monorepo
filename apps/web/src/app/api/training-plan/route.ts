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

    // Try to use MCP client to get training plan (server-side only)
    try {
      const mcpClient = getMCPClient();
      await mcpClient.connect();
      await mcpClient.setUserContext(userId);
      
      const result = await mcpClient.callTool({
        name: 'get_active_training_plan',
        arguments: {}
      });

      if (!result.isError && result.content[0]?.text) {
        // Parse training plan data from MCP response
        const planText = result.content[0].text;
        let planData;
        
        try {
          const parsed = JSON.parse(planText);
          
          // Check if there's actually an active training plan
          if (parsed.hasActivePlan === false || parsed.status === 'no_plan' || 
              parsed.error?.includes('no active training plan') ||
              planText.toLowerCase().includes('no active training plan') ||
              planText.toLowerCase().includes('no training plan found')) {
            // No active training plan
            return NextResponse.json({
              hasTrainingPlan: false,
              hasWorkoutToday: false,
              workoutType: "Easy Run",
              distance: "3-5 miles",
              pace: "Conversational pace",
              duration: "25-40 min",
              notes: "Focus on keeping an easy, comfortable pace that allows you to hold a conversation"
            });
          }
          
          const todaysWorkout = parsed.today || parsed.todaysWorkout || parsed;
          const nextWorkout = parsed.next || parsed.nextWorkout;
          
          const hasWorkoutToday = todaysWorkout && !todaysWorkout.noWorkout;
          
          planData = {
            hasTrainingPlan: true,
            hasWorkoutToday,
            workoutType: todaysWorkout?.type || todaysWorkout?.workoutType || "Easy Run",
            distance: todaysWorkout?.distance || "5 miles",
            pace: todaysWorkout?.pace || todaysWorkout?.targetPace || "8:30-9:00 min/mi",
            duration: todaysWorkout?.duration || todaysWorkout?.estimatedDuration || "40-45 min",
            notes: todaysWorkout?.notes || todaysWorkout?.description || "Follow your training plan",
            isRestDay: todaysWorkout?.isRestDay || todaysWorkout?.type === 'rest',
            nextWorkout: nextWorkout ? {
              date: nextWorkout.date || "Tomorrow",
              workoutType: nextWorkout.type || nextWorkout.workoutType || "Easy Run",
              distance: nextWorkout.distance || "5 miles",
              pace: nextWorkout.pace || nextWorkout.targetPace || "8:30-9:00 min/mi",
              duration: nextWorkout.duration || nextWorkout.estimatedDuration || "40-45 min",
              notes: nextWorkout.notes || nextWorkout.description || "Follow your training plan",
              isRestDay: nextWorkout.isRestDay || nextWorkout.type === 'rest'
            } : undefined
          };
        } catch {
          // Fallback text parsing - first check if it indicates no plan
          const lowerText = planText.toLowerCase();
          
          if (lowerText.includes('no active training plan') || 
              lowerText.includes('no training plan found') ||
              lowerText.includes('no plan active') ||
              lowerText.includes('create a training plan')) {
            // No active training plan
            return NextResponse.json({
              hasTrainingPlan: false,
              hasWorkoutToday: false,
              workoutType: "Easy Run",
              distance: "3-5 miles",
              pace: "Conversational pace",
              duration: "25-40 min",
              notes: "Focus on keeping an easy, comfortable pace that allows you to hold a conversation"
            });
          }
          
          // If we reach here, assume there is a training plan
          let workoutType = "Easy Run";
          let distance = "5 miles";
          let pace = "Conversational pace";
          let duration = "40-45 min";
          let notes = "Follow your training plan";
          let isRestDay = false;
          let hasWorkoutToday = true;
          
          if (lowerText.includes('no workout') || lowerText.includes('off day')) {
            hasWorkoutToday = false;
            notes = "No workout scheduled for today";
          } else if (lowerText.includes('rest') || lowerText.includes('off')) {
            workoutType = "Rest Day";
            isRestDay = true;
            notes = "Take a well-deserved rest day for recovery";
          } else if (lowerText.includes('tempo')) {
            workoutType = "Tempo Run";
            pace = "Comfortably hard";
          } else if (lowerText.includes('interval') || lowerText.includes('speed')) {
            workoutType = "Interval Training";
            pace = "Fast pace with recovery";
          } else if (lowerText.includes('long')) {
            workoutType = "Long Run";
            distance = "8-12 miles";
            duration = "60-90 min";
          }

          planData = {
            hasTrainingPlan: true,
            hasWorkoutToday,
            workoutType,
            distance,
            pace,
            duration,
            notes,
            isRestDay
          };
        }

        return NextResponse.json(planData);
      }
    } catch (mcpError) {
      console.warn('MCP training plan request failed, using fallback:', mcpError);
    }

    // Return general recommendation when MCP fails
    return NextResponse.json({
      hasTrainingPlan: false,
      hasWorkoutToday: false,
      workoutType: "Easy Run",
      distance: "3-5 miles",
      pace: "Conversational pace",
      duration: "25-40 min",
      notes: "Focus on keeping an easy, comfortable pace that allows you to hold a conversation"
    });
  } catch (error) {
    console.error('Training plan API error:', error);
    
    // Return general recommendation on error
    return NextResponse.json({
      hasTrainingPlan: false,
      hasWorkoutToday: false,
      workoutType: "Easy Run",
      distance: "3-5 miles",
      pace: "Conversational pace",
      duration: "25-40 min",
      notes: "Focus on keeping an easy, comfortable pace that allows you to hold a conversation"
    });
  }
});