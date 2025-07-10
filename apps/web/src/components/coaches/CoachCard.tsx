import React from 'react';
import { Card, CardContent } from '@components/ui/card';
import { cn } from '@lib/utils/cn';
import type { CoachPersona } from '@prisma/client';

export interface CoachCardProps {
  coach: CoachPersona;
  isSelected: boolean;
  onSelect: (coachId: string) => void;
  disabled?: boolean;
}

export const CoachCard: React.FC<CoachCardProps> = ({
  coach,
  isSelected,
  onSelect,
  disabled = false,
}) => {
  const handleSelect = () => {
    if (!disabled) {
      onSelect(coach.id);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect();
    }
  };

  // Build aria-label for accessibility
  const ariaLabel = `${coach.name}, ${coach.personality} coach. ${coach.description}${isSelected ? ' (selected)' : ''}`;

  return (
    <Card
      data-testid={`coach-card-${coach.id}`}
      data-selected={isSelected}
      data-coach-id={coach.id}
      data-personality={coach.personality}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2',
        'transform hover:scale-105',
        'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800',
        isSelected && 'ring-4 ring-brand-purple ring-offset-2 border-brand-purple selected shadow-lg shadow-brand-purple/20',
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100 disabled',
        `personality-${coach.personality}`,
        'hover' 
      )}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Coach Icon */}
          <div 
            data-testid="coach-icon" 
            className="text-4xl mb-2"
          >
            {coach.icon || '👤'}
          </div>

          {/* Coach Name */}
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {coach.name}
          </h3>

          {/* Personality Badge */}
          <div className={cn(
            'px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide',
            'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
            isSelected && 'bg-brand-purple text-white'
          )}>
            {coach.personality}
          </div>

          {/* Coach Description */}
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {coach.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};