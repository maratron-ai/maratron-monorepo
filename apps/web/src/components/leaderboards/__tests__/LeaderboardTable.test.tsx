import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaderboardTable } from '../LeaderboardTable';
import { LeaderboardEntry } from '@maratypes/leaderboard';

// Mock leaderboard data (ranks 4-10)
const mockLeaderboardEntries: LeaderboardEntry[] = [
  {
    userId: 'user4',
    user: {
      id: 'user4',
      name: 'Alice Cooper',
      avatarUrl: 'https://example.com/avatar4.jpg',
    },
    value: 42.5,
    formattedValue: '42.5 miles',
    rank: 4,
    change: 2, // Moved up 2 positions
  },
  {
    userId: 'user5',
    user: {
      id: 'user5',
      name: 'David Smith',
      avatarUrl: null,
    },
    value: 40.0,
    formattedValue: '40.0 miles',
    rank: 5,
    change: -1, // Moved down 1 position
  },
  {
    userId: 'user6',
    user: {
      id: 'user6',
      name: 'Emma Johnson',
      avatarUrl: 'https://example.com/avatar6.jpg',
    },
    value: 38.5,
    formattedValue: '38.5 miles',
    rank: 6,
    badge: {
      type: 'improvement',
      label: 'Rising Star',
      description: 'Moved up 3 positions',
      color: 'green',
    },
    streak: 3,
  },
  {
    userId: 'user7',
    user: {
      id: 'user7',
      name: 'Frank Williams',
      avatarUrl: 'https://example.com/avatar7.jpg',
    },
    value: 36.0,
    formattedValue: '36.0 miles',
    rank: 7,
  },
  {
    userId: 'user8',
    user: {
      id: 'user8',
      name: 'Grace Davis',
      avatarUrl: 'https://example.com/avatar8.jpg',
    },
    value: 34.2,
    formattedValue: '34.2 miles',
    rank: 8,
    change: 0, // No change
  },
  {
    userId: 'user9',
    user: {
      id: 'user9',
      name: 'Henry Thompson-Martinez',
      avatarUrl: null,
    },
    value: 32.8,
    formattedValue: '32.8 miles',
    rank: 9,
    streak: 5,
  },
  {
    userId: 'user10',
    user: {
      id: 'user10',
      name: 'Isabella Rodriguez',
      avatarUrl: 'https://example.com/avatar10.jpg',
    },
    value: 30.5,
    formattedValue: '30.5 miles',
    rank: 10,
    change: -3, // Moved down 3 positions
  },
];

