import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CoachCard } from '../CoachCard';
import type { CoachPersona } from '@prisma/client';

// Mock coach data
const mockCoach: CoachPersona = {
  id: 'coach-1',
  name: 'Thunder McGrath',
  description: 'High-energy motivational coach who pushes you to your limits and helps you achieve breakthrough performances',
  icon: '🏃‍♂️',
  systemPrompt: 'You are Thunder McGrath, a high-energy motivational coach...',
  personality: 'motivational',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CoachCard (TDD - Failing Tests)', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering and Display', () => {
    it('should render coach information correctly', () => {
      render(
        <CoachCard
          coach={mockCoach}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      // Should display coach name
      expect(screen.getByText('Thunder McGrath')).toBeInTheDocument();

      // Should display coach description
      expect(screen.getByText(/High-energy motivational coach/)).toBeInTheDocument();

      // Should display coach icon
      expect(screen.getByText('🏃‍♂️')).toBeInTheDocument();

      // Should display personality type (look for the badge specifically)
      const personalityBadge = screen.getByText('motivational');
      expect(personalityBadge).toBeInTheDocument();
      expect(personalityBadge).toHaveClass('uppercase');
    });

    it('should render with proper test id and data attributes', () => {
      render(
        <CoachCard
          coach={mockCoach}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      const card = screen.getByTestId('coach-card-coach-1');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('data-selected', 'false');
      expect(card).toHaveAttribute('data-coach-id', 'coach-1');
      expect(card).toHaveAttribute('data-personality', 'motivational');
    });

    it('should show selected state visually', () => {
      render(
        <CoachCard
          coach={mockCoach}
          isSelected={true}
          onSelect={mockOnSelect}
        />
      );

      const card = screen.getByTestId('coach-card-coach-1');
      expect(card).toHaveAttribute('data-selected', 'true');
      
      // Should have selected styling class
      expect(card).toHaveClass('selected');
    });

    it('should show unselected state visually', () => {
      render(
        <CoachCard
          coach={mockCoach}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      const card = screen.getByTestId('coach-card-coach-1');
      expect(card).toHaveAttribute('data-selected', 'false');
      expect(card).not.toHaveClass('selected');
    });

    it('should display coach icon prominently', () => {
      render(
        <CoachCard
          coach={mockCoach}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      const icon = screen.getByTestId('coach-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveTextContent('🏃‍♂️');
    });

    it('should handle long descriptions gracefully', () => {
      const coachWithLongDescription = {
        ...mockCoach,
        description: 'This is a very long description that should be truncated or handled gracefully in the UI to prevent layout issues and maintain a clean appearance across all coach cards regardless of description length.'
      };

      render(
        <CoachCard
          coach={coachWithLongDescription}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      // Description should be present but potentially truncated
      expect(screen.getByText(/This is a very long description/)).toBeInTheDocument();
    });
  });

  describe('Interaction Behavior', () => {
    it('should call onSelect when clicked', async () => {
      const user = userEvent.setup();

      render(
        <CoachCard
          coach={mockCoach}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      const card = screen.getByTestId('coach-card-coach-1');
      await user.click(card);

      expect(mockOnSelect).toHaveBeenCalledWith('coach-1');
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('should call onSelect when selected with keyboard', async () => {
      const user = userEvent.setup();

      render(
        <CoachCard
          coach={mockCoach}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      const card = screen.getByTestId('coach-card-coach-1');
      card.focus();
      await user.keyboard('{Enter}');

      expect(mockOnSelect).toHaveBeenCalledWith('coach-1');
    });

    it('should call onSelect when activated with Space key', async () => {
      const user = userEvent.setup();

      render(
        <CoachCard
          coach={mockCoach}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      const card = screen.getByTestId('coach-card-coach-1');
      card.focus();
      await user.keyboard(' ');

      expect(mockOnSelect).toHaveBeenCalledWith('coach-1');
    });

    it('should not call onSelect when disabled', async () => {
      const user = userEvent.setup();

      render(
        <CoachCard
          coach={mockCoach}
          isSelected={false}
          onSelect={mockOnSelect}
          disabled={true}
        />
      );

      const card = screen.getByTestId('coach-card-coach-1');
      await user.click(card);

      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('should show disabled state visually', () => {
      render(
        <CoachCard
          coach={mockCoach}
          isSelected={false}
          onSelect={mockOnSelect}
          disabled={true}
        />
      );

      const card = screen.getByTestId('coach-card-coach-1');
      expect(card).toHaveClass('disabled');
      expect(card).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <CoachCard
          coach={mockCoach}
          isSelected={true}
          onSelect={mockOnSelect}
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'true');
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('Thunder McGrath'));
      expect(card).toHaveAttribute('role', 'button');
    });

    it('should have proper aria-selected when not selected', () => {
      render(
        <CoachCard
          coach={mockCoach}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'false');
    });

    it('should be keyboard focusable', () => {
      render(
        <CoachCard
          coach={mockCoach}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should have descriptive aria-label', () => {
      render(
        <CoachCard
          coach={mockCoach}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      const card = screen.getByRole('button');
      const ariaLabel = card.getAttribute('aria-label');
      
      expect(ariaLabel).toContain('Thunder McGrath');
      expect(ariaLabel).toContain('motivational');
      expect(ariaLabel).toContain('High-energy motivational coach');
    });

    it('should indicate selection state in aria-label', () => {
      render(
        <CoachCard
          coach={mockCoach}
          isSelected={true}
          onSelect={mockOnSelect}
        />
      );

      const card = screen.getByRole('button');
      const ariaLabel = card.getAttribute('aria-label');
      
      expect(ariaLabel).toContain('selected');
    });
  });

  describe('Styling and Visual States', () => {
    it('should apply hover effects', async () => {
      const user = userEvent.setup();

      render(
        <CoachCard
          coach={mockCoach}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      const card = screen.getByTestId('coach-card-coach-1');
      
      await user.hover(card);
      expect(card).toHaveClass('hover');
    });

    it('should apply focus styles', async () => {
      const user = userEvent.setup();

      render(
        <CoachCard
          coach={mockCoach}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      const card = screen.getByTestId('coach-card-coach-1');
      
      await user.tab(); // Focus on the card
      expect(card).toHaveFocus();
    });

    it('should have personality-based styling', () => {
      render(
        <CoachCard
          coach={mockCoach}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      const card = screen.getByTestId('coach-card-coach-1');
      expect(card).toHaveClass('personality-motivational');
    });

    it('should apply different styles for different personalities', () => {
      const zenCoach = {
        ...mockCoach,
        id: 'coach-2',
        name: 'Zen Rodriguez',
        personality: 'zen',
        icon: '🧘‍♀️'
      };

      render(
        <CoachCard
          coach={zenCoach}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      const card = screen.getByTestId('coach-card-coach-2');
      expect(card).toHaveClass('personality-zen');
      expect(card).not.toHaveClass('personality-motivational');
    });
  });

  describe('Edge Cases', () => {
    it('should handle coach with missing icon gracefully', () => {
      const coachWithoutIcon = {
        ...mockCoach,
        icon: ''
      };

      render(
        <CoachCard
          coach={coachWithoutIcon}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      // Should render without breaking
      expect(screen.getByText('Thunder McGrath')).toBeInTheDocument();
      
      // Should show default icon or placeholder
      const iconElement = screen.getByTestId('coach-icon');
      expect(iconElement).toBeInTheDocument();
    });

    it('should handle coach with very short description', () => {
      const coachWithShortDescription = {
        ...mockCoach,
        description: 'Fast.'
      };

      render(
        <CoachCard
          coach={coachWithShortDescription}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Fast.')).toBeInTheDocument();
    });

    it('should handle special characters in coach name', () => {
      const coachWithSpecialName = {
        ...mockCoach,
        name: 'Coach O\'Malley-Smith (PhD)'
      };

      render(
        <CoachCard
          coach={coachWithSpecialName}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Coach O\'Malley-Smith (PhD)')).toBeInTheDocument();
    });
  });
});