import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { listRuns } from '@lib/api/run';
import type { Run } from '@maratypes/run';

export interface RecentRun {
  id: string;
  date: string;
  distance: string;
  time: string;
  pace: string;
}

export function useRecentRuns(limit: number = 3) {
  const { data: session } = useSession();
  const [runs, setRuns] = useState<RecentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchRuns() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const userRuns = await listRuns(session.user.id);
        
        if (mounted) {
          const recentRuns = userRuns
            .slice(0, limit)
            .map(run => formatRunForDisplay(run));
          setRuns(recentRuns);
        }
      } catch (err) {
        console.error('Recent runs fetch error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch runs');
          setRuns([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchRuns();

    return () => {
      mounted = false;
    };
  }, [session?.user?.id, limit]);

  return { runs, loading, error };
}

function formatRunForDisplay(run: Run): RecentRun {
  const runDate = new Date(run.date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - runDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let dateDisplay: string;
  if (diffDays === 1) {
    dateDisplay = 'Yesterday';
  } else if (diffDays === 2) {
    dateDisplay = '2 days ago';
  } else if (diffDays <= 7) {
    dateDisplay = `${diffDays} days ago`;
  } else {
    dateDisplay = runDate.toLocaleDateString();
  }

  // Format distance with unit
  const distance = run.distanceUnit === 'kilometers' 
    ? `${run.distance.toFixed(1)} km`
    : `${run.distance.toFixed(1)} mi`;

  // Format duration (assuming HH:MM:SS or MM:SS format)
  const time = formatDuration(run.duration);

  // Format pace or calculate if not available
  let pace: string;
  if (run.pace?.pace) {
    const paceUnit = run.pace.unit === 'kilometers' ? '/km' : '/mi';
    pace = `${run.pace.pace}${paceUnit}`;
  } else {
    // Calculate pace from duration and distance
    pace = calculatePace(run.duration, run.distance, run.distanceUnit);
  }

  return {
    id: run.id || Math.random().toString(),
    date: dateDisplay,
    distance,
    time,
    pace
  };
}

function formatDuration(duration: string): string {
  // Handle different duration formats (HH:MM:SS, MM:SS, etc.)
  const parts = duration.split(':');
  
  if (parts.length === 3) {
    // HH:MM:SS format
    const hours = parseInt(parts[0]);
    const minutes = parts[1];
    const seconds = parts[2];
    
    if (hours > 0) {
      return `${hours}:${minutes}:${seconds}`;
    } else {
      return `${minutes}:${seconds}`;
    }
  } else if (parts.length === 2) {
    // MM:SS format
    return duration;
  }
  
  return duration; // Return as-is if unrecognized format
}

function calculatePace(duration: string, distance: number, unit: string): string {
  try {
    const parts = duration.split(':');
    let totalSeconds = 0;
    
    if (parts.length === 3) {
      // HH:MM:SS
      totalSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    } else if (parts.length === 2) {
      // MM:SS
      totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else {
      return 'N/A';
    }
    
    const paceSecondsPerUnit = totalSeconds / distance;
    const paceMinutes = Math.floor(paceSecondsPerUnit / 60);
    const paceSeconds = Math.round(paceSecondsPerUnit % 60);
    
    const paceUnit = unit === 'kilometers' ? '/km' : '/mi';
    return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}${paceUnit}`;
  } catch {
    return 'N/A';
  }
}