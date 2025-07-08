"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { listRuns } from "@lib/api/run";
import { Card, Spinner } from "@components/ui";
import type { Run } from "@maratypes/run";
import { calculateAnalytics } from "@lib/utils/running/analytics";
import { isDemoMode, getDemoAnalyticsData } from "@lib/utils/demo-mode";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  
  // Demo mode for testing/screenshots
  const demoMode = isDemoMode();

  useEffect(() => {
    const fetchAnalytics = async () => {
      // In demo mode, use sample data
      if (demoMode) {
        setAnalytics(getDemoAnalyticsData());
        setLoading(false);
        return;
      }
      
      const userId = session?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const allRuns = await listRuns(userId);
        setRuns(allRuns);
        
        const analyticsData = calculateAnalytics(allRuns);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [session?.user?.id, demoMode]);

  if (!session?.user && !demoMode) {
    return (
      <div className="container mx-auto px-4 max-w-screen-lg py-8">
        <p className="text-center text-muted-foreground">Please log in to view your analytics.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 max-w-screen-lg py-8">
        <div className="flex justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  if (!analytics || runs.length === 0) {
    return (
      <div className="container mx-auto px-4 max-w-screen-lg py-8">
        <h1 className="text-3xl font-bold mb-8">Analytics & Insights</h1>
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">No Data Available</h2>
          <p className="text-muted-foreground">
            Start logging your runs to see your analytics and insights!
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-screen-lg py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics & Insights</h1>
      
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-brand-purple">{analytics.totalRuns}</div>
          <div className="text-sm text-muted-foreground">Total Runs</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-brand-purple">
            {analytics.totalDistance.toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground">Total Miles</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-brand-purple">
            {Math.floor(analytics.totalTime / 60)}h {Math.floor(analytics.totalTime % 60)}m
          </div>
          <div className="text-sm text-muted-foreground">Total Time</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-brand-purple">{analytics.averagePace}</div>
          <div className="text-sm text-muted-foreground">Avg Pace</div>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4 text-center">
          <div className="text-xl font-bold">{analytics.longestRun.toFixed(1)} mi</div>
          <div className="text-sm text-muted-foreground">Longest Run</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-xl font-bold">{analytics.weeklyAverage.toFixed(1)} mi</div>
          <div className="text-sm text-muted-foreground">Weekly Average</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-xl font-bold">
            {analytics.totalDistance > 0 ? (analytics.totalTime / analytics.totalDistance).toFixed(1) : '0'} min/mi
          </div>
          <div className="text-sm text-muted-foreground">Time per Mile</div>
        </Card>
      </div>

      {/* Weekly Distance Trend Chart */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Weekly Distance Trend</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.weeklyDistanceChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
              <XAxis 
                dataKey="weekTimestamp"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(timestamp) => {
                  const date = new Date(timestamp);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
                stroke="var(--muted-foreground)"
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--accent)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "var(--foreground)" }}
                labelFormatter={(timestamp) => {
                  const date = new Date(timestamp);
                  return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                }}
                formatter={(value: number) => [`${value} miles`, "Distance"]}
              />
              <Area
                type="monotone"
                dataKey="distance"
                stroke="var(--brand-purple)"
                fill="var(--brand-purple)"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Weekly distance over the last 12 weeks
        </div>
      </Card>

      {/* Distance Distribution Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Distance Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.distanceDistribution.filter(d => d.count > 0)}
                  dataKey="count"
                  nameKey="range"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ range, percentage }) => `${range}: ${percentage}%`}
                  labelLine={false}
                  fontSize={11}
                  fill="var(--foreground)"
                >
                  {analytics.distanceDistribution.filter(d => d.count > 0).map((entry, index) => {
                    // Create more differentiable colors using different hues
                    const colors = [
                      'rgba(139, 92, 246, 1.0)',    // brand-purple (primary)
                      'rgba(59, 130, 246, 0.85)',   // brand-blue
                      'rgba(168, 85, 247, 0.7)',    // violet
                      'rgba(45, 212, 191, 0.6)',    // teal
                      'rgba(251, 146, 60, 0.5)',    // orange
                      'rgba(239, 68, 68, 0.4)',     // red
                    ];
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={colors[index % colors.length]}
                      />
                    );
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--accent)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Cumulative Distance Progress */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Cumulative Distance Progress</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.cumulativeDistance}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
                <XAxis 
                  dataKey="weekTimestamp"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(timestamp) => {
                    const date = new Date(timestamp);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--accent)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                  labelFormatter={(timestamp) => {
                    const date = new Date(timestamp);
                    return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                  }}
                  formatter={(value: number) => [`${value} miles`, "Total Distance"]}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--brand-purple)"
                  fill="var(--brand-purple)"
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Total distance accumulated over time
          </div>
        </Card>
      </div>

      {/* Pace Progression Line Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Pace Progression</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.paceProgression}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
              <XAxis 
                dataKey="weekTimestamp"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(timestamp) => {
                  const date = new Date(timestamp);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
                stroke="var(--muted-foreground)"
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="var(--muted-foreground)"
                fontSize={12}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                tickFormatter={(value) => `${Math.floor(value)}:${Math.round((value % 1) * 60).toString().padStart(2, '0')}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--accent)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "var(--foreground)" }}
                labelFormatter={(timestamp) => {
                  const date = new Date(timestamp);
                  return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                }}
                formatter={(value: number) => [`${Math.floor(value)}:${Math.round((value % 1) * 60).toString().padStart(2, '0')} min/mi`, "Average Pace"]}
              />
              <Line
                type="monotone"
                dataKey="paceMinutes"
                stroke="var(--brand-purple)"
                strokeWidth={3}
                dot={{ fill: "var(--brand-purple)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "var(--brand-purple)", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Average pace improvement over the last 6 months (lower is better)
        </div>
      </Card>
    </div>
  );
}