import React from 'react';
import { CoachCard } from './CoachCard';
import { cn } from '@lib/utils/cn';
import type { CoachPersona } from '@prisma/client';

export interface CoachSelectorProps {
  coaches: CoachPersona[];
  selectedCoachId?: string | null;
  onCoachSelect: (coachId: string | null) => void;
  loading?: boolean;
  error?: string | null;
}

export const CoachSelector: React.FC<CoachSelectorProps> = ({
  coaches,
  selectedCoachId,
  onCoachSelect,
  loading = false,
  error = null,
}) => {
  const handleCoachSelect = (coachId: string) => {
    // If already selected, deselect it
    if (selectedCoachId === coachId) {
      onCoachSelect(null);
    } else {
      onCoachSelect(coachId);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div 
        data-testid="coach-selector-loading" 
        className="flex flex-col items-center justify-center p-8 space-y-4"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading coaches...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        data-testid="coach-selector-error" 
        className="flex flex-col items-center justify-center p-8 space-y-4"
      >
        <div className="text-red-500 text-center">
          <p className="font-medium">Error loading coaches</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!coaches || coaches.length === 0) {
    return (
      <div 
        data-testid="coach-selector-empty" 
        className="flex flex-col items-center justify-center p-8 space-y-4"
      >
        <div className="text-gray-500 text-center">
          <p className="font-medium">No coaches available</p>
          <p className="text-sm mt-1">Please check back later</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      role="group" 
      aria-label="Coach selection"
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Choose Your Coach
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select a coaching personality that matches your training style and motivation preferences
        </p>
      </div>

      {/* Coach Grid */}
      <div className={cn(
        'grid gap-6',
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        'max-w-6xl mx-auto'
      )}>
        {coaches.map((coach) => (
          <CoachCard
            key={coach.id}
            coach={coach}
            isSelected={selectedCoachId === coach.id}
            onSelect={handleCoachSelect}
            disabled={loading}
          />
        ))}
      </div>

      {/* Selection Info */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        {selectedCoachId ? (
          <p>Coach selected! Click again to deselect, or choose a different coach.</p>
        ) : (
          <p>Click on a coach to select them as your training companion.</p>
        )}
      </div>
    </div>
  );
};