'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Badge } from '@components/ui/badge';
import { Trophy, Medal, Crown } from 'lucide-react';
import { PodiumEntry } from '@maratypes/leaderboard';
import { cn } from '@lib/utils/cn';

interface LeaderboardPodiumProps {
  entries: PodiumEntry[];
  onUserClick?: (userId: string) => void;
  mobileVertical?: boolean;
  className?: string;
}

const getMedalIcon = (medal: 'gold' | 'silver' | 'bronze') => {
  switch (medal) {
    case 'gold':
      return <Crown className="w-6 h-6 text-yellow-500" data-testid="trophy-gold" />;
    case 'silver':
      return <Trophy className="w-6 h-6 text-gray-400" data-testid="trophy-silver" />;
    case 'bronze':
      return <Medal className="w-6 h-6 text-amber-600" data-testid="trophy-bronze" />;
  }
};

const getMedalColor = (medal: 'gold' | 'silver' | 'bronze') => {
  switch (medal) {
    case 'gold':
      return 'bg-gradient-to-b from-yellow-400 to-yellow-600 text-yellow-900 medal-gold';
    case 'silver':
      return 'bg-gradient-to-b from-gray-300 to-gray-500 text-gray-900 medal-silver';
    case 'bronze':
      return 'bg-gradient-to-b from-amber-400 to-amber-600 text-amber-900 medal-bronze';
  }
};

const getPlatformHeight = (rank: number) => {
  switch (rank) {
    case 1:
      return 'h-32'; // Tallest for 1st place
    case 2:
      return 'h-24'; // Medium for 2nd place
    case 3:
      return 'h-20'; // Shortest for 3rd place
    default:
      return 'h-16';
  }
};

const getPositionOrder = (rank: number) => {
  // Visual arrangement: 2nd, 1st, 3rd (left to right)
  switch (rank) {
    case 1:
      return 'order-2'; // Center
    case 2:
      return 'order-1'; // Left
    case 3:
      return 'order-3'; // Right
    default:
      return 'order-last';
  }
};

const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function LeaderboardPodium({ 
  entries, 
  onUserClick, 
  mobileVertical = false,
  className 
}: LeaderboardPodiumProps) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <p>No podium data available</p>
      </div>
    );
  }

  const handleUserClick = (userId: string) => {
    onUserClick?.(userId);
  };

  const handleKeyDown = (event: React.KeyboardEvent, userId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleUserClick(userId);
    }
  };

  return (
    <div
      role="region"
      aria-label="Leaderboard top 3 podium"
      className={cn(
        'w-full max-w-4xl mx-auto p-6',
        'responsive-podium',
        mobileVertical && 'mobile-vertical',
        className
      )}
      data-testid="podium-container"
    >
      <div className={cn(
        'flex items-end justify-center gap-4 mb-8',
        mobileVertical ? 'flex-col md:flex-row' : 'flex-row'
      )}>
        {entries.slice(0, 3).map((entry) => (
          <div
            key={entry.userId}
            className={cn(
              'flex flex-col items-center cursor-pointer transition-all duration-300',
              'hover:scale-105 hover-active focus:outline-none focus:ring-2 focus:ring-primary',
              'group relative',
              getPositionOrder(entry.rank),
              entry.rank === 1 ? 'podium-center podium-tallest' : '',
              entry.rank === 2 ? 'podium-left' : '',
              entry.rank === 3 ? 'podium-right' : '',
              entry.celebration ? 'celebration-active' : ''
            )}
            role="button"
            tabIndex={0}
            aria-label={`${entry.rank === 1 ? '1st' : entry.rank === 2 ? '2nd' : '3rd'} place: ${entry.user.name} with ${entry.formattedValue}`}
            data-testid={`podium-position-${entry.rank}`}
            onClick={() => handleUserClick(entry.userId)}
            onKeyDown={(e) => handleKeyDown(e, entry.userId)}
          >
            {/* Medal/Trophy */}
            <div 
              className={cn(
                'relative mb-2 p-3 rounded-full',
                getMedalColor(entry.medal),
                'shadow-lg'
              )}
              data-testid={`medal-${entry.medal}`}
            >
              {getMedalIcon(entry.medal)}
              {entry.celebration && entry.rank === 1 && (
                <div className="absolute -inset-1 bg-yellow-400/20 rounded-full animate-pulse" />
              )}
            </div>

            {/* User Avatar */}
            <div className="relative mb-3">
              <Avatar className={cn(
                'w-16 h-16 border-4 transition-all',
                entry.rank === 1 ? 'border-yellow-400 w-20 h-20' : 
                entry.rank === 2 ? 'border-gray-400' : 'border-amber-600'
              )}>
                <AvatarImage 
                  src={entry.user.avatarUrl || entry.socialProfile?.profilePhoto || undefined} 
                  alt={entry.user.name}
                  data-testid={`avatar-${entry.userId}`}
                />
                <AvatarFallback data-testid={`avatar-${entry.userId}`}>
                  {getUserInitials(entry.user.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* User Name */}
            <h3 
              className={cn(
                'font-semibold text-center mb-1 truncate max-w-[120px]',
                entry.rank === 1 ? 'text-lg' : 'text-base'
              )}
              data-testid={`user-name-${entry.userId}`}
            >
              {entry.user.name}
            </h3>

            {/* Value */}
            <Badge 
              variant="secondary" 
              className={cn(
                'mb-4 font-medium',
                entry.rank === 1 ? 'text-sm' : 'text-xs'
              )}
            >
              {entry.formattedValue}
            </Badge>

            {/* Podium Platform */}
            <div
              className={cn(
                'w-24 rounded-t-lg flex items-end justify-center',
                'bg-gradient-to-t from-slate-700 to-slate-500',
                'shadow-lg relative overflow-hidden',
                getPlatformHeight(entry.rank),
                `platform-height-${entry.rank}`
              )}
              data-testid={`platform-${entry.rank}`}
            >
              {/* Platform shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000" />
              
              {/* Rank Number */}
              <div 
                className={cn(
                  'absolute bottom-2 text-white font-bold',
                  entry.rank === 1 ? 'text-2xl' : 'text-xl'
                )}
                data-testid={`rank-number-${entry.rank}`}
              >
                {entry.rank}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Achievement Badges */}
      {entries.some(entry => entry.badge) && (
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {entries.map(entry => 
            entry.badge && (
              <Badge 
                key={`${entry.userId}-badge`}
                variant="outline" 
                className="text-xs"
              >
                {entry.badge.label}
              </Badge>
            )
          )}
        </div>
      )}

      {/* Celebration Effects */}
      {entries.some(entry => entry.celebration) && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
            {/* Confetti or sparkle effects could go here */}
            <div className="text-4xl animate-bounce">🎉</div>
          </div>
        </div>
      )}
    </div>
  );
}