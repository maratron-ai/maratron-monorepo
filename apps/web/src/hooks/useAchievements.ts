import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { listRuns } from '@lib/api/run';
import type { Run } from '@maratypes/run';
import { Trophy, Award, Target, Zap } from 'lucide-react';
import axios from 'axios';

export interface Achievement {
  title: string;
  description: string;
  icon: any;
  isNew: boolean;
  date?: Date;
}

export interface Alert {
  type: 'tip' | 'warning' | 'info';
  title: string;
  message: string;
  color: 'green' | 'orange' | 'blue';
}

export function useAchievements() {
  const { data: session } = useSession();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchAchievementsAndAlerts() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get user runs to calculate achievements
        const runs = await listRuns(session.user.id);
        
        // Try to get motivational context from API
        let mcpAchievements: Achievement[] = [];
        let mcpAlerts: Alert[] = [];
        
        try {
          const response = await axios.post('/api/achievements', {
            userId: session.user.id
          });

          if (response.data) {
            const parsed = parseMotivationalData(response.data);
            mcpAchievements = parsed.achievements;
            mcpAlerts = parsed.alerts;
          }
        } catch (apiError) {
          console.warn('API motivational context failed, using local calculations:', apiError);
        }

        if (mounted) {
          // Combine MCP data with locally calculated achievements
          const localAchievements = calculateLocalAchievements(runs);
          const localAlerts = calculateLocalAlerts(runs);
          
          setAchievements([...mcpAchievements, ...localAchievements].slice(0, 3)); // Limit to 3
          setAlerts([...mcpAlerts, ...localAlerts].slice(0, 2)); // Limit to 2
        }
      } catch (err) {
        console.error('Achievements fetch error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch achievements');
          setAchievements([]);
          setAlerts([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchAchievementsAndAlerts();

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  return { achievements, alerts, loading, error };
}

function parseMotivationalData(text: string): { achievements: Achievement[], alerts: Alert[] } {
  try {
    const parsed = JSON.parse(text);
    
    const achievements = (parsed.achievements || []).map((ach: any) => ({
      title: ach.title || ach.name,
      description: ach.description || ach.message,
      icon: getIconFromType(ach.type || 'trophy'),
      isNew: ach.isNew || ach.recent || false,
      date: ach.date ? new Date(ach.date) : undefined
    }));

    const alerts = (parsed.alerts || parsed.tips || []).map((alert: any) => ({
      type: alert.type || 'tip',
      title: alert.title || alert.category,
      message: alert.message || alert.description,
      color: getColorFromType(alert.type || 'tip')
    }));

    return { achievements, alerts };
  } catch {
    return { achievements: [], alerts: [] };
  }
}

function calculateLocalAchievements(runs: Run[]): Achievement[] {
  const achievements: Achievement[] = [];
  
  if (runs.length === 0) return achievements;

  // Calculate streak
  const streak = calculateRunningStreak(runs);
  if (streak >= 3) {
    achievements.push({
      title: `${streak}-Day Streak`,
      description: `${streak} consecutive running days`,
      icon: Zap,
      isNew: streak <= 5
    });
  }

  // Check for recent personal bests (simplified)
  const recentRuns = runs.filter(run => {
    const runDate = new Date(run.date);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return runDate >= monthAgo;
  });

  if (recentRuns.length > 0) {
    const fastestRun = recentRuns.reduce((fastest, run) => {
      if (!run.pace?.pace || !fastest.pace?.pace) return fastest;
      
      const currentPace = parseFloat(run.pace.pace.split(':')[0]) + parseFloat(run.pace.pace.split(':')[1]) / 60;
      const fastestPace = parseFloat(fastest.pace.pace.split(':')[0]) + parseFloat(fastest.pace.pace.split(':')[1]) / 60;
      
      return currentPace < fastestPace ? run : fastest;
    });

    if (fastestRun.pace?.pace) {
      achievements.push({
        title: "Monthly Best",
        description: `Fastest pace this month: ${fastestRun.pace.pace}`,
        icon: Award,
        isNew: false
      });
    }
  }

  // Milestone achievements
  const totalMiles = runs.reduce((total, run) => {
    const distance = run.distanceUnit === 'kilometers' ? run.distance * 0.621371 : run.distance;
    return total + distance;
  }, 0);

  const milestones = [50, 100, 250, 500, 1000];
  const currentMilestone = milestones.find(m => totalMiles >= m && totalMiles < m + 50);
  
  if (currentMilestone) {
    achievements.push({
      title: `${currentMilestone} Mile Club`,
      description: `Reached ${currentMilestone} total miles`,
      icon: Target,
      isNew: totalMiles - currentMilestone < 25
    });
  }

  return achievements;
}

function calculateLocalAlerts(runs: Run[]): Alert[] {
  const alerts: Alert[] = [];

  // Always include a daily tip
  const tips = [
    "Stay hydrated! Drink water 2-3 hours before your run for optimal performance.",
    "Focus on your form: keep your shoulders relaxed and maintain a slight forward lean.",
    "The 80/20 rule: 80% of your runs should be at an easy, conversational pace.",
    "Listen to your body - rest days are just as important as training days."
  ];
  
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  alerts.push({
    type: 'tip',
    title: 'Daily Tip',
    message: randomTip,
    color: 'green'
  });

  // Check if user has been inactive
  if (runs.length > 0) {
    const lastRun = new Date(runs[0].date);
    const daysSinceLastRun = Math.floor((Date.now() - lastRun.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastRun > 7) {
      alerts.push({
        type: 'warning',
        title: 'Activity Reminder',
        message: `It's been ${daysSinceLastRun} days since your last run. Time to get back out there!`,
        color: 'orange'
      });
    }
  }

  return alerts;
}

function calculateRunningStreak(runs: Run[]): number {
  if (runs.length === 0) return 0;

  const sortedRuns = runs
    .map(run => new Date(run.date))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const mostRecentRun = sortedRuns[0];
  mostRecentRun.setHours(0, 0, 0, 0);

  if (mostRecentRun.getTime() !== today.getTime() && 
      mostRecentRun.getTime() !== yesterday.getTime()) {
    return 0;
  }

  let streak = 0;
  let currentDate = new Date(mostRecentRun);
  
  for (const runDate of sortedRuns) {
    const runDateNormalized = new Date(runDate);
    runDateNormalized.setHours(0, 0, 0, 0);
    
    if (runDateNormalized.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (runDateNormalized.getTime() < currentDate.getTime()) {
      break;
    }
  }

  return streak;
}

function getIconFromType(type: string) {
  switch (type.toLowerCase()) {
    case 'streak':
    case 'fire':
      return Zap;
    case 'award':
    case 'pb':
    case 'personal_best':
      return Award;
    case 'target':
    case 'goal':
    case 'milestone':
      return Target;
    default:
      return Trophy;
  }
}

function getColorFromType(type: string): 'green' | 'orange' | 'blue' {
  switch (type.toLowerCase()) {
    case 'tip':
    case 'info':
      return 'green';
    case 'warning':
    case 'alert':
      return 'orange';
    default:
      return 'blue';
  }
}