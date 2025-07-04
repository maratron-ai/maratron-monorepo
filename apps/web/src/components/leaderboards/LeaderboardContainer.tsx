'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Spinner } from '@components/ui/spinner';
import { Alert } from '@components/ui/alert';
import { 
  Users, 
  Globe, 
  UserCheck,
  RefreshCw,
  Filter,
  Trophy
} from 'lucide-react';
import { LeaderboardPodium } from './LeaderboardPodium';
import { LeaderboardTable } from './LeaderboardTable';
import { LeaderboardTabs } from './LeaderboardTabs';
import { 
  LeaderboardData, 
  LeaderboardPeriod, 
  LeaderboardMetric, 
  LeaderboardType,
  PodiumEntry
} from '@maratypes/leaderboard';
import { cn } from '@lib/utils/cn';

interface LeaderboardContainerProps {
  className?: string;
}

export function LeaderboardContainer({ className }: LeaderboardContainerProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('weekly');
  const [selectedMetric, setSelectedMetric] = useState<LeaderboardMetric>('totalDistance');
  const [selectedType, setSelectedType] = useState<LeaderboardType>('global');
  const [selectedGroupId] = useState<string | null>(null);

  // Fetch leaderboard data
  const fetchLeaderboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        period: selectedPeriod,
        metric: selectedMetric,
        type: selectedType,
        limit: '10',
      });

      if (selectedType === 'group' && selectedGroupId) {
        params.append('groupId', selectedGroupId);
      }

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
  }, [selectedPeriod, selectedMetric, selectedType, selectedGroupId]);

  // Fetch data when filters change
  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  // Get podium entries (top 3)
  const getPodiumEntries = (): PodiumEntry[] => {
    if (!leaderboardData?.entries) return [];
    
    return leaderboardData.entries.slice(0, 3).map((entry, index) => ({
      ...entry,
      medal: index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze',
      celebration: index === 0, // Only first place gets celebration
    }));
  };

  // Get table entries (rank 4-10)
  // const getTableEntries = () => {
  //   if (!leaderboardData?.entries) return [];
  //   return leaderboardData.entries.slice(3);
  // };

  const handleUserClick = (userId: string) => {
    // Navigate to user profile
    window.location.href = `/profile/${userId}`;
  };

  const handleRefresh = () => {
    fetchLeaderboardData();
  };

  const typeConfig = {
    global: {
      label: 'Global',
      icon: Globe,
      description: 'All runners worldwide',
    },
    friends: {
      label: 'Friends',
      icon: UserCheck,
      description: 'People you follow',
    },
    group: {
      label: 'Groups',
      icon: Users,
      description: 'Your running groups',
    },
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold">Leaderboards</h1>
            <p className="text-muted-foreground">
              Compete with runners around the world
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Type Filter */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Leaderboard Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(typeConfig).map(([type, config]) => {
              const Icon = config.icon;
              const isSelected = selectedType === type;
              
              return (
                <Button
                  key={type}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type as LeaderboardType)}
                  className="flex items-center gap-2"
                  data-testid={`type-filter-${type}`}
                >
                  <Icon className="w-4 h-4" />
                  {config.label}
                </Button>
              );
            })}
          </div>
          
          {selectedType === 'friends' && (
            <Alert className="mt-3">
              <UserCheck className="w-4 h-4" />
              <div className="ml-2">
                <p className="text-sm">
                  Sign in to view your friends leaderboard
                </p>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Period and Metric Tabs */}
      <Card>
        <CardContent className="pt-6">
          <LeaderboardTabs
            selectedPeriod={selectedPeriod}
            selectedMetric={selectedMetric}
            onPeriodChange={setSelectedPeriod}
            onMetricChange={setSelectedMetric}
          />
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <div className="ml-2">
            <h4 className="font-medium">Error loading leaderboard</h4>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Spinner className="w-6 h-6" />
              <span>Loading leaderboard data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Content */}
      {!loading && !error && leaderboardData && (
        <>
          {/* Podium */}
          {getPodiumEntries().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <LeaderboardPodium
                  entries={getPodiumEntries()}
                  onUserClick={handleUserClick}
                />
              </CardContent>
            </Card>
          )}

          {/* Full Rankings Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Full Rankings</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {leaderboardData.totalParticipants} participants
                </Badge>
                {leaderboardData.userEntry && !leaderboardData.entries.find(e => e.userId === leaderboardData.userEntry!.userId) && (
                  <Badge variant="secondary">
                    You&apos;re rank #{leaderboardData.userEntry.rank}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <LeaderboardTable
                entries={leaderboardData.entries}
                onUserClick={handleUserClick}
                currentUserId={leaderboardData.userEntry?.userId}
                hideChangeOnMobile={true}
                mobileCompact={true}
              />
              
              {/* Show user's position if not in top 10 */}
              {leaderboardData.userEntry && 
               !leaderboardData.entries.find(e => e.userId === leaderboardData.userEntry!.userId) && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Your Position
                  </h4>
                  <LeaderboardTable
                    entries={[leaderboardData.userEntry]}
                    onUserClick={handleUserClick}
                    currentUserId={leaderboardData.userEntry.userId}
                    hideChangeOnMobile={true}
                    mobileCompact={true}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!loading && !error && leaderboardData && leaderboardData.entries.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-4">
              No runners found for the selected criteria. Try adjusting your filters.
            </p>
            <Button variant="outline" onClick={handleRefresh}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}