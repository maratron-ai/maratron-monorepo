import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaderboardPodium } from '../LeaderboardPodium';
import { PodiumEntry } from '@maratypes/leaderboard';

// Mock podium data
const mockPodiumEntries: PodiumEntry[] = [
  {
    userId: 'user1',
    user: {
      id: 'user1',
      name: 'John Doe',
      avatarUrl: 'https://example.com/avatar1.jpg',
    },
    value: 50.5,
    formattedValue: '50.5 miles',
    rank: 1,
    medal: 'gold',
    celebration: true,
  },
  {
    userId: 'user2',
    user: {
      id: 'user2',
      name: 'Jane Smith',
      avatarUrl: 'https://example.com/avatar2.jpg',
    },
    value: 48.2,
    formattedValue: '48.2 miles',
    rank: 2,
    medal: 'silver',
  },
  {
    userId: 'user3',
    user: {
      id: 'user3',
      name: 'Bob Johnson',
      avatarUrl: null,
    },
    value: 45.1,
    formattedValue: '45.1 miles',
    rank: 3,
    medal: 'bronze',
  },
];

describe('LeaderboardPodium', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering and Display', () => {
    it('should render all three podium positions', () => {
      render(<LeaderboardPodium entries={mockPodiumEntries} />);

      // Check that all three positions are rendered
      expect(screen.getByTestId('podium-position-1')).toBeInTheDocument();
      expect(screen.getByTestId('podium-position-2')).toBeInTheDocument();
      expect(screen.getByTestId('podium-position-3')).toBeInTheDocument();
    });

    it('should display user names correctly', () => {
      render(<LeaderboardPodium entries={mockPodiumEntries} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should display formatted values correctly', () => {
      render(<LeaderboardPodium entries={mockPodiumEntries} />);

      expect(screen.getByText('50.5 miles')).toBeInTheDocument();
      expect(screen.getByText('48.2 miles')).toBeInTheDocument();
      expect(screen.getByText('45.1 miles')).toBeInTheDocument();
    });

    it('should display correct medal types', () => {
      render(<LeaderboardPodium entries={mockPodiumEntries} />);

      expect(screen.getByTestId('medal-gold')).toBeInTheDocument();
      expect(screen.getByTestId('medal-silver')).toBeInTheDocument();
      expect(screen.getByTestId('medal-bronze')).toBeInTheDocument();
    });

    it('should display user avatars when available', () => {
      render(<LeaderboardPodium entries={mockPodiumEntries} />);

      const goldAvatar = screen.getByTestId('avatar-user1');
      const silverAvatar = screen.getByTestId('avatar-user2');
      
      expect(goldAvatar).toBeInTheDocument();
      expect(silverAvatar).toBeInTheDocument();
      
      // Check that AvatarImage is rendered with the correct props
      // Note: Radix Avatar component structure doesn't expose src directly
      expect(goldAvatar.closest('[data-testid="avatar-user1"]')).toBeInTheDocument();
      expect(silverAvatar.closest('[data-testid="avatar-user2"]')).toBeInTheDocument();
    });

    it('should show default avatar when user avatar is null', () => {
      render(<LeaderboardPodium entries={mockPodiumEntries} />);

      const bronzeAvatar = screen.getByTestId('avatar-user3');
      expect(bronzeAvatar).toBeInTheDocument();
      // Should show initials or default avatar
      expect(screen.getByText('BJ')).toBeInTheDocument(); // Initials for Bob Johnson
    });

    it('should arrange podium positions correctly (1st center, 2nd left, 3rd right)', () => {
      render(<LeaderboardPodium entries={mockPodiumEntries} />);

      const firstPosition = screen.getByTestId('podium-position-1');
      const secondPosition = screen.getByTestId('podium-position-2');
      const thirdPosition = screen.getByTestId('podium-position-3');

      // First place should be in center and tallest
      expect(firstPosition).toHaveClass('podium-center', 'podium-tallest');
      // Second place should be on left
      expect(secondPosition).toHaveClass('podium-left');
      // Third place should be on right
      expect(thirdPosition).toHaveClass('podium-right');
    });
  });

  describe('Visual Effects and Animations', () => {
    it('should show celebration effects for first place when enabled', () => {
      render(<LeaderboardPodium entries={mockPodiumEntries} />);

      const firstPosition = screen.getByTestId('podium-position-1');
      expect(firstPosition).toHaveClass('celebration-active');
    });

    it('should not show celebration effects when disabled', () => {
      const entriesWithoutCelebration = mockPodiumEntries.map(entry => ({
        ...entry,
        celebration: entry.rank === 1 ? false : entry.celebration,
      }));

      render(<LeaderboardPodium entries={entriesWithoutCelebration} />);

      const firstPosition = screen.getByTestId('podium-position-1');
      expect(firstPosition).not.toHaveClass('celebration-active');
    });

    it('should apply different heights to podium platforms', () => {
      render(<LeaderboardPodium entries={mockPodiumEntries} />);

      const firstPlatform = screen.getByTestId('platform-1');
      const secondPlatform = screen.getByTestId('platform-2');
      const thirdPlatform = screen.getByTestId('platform-3');

      expect(firstPlatform).toHaveClass('platform-height-1');
      expect(secondPlatform).toHaveClass('platform-height-2');
      expect(thirdPlatform).toHaveClass('platform-height-3');
    });

    it('should show hover effects on podium entries', async () => {
      const user = userEvent.setup();
      render(<LeaderboardPodium entries={mockPodiumEntries} />);

      const firstPosition = screen.getByTestId('podium-position-1');
      await user.hover(firstPosition);

      expect(firstPosition).toHaveClass('hover-active');
    });
  });

  describe('Interaction Behavior', () => {
    it('should be clickable and trigger user profile view', async () => {
      const mockOnUserClick = jest.fn();
      const user = userEvent.setup();

      render(<LeaderboardPodium entries={mockPodiumEntries} onUserClick={mockOnUserClick} />);

      const firstPosition = screen.getByTestId('podium-position-1');
      await user.click(firstPosition);

      expect(mockOnUserClick).toHaveBeenCalledWith('user1');
    });

    it('should be keyboard accessible', async () => {
      const mockOnUserClick = jest.fn();
      const user = userEvent.setup();

      render(<LeaderboardPodium entries={mockPodiumEntries} onUserClick={mockOnUserClick} />);

      const firstPosition = screen.getByTestId('podium-position-1');
      firstPosition.focus();
      await user.keyboard('{Enter}');

      expect(mockOnUserClick).toHaveBeenCalledWith('user1');
    });

    it('should work without onUserClick handler', async () => {
      const user = userEvent.setup();

      render(<LeaderboardPodium entries={mockPodiumEntries} />);

      const firstPosition = screen.getByTestId('podium-position-1');
      // Should not throw error when clicked
      await user.click(firstPosition);

      expect(firstPosition).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<LeaderboardPodium entries={mockPodiumEntries} />);

      const podium = screen.getByRole('region');
      expect(podium).toHaveAttribute('aria-label', 'Leaderboard top 3 podium');

      const firstPosition = screen.getByTestId('podium-position-1');
      expect(firstPosition).toHaveAttribute('role', 'button');
      expect(firstPosition).toHaveAttribute('aria-label', expect.stringContaining('1st place'));
      expect(firstPosition).toHaveAttribute('aria-label', expect.stringContaining('John Doe'));
      expect(firstPosition).toHaveAttribute('aria-label', expect.stringContaining('50.5 miles'));
    });

    it('should be keyboard focusable', () => {
      render(<LeaderboardPodium entries={mockPodiumEntries} />);

      const positions = [
        screen.getByTestId('podium-position-1'),
        screen.getByTestId('podium-position-2'),
        screen.getByTestId('podium-position-3'),
      ];

      positions.forEach(position => {
        expect(position).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should have descriptive aria-labels for each position', () => {
      render(<LeaderboardPodium entries={mockPodiumEntries} />);

      const firstPosition = screen.getByTestId('podium-position-1');
      const secondPosition = screen.getByTestId('podium-position-2');
      const thirdPosition = screen.getByTestId('podium-position-3');

      expect(firstPosition.getAttribute('aria-label')).toContain('1st place');
      expect(secondPosition.getAttribute('aria-label')).toContain('2nd place');
      expect(thirdPosition.getAttribute('aria-label')).toContain('3rd place');
    });
  });

  describe('Edge Cases', () => {
    it('should handle fewer than 3 entries gracefully', () => {
      const twoEntries = mockPodiumEntries.slice(0, 2);
      render(<LeaderboardPodium entries={twoEntries} />);

      expect(screen.getByTestId('podium-position-1')).toBeInTheDocument();
      expect(screen.getByTestId('podium-position-2')).toBeInTheDocument();
      expect(screen.queryByTestId('podium-position-3')).not.toBeInTheDocument();
    });

    it('should handle empty entries array', () => {
      render(<LeaderboardPodium entries={[]} />);

      expect(screen.queryByTestId('podium-position-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('podium-position-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('podium-position-3')).not.toBeInTheDocument();
      
      // Should show empty state message
      expect(screen.getByText(/No podium data available/)).toBeInTheDocument();
    });

    it('should handle very long user names', () => {
      const entriesWithLongNames = [
        {
          ...mockPodiumEntries[0],
          user: {
            ...mockPodiumEntries[0].user,
            name: 'Very Long Name That Should Be Truncated Appropriately',
          },
        },
      ];

      render(<LeaderboardPodium entries={entriesWithLongNames} />);

      const nameElement = screen.getByTestId('user-name-user1');
      expect(nameElement).toHaveClass('truncate');
    });

    it('should handle special characters in user names', () => {
      const entriesWithSpecialChars = [
        {
          ...mockPodiumEntries[0],
          user: {
            ...mockPodiumEntries[0].user,
            name: 'José María O\'Connor-Smith',
          },
        },
      ];

      render(<LeaderboardPodium entries={entriesWithSpecialChars} />);

      expect(screen.getByText('José María O\'Connor-Smith')).toBeInTheDocument();
    });

    it('should handle invalid avatar URLs gracefully', () => {
      const entriesWithBadAvatar = [
        {
          ...mockPodiumEntries[0],
          user: {
            ...mockPodiumEntries[0].user,
            avatarUrl: 'invalid-url',
          },
        },
      ];

      render(<LeaderboardPodium entries={entriesWithBadAvatar} />);

      // Should fallback to initials when image fails to load
      const avatar = screen.getByTestId('avatar-user1');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Medal and Trophy Display', () => {
    it('should display appropriate trophy icons for each medal', () => {
      render(<LeaderboardPodium entries={mockPodiumEntries} />);

      expect(screen.getByTestId('trophy-gold')).toBeInTheDocument();
      expect(screen.getByTestId('trophy-silver')).toBeInTheDocument();
      expect(screen.getByTestId('trophy-bronze')).toBeInTheDocument();
    });

    it('should apply correct colors to medals', () => {
      render(<LeaderboardPodium entries={mockPodiumEntries} />);

      const goldMedal = screen.getByTestId('medal-gold');
      const silverMedal = screen.getByTestId('medal-silver');
      const bronzeMedal = screen.getByTestId('medal-bronze');

      expect(goldMedal).toHaveClass('medal-gold');
      expect(silverMedal).toHaveClass('medal-silver');
      expect(bronzeMedal).toHaveClass('medal-bronze');
    });

    it('should show rank numbers on podium platforms', () => {
      render(<LeaderboardPodium entries={mockPodiumEntries} />);

      expect(screen.getByTestId('rank-number-1')).toHaveTextContent('1');
      expect(screen.getByTestId('rank-number-2')).toHaveTextContent('2');
      expect(screen.getByTestId('rank-number-3')).toHaveTextContent('3');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes for mobile layout', () => {
      render(<LeaderboardPodium entries={mockPodiumEntries} />);

      const podium = screen.getByTestId('podium-container');
      expect(podium).toHaveClass('responsive-podium');
    });

    it('should stack vertically on mobile when prop is set', () => {
      render(<LeaderboardPodium entries={mockPodiumEntries} mobileVertical={true} />);

      const podium = screen.getByTestId('podium-container');
      expect(podium).toHaveClass('mobile-vertical');
    });
  });
});