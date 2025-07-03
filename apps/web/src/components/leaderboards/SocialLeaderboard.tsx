'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Spinner } from '@components/ui/spinner';
import { Avatar, AvatarImage, AvatarFallback } from '@components/ui/avatar';
import { 
  Trophy,
  RefreshCw,
  CalendarDays,
  CalendarRange,
  Medal,
  Award
} from 'lucide-react';
import { 
  LeaderboardData, 
  LeaderboardPeriod
} from '@maratypes/leaderboard';
import { cn } from '@lib/utils/cn';

interface SocialLeaderboardProps {
  groupId: string;
  title?: string;
  className?: string;
}

const periodConfig = {
  weekly: {
    label: 'Week',
    icon: CalendarDays,
    description: 'This week\'s distance',
  },
  monthly: {
    label: 'Month',
    icon: CalendarRange,
    description: 'This month\'s distance',
  },
};

export function SocialLeaderboard({ 
  groupId, 
  title,
  className 
}: SocialLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('weekly');

  // Memoized fetch function to prevent infinite loops
  const fetchLeaderboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        period: selectedPeriod,
        type: 'group',
        groupId: groupId,
        limit: '3',
      });

      const response = await fetch(`/api/leaderboards?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leaderboard data');
      }

      if (data.success) {
        setLeaderboardData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch leaderboard data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, groupId]);

  // Fetch data when filters change
  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  const handleUserClick = (entry: { socialProfile?: { username: string } | null }) => {
    // Navigate to user profile using username if available
    if (entry.socialProfile?.username) {
      window.location.href = `/u/${entry.socialProfile.username}`;
    }
  };

  const handleRefresh = () => {
    fetchLeaderboardData();
  };

  const getTitle = () => {
    if (title) return title;
    return 'Leaderboard';
  };

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Award className="w-4 h-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-700 bg-yellow-50/50 border-yellow-200/50';
      case 2:
        return 'text-gray-700 bg-gray-50/50 border-gray-200/50';
      case 3:
        return 'text-amber-700 bg-amber-50/50 border-amber-200/50';
      default:
        return 'text-muted-foreground bg-muted/30 border-border/50';
    }
  };

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Spinner className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leaderboardData || leaderboardData.entries.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              {getTitle()}
            </CardTitle>
            <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as LeaderboardPeriod)}>
              <TabsList className="h-8">
                {Object.entries(periodConfig).map(([period, config]) => (
                  <TabsTrigger key={period} value={period} className="text-xs px-3">
                    {config.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No runs this {selectedPeriod === 'weekly' ? 'week' : 'month'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            {getTitle()}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {leaderboardData.totalParticipants} runners
            </Badge>
            <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as LeaderboardPeriod)}>
              <TabsList className="h-8">
                {Object.entries(periodConfig).map(([period, config]) => (
                  <TabsTrigger key={period} value={period} className="text-xs px-3">
                    {config.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          {leaderboardData.entries.slice(0, 3).map((entry) => (
            <div
              key={entry.userId}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg border transition-colors',
                entry.socialProfile?.username ? 'cursor-pointer hover:bg-muted/50' : 'cursor-default',
                getMedalColor(entry.rank)
              )}
              onClick={() => handleUserClick(entry)}
            >
              {/* Rank & Medal */}
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted/30 border text-xs font-medium">
                {entry.rank <= 3 ? getMedalIcon(entry.rank) : entry.rank}
              </div>

              {/* Avatar */}
              <Avatar className="w-8 h-8">
                <AvatarImage src={entry.user.avatarUrl || undefined} alt={entry.user.name} />
                <AvatarFallback className="text-xs">
                  {entry.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              {/* Name & Distance */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{entry.user.name}</p>
                <p className="text-xs text-muted-foreground">{entry.formattedValue}</p>
              </div>

              {/* Rank Badge for top 3 */}
              {entry.rank <= 3 && (
                <Badge 
                  variant={entry.rank === 1 ? 'default' : 'secondary'} 
                  className="text-xs"
                >
                  #{entry.rank}
                </Badge>
              )}
            </div>
          ))}

          {/* Show user's position if not in top 3 */}
          {leaderboardData.userEntry && 
           !leaderboardData.entries.slice(0, 3).find(e => e.userId === leaderboardData.userEntry!.userId) && (
            <>
              <div className="text-center py-1">
                <div className="text-xs text-muted-foreground">...</div>
              </div>
              <div
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg border bg-muted/30 border-primary/20 transition-colors',
                  leaderboardData.userEntry!.socialProfile?.username ? 'cursor-pointer hover:bg-muted/40' : 'cursor-default'
                )}
                onClick={() => handleUserClick(leaderboardData.userEntry!)}
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {leaderboardData.userEntry.rank}
                </div>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={leaderboardData.userEntry.user.avatarUrl || undefined} alt={leaderboardData.userEntry.user.name} />
                  <AvatarFallback className="text-xs">
                    {leaderboardData.userEntry.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{leaderboardData.userEntry.user.name}</p>
                  <p className="text-xs text-muted-foreground">{leaderboardData.userEntry.formattedValue}</p>
                </div>
                <Badge variant="outline" className="text-xs">You</Badge>
              </div>
            </>
          )}
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center mt-3 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={cn('w-3 h-3 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}