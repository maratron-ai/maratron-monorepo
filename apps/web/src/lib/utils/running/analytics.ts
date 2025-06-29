import type { Run } from "@maratypes/run";
import { parseDuration } from "@lib/utils/time/parseDuration";

interface AnalyticsData {
  totalRuns: number;
  totalDistance: number;
  totalTime: number;
  averagePace: string;
  longestRun: number;
  weeklyAverage: number;
  monthlyTrend: { week: string; distance: number; runs: number; weekDate: string; weekStart: Date }[];
  paceProgression: { month: string; pace: string; paceMinutes: number; monthDate: string; weekStart: Date }[];
  distanceDistribution: { range: string; count: number; percentage: number }[];
  weeklyDistanceChart: { week: string; distance: number; runs: number; weekStart: Date; weekTimestamp: number }[];
  cumulativeDistance: { month: string; total: number; weekStart: Date; weekTimestamp: number }[];
}

export function calculateAnalytics(runs: Run[]): AnalyticsData {
  if (runs.length === 0) {
    return {
      totalRuns: 0,
      totalDistance: 0,
      totalTime: 0,
      averagePace: "0:00",
      longestRun: 0,
      weeklyAverage: 0,
      monthlyTrend: [],
      paceProgression: [],
      distanceDistribution: [],
      weeklyDistanceChart: [],
      cumulativeDistance: [],
    };
  }

  // Convert all distances to miles for consistency
  const normalizedRuns = runs.map(run => ({
    ...run,
    distanceInMiles: run.distanceUnit === "kilometers" ? run.distance * 0.621371 : run.distance,
    durationInMinutes: parseDuration(run.duration) / 60,
  }));

  // Basic stats
  const totalRuns = normalizedRuns.length;
  const totalDistance = normalizedRuns.reduce((sum, run) => sum + run.distanceInMiles, 0);
  const totalTime = normalizedRuns.reduce((sum, run) => sum + run.durationInMinutes, 0);
  const longestRun = Math.max(...normalizedRuns.map(run => run.distanceInMiles));

  // Average pace calculation
  const averagePaceMinutes = totalDistance > 0 ? totalTime / totalDistance : 0;
  const averagePace = formatPace(averagePaceMinutes);

  // Weekly average (assume data spans multiple weeks)
  const dateRange = getDateRange(normalizedRuns);
  const weeksDifference = Math.max(1, Math.ceil(dateRange / 7));
  const weeklyAverage = totalDistance / weeksDifference;

  // Monthly trend (last 12 weeks)
  const monthlyTrend = calculateMonthlyTrend(normalizedRuns);

  // Pace progression (last 6 months)
  const paceProgression = calculatePaceProgression(normalizedRuns);

  // Distance distribution
  const distanceDistribution = calculateDistanceDistribution(normalizedRuns);

  // Weekly distance chart with timestamps for proper time axis
  const weeklyDistanceChart = monthlyTrend.map(week => ({
    ...week,
    weekTimestamp: week.weekStart.getTime(),
  }));

  // Cumulative distance over time
  const cumulativeDistance = calculateCumulativeDistance(normalizedRuns);

  return {
    totalRuns,
    totalDistance,
    totalTime,
    averagePace,
    longestRun,
    weeklyAverage,
    monthlyTrend,
    paceProgression,
    distanceDistribution,
    weeklyDistanceChart,
    cumulativeDistance,
  };
}

