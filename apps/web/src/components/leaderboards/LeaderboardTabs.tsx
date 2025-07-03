'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Badge } from '@components/ui/badge';
import { 
  Calendar,
  CalendarDays,
  CalendarRange,
  Trophy,
  Timer,
  Target,
  TrendingUp,
  Activity
} from 'lucide-react';
import { LeaderboardPeriod, LeaderboardMetric } from '@maratypes/leaderboard';
import { cn } from '@lib/utils/cn';

interface LeaderboardTabsProps {
  selectedPeriod: LeaderboardPeriod;
  selectedMetric: LeaderboardMetric;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  onMetricChange: (metric: LeaderboardMetric) => void;
  className?: string;
}

const periodConfig = {
  daily: {
    label: 'Daily',
    icon: Calendar,
    description: 'Today\'s performance',
  },
  weekly: {
    label: 'Weekly',
    icon: CalendarDays,
    description: 'This week\'s totals',
  },
  monthly: {
    label: 'Monthly',
    icon: CalendarRange,
    description: 'This month\'s totals',
  },
  yearly: {
    label: 'Yearly',
    icon: Trophy,
    description: 'This year\'s totals',
  },
};

const metricConfig = {
  totalDistance: {
    label: 'Distance',
    icon: Target,
    description: 'Total miles/km run',
    color: 'blue',
  },
  totalRuns: {
    label: 'Runs',
    icon: Activity,
    description: 'Number of runs',
    color: 'green',
  },
  averagePace: {
    label: 'Pace',
    icon: Timer,
    description: 'Average pace per mile/km',
    color: 'purple',
  },
  longestRun: {
    label: 'Longest',
    icon: TrendingUp,
    description: 'Longest single run',
    color: 'orange',
  },
  weeklyMileage: {
    label: 'Weekly',
    icon: CalendarDays,
    description: 'Weekly mileage average',
    color: 'pink',
  },
  consistency: {
    label: 'Consistency',
    icon: Trophy,
    description: 'Running consistency %',
    color: 'indigo',
  },
};

export function LeaderboardTabs({
  selectedPeriod,
  selectedMetric,
  onPeriodChange,
  onMetricChange,
  className,
}: LeaderboardTabsProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Period Tabs */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Time Period</h3>
        <Tabs 
          value={selectedPeriod} 
          onValueChange={(value) => onPeriodChange(value as LeaderboardPeriod)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            {Object.entries(periodConfig).map(([period, config]) => {
              const Icon = config.icon;
              return (
                <TabsTrigger
                  key={period}
                  value={period}
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  data-testid={`period-tab-${period}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{config.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Metric Tabs */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Metric</h3>
        <Tabs 
          value={selectedMetric} 
          onValueChange={(value) => onMetricChange(value as LeaderboardMetric)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            {Object.entries(metricConfig).map(([metric, config]) => {
              const Icon = config.icon;
              const isSelected = selectedMetric === metric;
              
              return (
                <TabsTrigger
                  key={metric}
                  value={metric}
                  className={cn(
                    'flex items-center gap-2 relative',
                    'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
                  )}
                  data-testid={`metric-tab-${metric}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline text-xs">{config.label}</span>
                  
                  {/* Active indicator */}
                  {isSelected && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        'absolute -top-2 -right-2 w-2 h-2 p-0 rounded-full',
                        `bg-${config.color}-500`
                      )}
                    />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Current Selection Info */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Showing:</span>
            <Badge variant="outline">
              {periodConfig[selectedPeriod].label}
            </Badge>
            <Badge variant="outline">
              {metricConfig[selectedMetric].label}
            </Badge>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {metricConfig[selectedMetric].description}
        </div>
      </div>
    </div>
  );
}