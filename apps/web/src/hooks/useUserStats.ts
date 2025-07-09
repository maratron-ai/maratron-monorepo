import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { listRuns } from '@lib/api/run';
import type { Run } from '@maratypes/run';

export interface UserStats {
  weekMiles: number;
  weekRuns: number;
  currentStreak: number;
  goalProgress: number;
  totalRuns: number;
  totalMiles: number;
}

export function useUserStats() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user's runs
        const runs = await listRuns(session.user.id);
        
        if (mounted) {
          const calculatedStats = calculateStats(runs);
          setStats(calculatedStats);
        }
      } catch (err) {
        console.error('Stats fetch error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch stats');
          setStats(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchStats();

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  return { stats, loading, error };
}

function calculateStats(runs: Run[]): UserStats {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of current week
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Calculate weekly stats
  const weekRuns = runs.filter(run => new Date(run.date) >= weekStart);
  const weekMiles = weekRuns.reduce((total, run) => {
    const distance = run.distanceUnit === 'kilometers' ? run.distance * 0.621371 : run.distance;
    return total + distance;
  }, 0);

  // Calculate monthly goal progress (assuming 100 miles/month goal)
  const monthRuns = runs.filter(run => new Date(run.date) >= monthStart);
  const monthMiles = monthRuns.reduce((total, run) => {
    const distance = run.distanceUnit === 'kilometers' ? run.distance * 0.621371 : run.distance;
    return total + distance;
  }, 0);
  const goalProgress = Math.min(Math.round((monthMiles / 100) * 100), 100);

  // Calculate running streak
  const currentStreak = calculateRunningStreak(runs);

  // Total stats
  const totalMiles = runs.reduce((total, run) => {
    const distance = run.distanceUnit === 'kilometers' ? run.distance * 0.621371 : run.distance;
    return total + distance;
  }, 0);

  return {
    weekMiles: Math.round(weekMiles * 10) / 10,
    weekRuns: weekRuns.length,
    currentStreak,
    goalProgress,
    totalRuns: runs.length,
    totalMiles: Math.round(totalMiles * 10) / 10
  };
}

function calculateRunningStreak(runs: Run[]): number {
  if (runs.length === 0) return 0;

  // Sort runs by date (most recent first)
  const sortedRuns = runs
    .map(run => new Date(run.date))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Check if there's a run today or yesterday to start the streak
  const mostRecentRun = sortedRuns[0];
  mostRecentRun.setHours(0, 0, 0, 0);

  if (mostRecentRun.getTime() !== today.getTime() && 
      mostRecentRun.getTime() !== yesterday.getTime()) {
    return 0; // No recent runs
  }

  // Count consecutive days with runs
  let streak = 0;
  let currentDate = new Date(mostRecentRun);
  
  for (const runDate of sortedRuns) {
    const runDateNormalized = new Date(runDate);
    runDateNormalized.setHours(0, 0, 0, 0);
    
    if (runDateNormalized.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (runDateNormalized.getTime() < currentDate.getTime()) {
      // Gap in the streak
      break;
    }
  }

  return streak;
}