describe('LeaderboardTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering and Display', () => {
    it('should render all leaderboard entries', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      // Check that all entries are rendered
      mockLeaderboardEntries.forEach(entry => {
        expect(screen.getByTestId(`leaderboard-entry-${entry.userId}`)).toBeInTheDocument();
      });
    });

    it('should display user names correctly', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      expect(screen.getByText('David Smith')).toBeInTheDocument();
      expect(screen.getByText('Emma Johnson')).toBeInTheDocument();
      expect(screen.getByText('Henry Thompson-Martinez')).toBeInTheDocument();
    });

    it('should display rank numbers correctly', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      expect(screen.getByTestId('rank-4-user4')).toHaveTextContent('4');
      expect(screen.getByTestId('rank-5-user5')).toHaveTextContent('5');
      expect(screen.getByTestId('rank-10-user10')).toHaveTextContent('10');
    });

    it('should display formatted values correctly', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      expect(screen.getByText('42.5 miles')).toBeInTheDocument();
      expect(screen.getByText('40.0 miles')).toBeInTheDocument();
      expect(screen.getByText('30.5 miles')).toBeInTheDocument();
    });

    it('should show user avatars when available', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      const aliceAvatar = screen.getByTestId('avatar-user4');
      const emmaAvatar = screen.getByTestId('avatar-user6');
      
      expect(aliceAvatar).toBeInTheDocument();
      expect(emmaAvatar).toBeInTheDocument();
    });

    it('should show initials when avatar is not available', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      // Should show initials for users without avatars
      expect(screen.getByText('DS')).toBeInTheDocument(); // David Smith
      expect(screen.getByText('HT')).toBeInTheDocument(); // Henry Thompson-Martinez
    });

    it('should display correct table headers', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      expect(screen.getByText('Rank')).toBeInTheDocument();
      expect(screen.getByText('Runner')).toBeInTheDocument();
      expect(screen.getByText('Distance')).toBeInTheDocument();
      expect(screen.getByText('Change')).toBeInTheDocument();
    });
  });

  describe('Rank Change Indicators', () => {
    it('should show positive rank change with up arrow', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      const upArrow = screen.getByTestId('rank-change-user4');
      expect(upArrow).toBeInTheDocument();
      expect(upArrow).toHaveClass('text-green-600');
      expect(upArrow).toHaveTextContent('+2');
    });

    it('should show negative rank change with down arrow', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      const downArrow = screen.getByTestId('rank-change-user5');
      expect(downArrow).toBeInTheDocument();
      expect(downArrow).toHaveClass('text-red-600');
      expect(downArrow).toHaveTextContent('-1');
    });

    it('should show no change indicator when rank is unchanged', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      const noChange = screen.getByTestId('rank-change-user8');
      expect(noChange).toBeInTheDocument();
      expect(noChange).toHaveClass('text-gray-400');
      expect(noChange).toHaveTextContent('—');
    });

    it('should not show change indicator for new entries', () => {
      const entriesWithNewUser = [
        ...mockLeaderboardEntries.slice(0, 3),
        {
          ...mockLeaderboardEntries[3],
          change: undefined, // New entry
        },
      ];

      render(<LeaderboardTable entries={entriesWithNewUser} />);

      const newEntry = screen.getByTestId('rank-change-user7');
      expect(newEntry).toHaveTextContent('NEW');
      expect(newEntry).toHaveClass('text-blue-600');
    });
  });

  describe('Badges and Achievements', () => {
    it('should display achievement badges when present', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      const badge = screen.getByText('Rising Star');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge-improvement');
    });

    it('should show streak indicators', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      const streak = screen.getByTestId('streak-user6');
      expect(streak).toBeInTheDocument();
      expect(streak).toHaveTextContent('3🔥');
    });

    it('should handle entries without badges gracefully', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      // Entries without badges should not show badge elements
      expect(screen.queryByTestId('badge-user4')).not.toBeInTheDocument();
      expect(screen.queryByTestId('badge-user5')).not.toBeInTheDocument();
    });
  });

  describe('Interaction Behavior', () => {
    it('should be clickable and trigger user profile view', async () => {
      const mockOnUserClick = jest.fn();
      const user = userEvent.setup();

      render(<LeaderboardTable entries={mockLeaderboardEntries} onUserClick={mockOnUserClick} />);

      const firstEntry = screen.getByTestId('leaderboard-entry-user4');
      await user.click(firstEntry);

      expect(mockOnUserClick).toHaveBeenCalledWith('user4');
    });

    it('should be keyboard accessible', async () => {
      const mockOnUserClick = jest.fn();
      const user = userEvent.setup();

      render(<LeaderboardTable entries={mockLeaderboardEntries} onUserClick={mockOnUserClick} />);

      const firstEntry = screen.getByTestId('leaderboard-entry-user4');
      firstEntry.focus();
      await user.keyboard('{Enter}');

      expect(mockOnUserClick).toHaveBeenCalledWith('user4');
    });

    it('should work without onUserClick handler', async () => {
      const user = userEvent.setup();

      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      const firstEntry = screen.getByTestId('leaderboard-entry-user4');
      // Should not throw error when clicked
      await user.click(firstEntry);

      expect(firstEntry).toBeInTheDocument();
    });

    it('should show hover effects on rows', async () => {
      const user = userEvent.setup();

      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      const firstEntry = screen.getByTestId('leaderboard-entry-user4');
      await user.hover(firstEntry);

      expect(firstEntry).toHaveClass('hover:bg-muted/50');
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure with ARIA labels', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Leaderboard rankings');

      const rowHeaders = screen.getAllByRole('rowheader');
      expect(rowHeaders).toHaveLength(mockLeaderboardEntries.length);
    });

    it('should be keyboard navigable', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      const rows = screen.getAllByTestId(/leaderboard-entry-/);
      rows.forEach(row => {
        expect(row).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should have descriptive aria-labels for each row', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      const firstRow = screen.getByTestId('leaderboard-entry-user4');
      expect(firstRow.getAttribute('aria-label')).toContain('Alice Cooper');
      expect(firstRow.getAttribute('aria-label')).toContain('rank 4');
      expect(firstRow.getAttribute('aria-label')).toContain('42.5 miles');
    });

    it('should indicate rank changes in aria-labels', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      const improvedRow = screen.getByTestId('leaderboard-entry-user4');
      const droppedRow = screen.getByTestId('leaderboard-entry-user5');

      expect(improvedRow.getAttribute('aria-label')).toContain('moved up');
      expect(droppedRow.getAttribute('aria-label')).toContain('moved down');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive table classes', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      const table = screen.getByRole('table');
      expect(table).toHaveClass('table-responsive');
    });

    it('should hide change column on mobile when specified', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} hideChangeOnMobile={true} />);

      const changeHeader = screen.getByText('Change');
      expect(changeHeader).toHaveClass('hidden', 'md:table-cell');
    });

    it('should adjust avatar sizes on mobile', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} mobileCompact={true} />);

      // The avatar component should have mobile compact classes applied to the parent
      const avatar = screen.getByTestId('avatar-user4');
      const avatarParent = avatar.parentElement;
      
      // Check that the Avatar component has the mobile compact classes
      expect(avatarParent).toHaveClass('w-8', 'h-8', 'md:w-10', 'md:h-10');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty entries array', () => {
      render(<LeaderboardTable entries={[]} />);

      expect(screen.getByText(/No leaderboard data available/)).toBeInTheDocument();
    });

    it('should handle very long user names', () => {
      const entriesWithLongName = [
        {
          ...mockLeaderboardEntries[0],
          user: {
            ...mockLeaderboardEntries[0].user,
            name: 'Extremely Long Name That Should Be Truncated Appropriately To Fit',
          },
        },
      ];

      render(<LeaderboardTable entries={entriesWithLongName} />);

      const nameElement = screen.getByTestId('user-name-user4');
      expect(nameElement).toHaveClass('truncate');
    });

    it('should handle special characters in user names', () => {
      const entriesWithSpecialChars = [
        {
          ...mockLeaderboardEntries[0],
          user: {
            ...mockLeaderboardEntries[0].user,
            name: 'José María O\'Connor-Smith',
          },
        },
      ];

      render(<LeaderboardTable entries={entriesWithSpecialChars} />);

      expect(screen.getByText('José María O\'Connor-Smith')).toBeInTheDocument();
    });

    it('should handle ties in rankings', () => {
      const entriesWithTie = [
        {
          ...mockLeaderboardEntries[0],
          rank: 4,
          value: 42.5,
        },
        {
          ...mockLeaderboardEntries[1],
          rank: 4, // Same rank as first entry
          value: 42.5,
        },
      ];

      render(<LeaderboardTable entries={entriesWithTie} />);

      const firstTiedEntry = screen.getByTestId('rank-4-user4');
      const secondTiedEntry = screen.getByTestId('rank-4-user5');
      
      expect(firstTiedEntry).toHaveTextContent('4');
      expect(secondTiedEntry).toHaveTextContent('4');
      
      // Both entries should show rank 4
      const allRank4Elements = screen.getAllByText('4');
      expect(allRank4Elements).toHaveLength(2);
    });
  });

  describe('Sorting and Pagination', () => {
    it('should show entries in rank order', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} />);

      const rows = screen.getAllByTestId(/leaderboard-entry-/);
      
      // Check that ranks are in ascending order
      expect(rows[0]).toHaveAttribute('data-testid', 'leaderboard-entry-user4'); // Rank 4
      expect(rows[1]).toHaveAttribute('data-testid', 'leaderboard-entry-user5'); // Rank 5
      expect(rows[6]).toHaveAttribute('data-testid', 'leaderboard-entry-user10'); // Rank 10
    });

    it('should support pagination controls when provided', () => {
      render(
        <LeaderboardTable 
          entries={mockLeaderboardEntries} 
          showPagination={true}
          currentPage={1}
          totalPages={3}
        />
      );

      expect(screen.getByTestId('pagination-controls')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });
  });

  describe('Current User Highlighting', () => {
    it('should highlight current user entry when provided', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} currentUserId="user6" />);

      const currentUserRow = screen.getByTestId('leaderboard-entry-user6');
      expect(currentUserRow).toHaveClass('bg-primary/10', 'ring-1', 'ring-primary');
    });

    it('should show "You" indicator for current user', () => {
      render(<LeaderboardTable entries={mockLeaderboardEntries} currentUserId="user6" />);

      expect(screen.getByTestId('current-user-indicator')).toBeInTheDocument();
      expect(screen.getByText('(You)')).toBeInTheDocument();
    });
  });
});