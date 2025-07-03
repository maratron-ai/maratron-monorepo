import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CoachSelector } from '../CoachSelector';
import type { CoachPersona } from '@prisma/client';

// Mock data
const mockCoaches: CoachPersona[] = [
  {
    id: 'coach-1',
    name: 'Thunder McGrath',
    description: 'High-energy motivational coach who pushes you to your limits',
    icon: '🏃‍♂️',
    systemPrompt: 'You are Thunder McGrath...',
    personality: 'motivational',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'coach-2',
    name: 'Zen Rodriguez',
    description: 'Mindful coach who focuses on balance and inner strength',
    icon: '🧘‍♀️',
    systemPrompt: 'You are Zen Rodriguez...',
    personality: 'zen',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'coach-3',
    name: 'Tech Thompson',
    description: 'Data-driven analytical coach who optimizes performance',
    icon: '🤖',
    systemPrompt: 'You are Tech Thompson...',
    personality: 'analytical',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('CoachSelector (TDD - Failing Tests)', () => {
  const mockOnCoachSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering and Display', () => {
    it('should render all available coaches', () => {
      render(
        <CoachSelector
          coaches={mockCoaches}
          selectedCoachId={null}
          onCoachSelect={mockOnCoachSelect}
        />
      );

      // Should display all coaches
      expect(screen.getByText('Thunder McGrath')).toBeInTheDocument();
      expect(screen.getByText('Zen Rodriguez')).toBeInTheDocument();
      expect(screen.getByText('Tech Thompson')).toBeInTheDocument();

      // Should display coach descriptions
      expect(screen.getByText(/High-energy motivational coach/)).toBeInTheDocument();
      expect(screen.getByText(/Mindful coach who focuses/)).toBeInTheDocument();
      expect(screen.getByText(/Data-driven analytical coach/)).toBeInTheDocument();

      // Should display coach icons
      expect(screen.getByText('🏃‍♂️')).toBeInTheDocument();
      expect(screen.getByText('🧘‍♀️')).toBeInTheDocument();
      expect(screen.getByText('🤖')).toBeInTheDocument();
    });

    it('should highlight the selected coach', () => {
      render(
        <CoachSelector
          coaches={mockCoaches}
          selectedCoachId="coach-2"
          onCoachSelect={mockOnCoachSelect}
        />
      );

      // Zen Rodriguez should be selected
      const zenCard = screen.getByText('Zen Rodriguez').closest('[data-testid]');
      expect(zenCard).toHaveAttribute('data-selected', 'true');

      // Other coaches should not be selected
      const thunderCard = screen.getByText('Thunder McGrath').closest('[data-testid]');
      const techCard = screen.getByText('Tech Thompson').closest('[data-testid]');
      expect(thunderCard).toHaveAttribute('data-selected', 'false');
      expect(techCard).toHaveAttribute('data-selected', 'false');
    });

    it('should render with no coaches selected initially', () => {
      render(
        <CoachSelector
          coaches={mockCoaches}
          selectedCoachId={null}
          onCoachSelect={mockOnCoachSelect}
        />
      );

      // No coaches should be selected
      const coachCards = screen.getAllByTestId(/coach-card/);
      coachCards.forEach(card => {
        expect(card).toHaveAttribute('data-selected', 'false');
      });
    });

    it('should display a title and description', () => {
      render(
        <CoachSelector
          coaches={mockCoaches}
          selectedCoachId={null}
          onCoachSelect={mockOnCoachSelect}
        />
      );

      expect(screen.getByText(/Choose Your Coach/i)).toBeInTheDocument();
      expect(screen.getByText(/Select a coaching personality/i)).toBeInTheDocument();
    });
  });

  describe('Coach Selection Interaction', () => {
    it('should call onCoachSelect when a coach is clicked', async () => {
      const user = userEvent.setup();

      render(
        <CoachSelector
          coaches={mockCoaches}
          selectedCoachId={null}
          onCoachSelect={mockOnCoachSelect}
        />
      );

      // Click on Thunder McGrath
      const thunderCard = screen.getByText('Thunder McGrath').closest('[data-testid]');
      await user.click(thunderCard!);

      expect(mockOnCoachSelect).toHaveBeenCalledWith('coach-1');
    });

    it('should allow deselecting current coach', async () => {
      const user = userEvent.setup();

      render(
        <CoachSelector
          coaches={mockCoaches}
          selectedCoachId="coach-1"
          onCoachSelect={mockOnCoachSelect}
        />
      );

      // Click on already selected Thunder McGrath to deselect
      const thunderCard = screen.getByText('Thunder McGrath').closest('[data-testid]');
      await user.click(thunderCard!);

      expect(mockOnCoachSelect).toHaveBeenCalledWith(null);
    });

    it('should handle switching between coaches', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <CoachSelector
          coaches={mockCoaches}
          selectedCoachId="coach-1"
          onCoachSelect={mockOnCoachSelect}
        />
      );

      // Click on Zen Rodriguez to switch
      const zenCard = screen.getByText('Zen Rodriguez').closest('[data-testid]');
      await user.click(zenCard!);

      expect(mockOnCoachSelect).toHaveBeenCalledWith('coach-2');

      // Re-render with new selection
      rerender(
        <CoachSelector
          coaches={mockCoaches}
          selectedCoachId="coach-2"
          onCoachSelect={mockOnCoachSelect}
        />
      );

      // Zen should now be selected
      expect(zenCard).toHaveAttribute('data-selected', 'true');
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading state when loading prop is true', () => {
      render(
        <CoachSelector
          coaches={[]}
          selectedCoachId={null}
          onCoachSelect={mockOnCoachSelect}
          loading={true}
        />
      );

      expect(screen.getByTestId('coach-selector-loading')).toBeInTheDocument();
      expect(screen.getByText(/Loading coaches/i)).toBeInTheDocument();
    });

    it('should display error state when error is provided', () => {
      const errorMessage = 'Failed to load coaches';

      render(
        <CoachSelector
          coaches={[]}
          selectedCoachId={null}
          onCoachSelect={mockOnCoachSelect}
          error={errorMessage}
        />
      );

      expect(screen.getByTestId('coach-selector-error')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should disable coach selection when loading', async () => {

      render(
        <CoachSelector
          coaches={mockCoaches}
          selectedCoachId={null}
          onCoachSelect={mockOnCoachSelect}
          loading={true}
        />
      );

      // Should show loading state and no coach cards
      expect(screen.getByTestId('coach-selector-loading')).toBeInTheDocument();
      expect(screen.queryByTestId(/coach-card/)).not.toBeInTheDocument();

      // Should not call onCoachSelect since no cards are rendered
      expect(mockOnCoachSelect).not.toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no coaches are available', () => {
      render(
        <CoachSelector
          coaches={[]}
          selectedCoachId={null}
          onCoachSelect={mockOnCoachSelect}
        />
      );

      expect(screen.getByTestId('coach-selector-empty')).toBeInTheDocument();
      expect(screen.getByText(/No coaches available/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <CoachSelector
          coaches={mockCoaches}
          selectedCoachId="coach-1"
          onCoachSelect={mockOnCoachSelect}
        />
      );

      // Main container should have proper role
      expect(screen.getByRole('group', { name: /coach selection/i })).toBeInTheDocument();

      // Each coach card should be selectable
      const coachCards = screen.getAllByRole('button');
      expect(coachCards).toHaveLength(mockCoaches.length);

      // Selected coach should have aria-pressed
      const selectedCard = screen.getByRole('button', { name: /Thunder McGrath/i });
      expect(selectedCard).toHaveAttribute('aria-pressed', 'true');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <CoachSelector
          coaches={mockCoaches}
          selectedCoachId={null}
          onCoachSelect={mockOnCoachSelect}
        />
      );

      // Tab to first coach card
      await user.tab();
      
      // Press Enter to select
      await user.keyboard('{Enter}');

      expect(mockOnCoachSelect).toHaveBeenCalledWith('coach-1');
    });
  });
});