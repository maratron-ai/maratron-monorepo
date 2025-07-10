import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';

export interface TodaysWorkout {
  hasTrainingPlan: boolean;
  workoutType: string;
  distance: string;
  pace: string;
  duration: string;
  notes: string;
  isRestDay?: boolean;
  hasWorkoutToday?: boolean;
  nextWorkout?: {
    date: string;
    workoutType: string;
    distance: string;
    pace: string;
    duration: string;
    notes: string;
    isRestDay?: boolean;
  };
}

export function useTrainingPlan() {
  const { data: session } = useSession();
  const [todaysWorkout, setTodaysWorkout] = useState<TodaysWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchTrainingPlan() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Call our API endpoint to get training plan
        try {
          const response = await axios.post('/api/training-plan', {
            userId: session.user.id
          });

          if (mounted) {
            if (response.data && response.data.hasTrainingPlan) {
              setTodaysWorkout(response.data);
            } else {
              // No active training plan, provide general recommendation
              setTodaysWorkout({
                hasTrainingPlan: false,
                hasWorkoutToday: false,
                workoutType: "Easy Run",
                distance: "3-5 miles",
                pace: "Conversational pace",
                duration: "25-40 min",
                notes: "Focus on keeping an easy, comfortable pace that allows you to hold a conversation"
              });
            }
          }
        } catch (apiError) {
          // If API fails, no workout data available
          if (mounted) {
            setTodaysWorkout(null);
          }
        }
      } catch (err) {
        console.error('Training plan fetch error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch training plan');
          setTodaysWorkout(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchTrainingPlan();

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  return { todaysWorkout, loading, error };
}

function parseTrainingPlanData(planText: string): TodaysWorkout {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(planText);
    
    // Handle different response formats
    const todaysWorkout = parsed.today || parsed.todaysWorkout || parsed;
    
    return {
      hasTrainingPlan: true,
      workoutType: todaysWorkout.type || todaysWorkout.workoutType || "Easy Run",
      distance: todaysWorkout.distance || "5 miles",
      pace: todaysWorkout.pace || todaysWorkout.targetPace || "8:30-9:00 min/mi",
      duration: todaysWorkout.duration || todaysWorkout.estimatedDuration || "40-45 min",
      notes: todaysWorkout.notes || todaysWorkout.description || "Follow your training plan",
      isRestDay: todaysWorkout.isRestDay || todaysWorkout.type === 'rest'
    };
  } catch {
    // Fallback text parsing
    let workoutType = "Easy Run";
    let distance = "5 miles";
    let pace = "Conversational pace";
    let duration = "40-45 min";
    let notes = "Follow your training plan";
    let isRestDay = false;

    const lowerText = planText.toLowerCase();
    
    // Detect workout type
    if (lowerText.includes('rest') || lowerText.includes('off')) {
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

    // Extract distance if mentioned
    const distanceMatch = planText.match(/(\d+(?:\.\d+)?)\s*(miles?|mi|km|kilometers?)/i);
    if (distanceMatch) {
      const value = parseFloat(distanceMatch[1]);
      const unit = distanceMatch[2].toLowerCase();
      if (unit.includes('km') || unit.includes('kilometer')) {
        distance = `${(value * 0.621371).toFixed(1)} miles`;
      } else {
        distance = `${value} miles`;
      }
    }

    return {
      hasTrainingPlan: true,
      workoutType,
      distance,
      pace,
      duration,
      notes,
      isRestDay
    };
  }
}