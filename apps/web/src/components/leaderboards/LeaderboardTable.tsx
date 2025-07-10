'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { 
  ChevronUp, 
  ChevronDown, 
  Minus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { LeaderboardEntry } from '@maratypes/leaderboard';
import { cn } from '@lib/utils/cn';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { DataTablePagination } from '@components/ui/data-table';
import { Card, CardContent } from '@components/ui/card';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
  hideChangeOnMobile?: boolean;
  mobileCompact?: boolean;
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

const getRankChangeIcon = (change: number | undefined, userId: string) => {
  if (change === undefined) {
    return (
      <div className="text-blue-600 dark:text-blue-400 text-xs" data-testid={`rank-change-${userId}`}>
        <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 text-xs">NEW</Badge>
      </div>
    );
  }
  if (change > 0) {
    return (
      <div className="flex items-center text-green-600 dark:text-green-400 text-sm" data-testid={`rank-change-${userId}`}>
        <ChevronUp className="w-3 h-3" />
        <span>+{change}</span>
      </div>
    );
  }
  if (change < 0) {
    return (
      <div className="flex items-center text-red-600 dark:text-red-400 text-sm" data-testid={`rank-change-${userId}`}>
        <ChevronDown className="w-3 h-3" />
        <span>{change}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center text-zinc-400 dark:text-zinc-500 text-sm" data-testid={`rank-change-${userId}`}>
      <Minus className="w-3 h-3" />
      <span>—</span>
    </div>
  );
};

const getUserInitials = (name: string): string => {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .split(' ')
    .filter(n => n.length > 0) // Filter out empty strings
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getBadgeVariant = (badgeType: string) => {
  switch (badgeType) {
    case 'podium':
      return 'default';
    case 'streak':
      return 'secondary';
    case 'improvement':
      return 'outline';
    default:
      return 'secondary';
  }
};

export function LeaderboardTable({
  entries,
  currentUserId,
  onUserClick,
  hideChangeOnMobile = false,
  mobileCompact = false,
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className,
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <p>No leaderboard data available</p>
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

  const handlePageChange = (page: number) => {
    onPageChange?.(page);
  };

  return (
    <div className={cn('w-full', className)}>
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                <TableHead className="w-16 text-center font-medium text-zinc-900 dark:text-zinc-100">
                  Rank
                </TableHead>
                <TableHead className="font-medium text-zinc-900 dark:text-zinc-100">
                  Runner
                </TableHead>
                <TableHead className="text-right font-medium text-zinc-900 dark:text-zinc-100">
                  Distance
                </TableHead>
                <TableHead 
                  className={cn(
                    'text-center w-20 font-medium text-zinc-900 dark:text-zinc-100',
                    hideChangeOnMobile && 'hidden md:table-cell'
                  )}
                >
                  Change
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const isCurrentUser = currentUserId === entry.userId;
                
                return (
                  <TableRow
                    key={entry.userId}
                    role="rowheader"
                    tabIndex={0}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700',
                      'focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600',
                      isCurrentUser && 'bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-300 dark:ring-zinc-600'
                    )}
                    data-testid={`leaderboard-entry-${entry.userId}`}
                    aria-label={`${entry.user.name}, rank ${entry.rank}, ${entry.formattedValue}${
                      entry.change !== undefined 
                        ? entry.change > 0 
                          ? `, moved up ${entry.change} positions`
                          : entry.change < 0
                          ? `, moved down ${Math.abs(entry.change)} positions`
                          : ', no change in position'
                        : ', new entry'
                    }`}
                    onClick={() => handleUserClick(entry.userId)}
                    onKeyDown={(e) => handleKeyDown(e, entry.userId)}
                  >
                    {/* Rank */}
                    <TableCell className="font-bold text-center text-zinc-900 dark:text-zinc-100">
                      <span data-testid={`rank-${entry.rank}-${entry.userId}`}>
                        {entry.rank}
                      </span>
                    </TableCell>

                    {/* Runner Info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <Avatar 
                          className={cn(
                            'border-2 border-zinc-200 dark:border-zinc-700',
                            mobileCompact ? 'w-8 h-8 md:w-10 md:h-10' : 'w-10 h-10'
                          )}
                        >
                          <AvatarImage 
                            src={entry.user.avatarUrl || entry.socialProfile?.profilePhoto || undefined} 
                            alt={entry.user.name}
                            data-testid={`avatar-${entry.userId}`}
                          />
                          <AvatarFallback data-testid={`avatar-${entry.userId}`}>
                            {getUserInitials(entry.user.name)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Name and Badges */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 
                              className={cn(
                                'font-medium truncate text-zinc-900 dark:text-zinc-100',
                                mobileCompact ? 'text-sm' : 'text-base'
                              )}
                              data-testid={`user-name-${entry.userId}`}
                            >
                              {entry.user.name}
                            </h4>
                            {isCurrentUser && (
                              <Badge 
                                variant="secondary" 
                                className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                data-testid="current-user-indicator"
                              >
                                (You)
                              </Badge>
                            )}
                          </div>

                          {/* Badges and Streak */}
                          <div className="flex items-center gap-2 mt-1">
                            {entry.badge && (
                              <Badge 
                                variant={getBadgeVariant(entry.badge.type)}
                                className={cn(
                                  'text-xs',
                                  `badge-${entry.badge.type}`
                                )}
                                data-testid={`badge-${entry.userId}`}
                              >
                                {entry.badge.label}
                              </Badge>
                            )}
                            
                            {entry.streak && entry.streak > 0 && (
                              <div 
                                className="flex items-center text-xs text-orange-600 dark:text-orange-400"
                                data-testid={`streak-${entry.userId}`}
                              >
                                {entry.streak}🔥
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Distance/Value */}
                    <TableCell className="text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {entry.formattedValue}
                    </TableCell>

                    {/* Rank Change */}
                    <TableCell 
                      className={cn(
                        'text-center',
                        hideChangeOnMobile && 'hidden md:table-cell'
                      )}
                    >
                      {getRankChangeIcon(entry.change, entry.userId)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div 
          className="flex items-center justify-between mt-4 px-2"
          data-testid="pagination-controls"
        >
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}