function formatPace(paceInMinutes: number): string {
  if (paceInMinutes === 0) return "0:00";
  const minutes = Math.floor(paceInMinutes);
  const seconds = Math.round((paceInMinutes - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getDateRange(runs: { date: Date }[]): number {
  if (runs.length === 0) return 0;
  const dates = runs.map(run => new Date(run.date).getTime());
  const earliest = Math.min(...dates);
  const latest = Math.max(...dates);
  return (latest - earliest) / (1000 * 60 * 60 * 24); // days
}

function calculateMonthlyTrend(runs: { date: Date; distanceInMiles: number }[]): 
  { week: string; distance: number; runs: number; weekDate: string; weekStart: Date }[] {
  // Generate a complete set of weeks covering the data range plus 12 weeks back
  const now = new Date();
  
  // Generate 12 weeks of complete week intervals
  const weeks = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - (i * 7)); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    weeks.push(weekStart);
  }
  
  // Group runs by week
  const weeklyData = new Map<string, { distance: number; runs: number; weekStart: Date }>();
  
  weeks.forEach(weekStart => {
    const weekKey = weekStart.toISOString().split('T')[0];
    weeklyData.set(weekKey, { distance: 0, runs: 0, weekStart: new Date(weekStart) });
  });
  
  runs.forEach(run => {
    const date = new Date(run.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (weeklyData.has(weekKey)) {
      const existing = weeklyData.get(weekKey)!;
      existing.distance += run.distanceInMiles;
      existing.runs += 1;
    }
  });

  return Array.from(weeklyData.entries())
    .map(([weekKey, data]) => ({
      week: formatWeekLabel(weekKey),
      distance: Math.round(data.distance * 10) / 10,
      runs: data.runs,
      weekDate: weekKey,
      weekStart: data.weekStart,
    }))
    .sort((a, b) => a.weekDate.localeCompare(b.weekDate));
}

function calculatePaceProgression(runs: { date: Date; distanceInMiles: number; durationInMinutes: number }[]): 
  { month: string; pace: string; paceMinutes: number; monthDate: string; weekStart: Date; weekTimestamp: number }[] {
  // Generate 12 weeks of complete week intervals for pace progression
  const now = new Date();
  const weeks = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - (i * 7)); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    weeks.push(weekStart);
  }
  
  // Group runs by week
  const weeklyData = new Map<string, { totalDistance: number; totalTime: number; weekStart: Date }>();
  
  weeks.forEach(weekStart => {
    const weekKey = weekStart.toISOString().split('T')[0];
    weeklyData.set(weekKey, { totalDistance: 0, totalTime: 0, weekStart: new Date(weekStart) });
  });
  
  runs.forEach(run => {
    const date = new Date(run.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (weeklyData.has(weekKey)) {
      const existing = weeklyData.get(weekKey)!;
      existing.totalDistance += run.distanceInMiles;
      existing.totalTime += run.durationInMinutes;
    }
  });

  return Array.from(weeklyData.entries())
    .map(([weekKey, data]) => {
      const paceMinutes = data.totalDistance > 0 ? data.totalTime / data.totalDistance : 0;
      return {
        month: formatWeekLabel(weekKey), // Using week label instead of month
        pace: formatPace(paceMinutes),
        paceMinutes: Math.round(paceMinutes * 100) / 100,
        monthDate: weekKey,
        weekStart: data.weekStart,
        weekTimestamp: data.weekStart.getTime(),
      };
    })
    .filter(entry => entry.paceMinutes > 0) // Only include weeks with actual runs
    .sort((a, b) => a.monthDate.localeCompare(b.monthDate));
}

function calculateDistanceDistribution(runs: { distanceInMiles: number }[]): 
  { range: string; count: number; percentage: number }[] {
  const ranges = [
    { range: "0-1 miles", min: 0, max: 1 },
    { range: "1-3 miles", min: 1.01, max: 3 },
    { range: "3-5 miles", min: 3.01, max: 5 },
    { range: "5-10 miles", min: 5.01, max: 10 },
    { range: "10-15 miles", min: 10.01, max: 15 },
    { range: "15+ miles", min: 15.01, max: Infinity },
  ];

  const totalRuns = runs.length;
  return ranges.map(({ range, min, max }) => {
    const count = runs.filter(run => run.distanceInMiles >= min && run.distanceInMiles <= max).length;
    return {
      range,
      count,
      percentage: totalRuns > 0 ? Math.round((count / totalRuns) * 100) : 0,
    };
  });
}

function formatWeekLabel(weekString: string): string {
  const date = new Date(weekString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}


function calculateCumulativeDistance(runs: { date: Date; distanceInMiles: number }[]): 
  { month: string; total: number; weekStart: Date; weekTimestamp: number }[] {
  // Generate 12 weeks of complete week intervals
  const now = new Date();
  const weeks = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - (i * 7)); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    weeks.push(weekStart);
  }
  
  // Group runs by week
  const weeklyData = new Map<string, { distance: number; weekStart: Date }>();
  
  weeks.forEach(weekStart => {
    const weekKey = weekStart.toISOString().split('T')[0];
    weeklyData.set(weekKey, { distance: 0, weekStart: new Date(weekStart) });
  });
  
  runs.forEach(run => {
    const date = new Date(run.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (weeklyData.has(weekKey)) {
      const existing = weeklyData.get(weekKey)!;
      existing.distance += run.distanceInMiles;
    }
  });

  // Convert to cumulative totals
  let cumulative = 0;
  return Array.from(weeklyData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekKey, data]) => {
      cumulative += data.distance;
      return {
        month: formatWeekLabel(weekKey),
        total: Math.round(cumulative * 10) / 10,
        weekStart: data.weekStart,
        weekTimestamp: data.weekStart.getTime(),
      };
    });
}