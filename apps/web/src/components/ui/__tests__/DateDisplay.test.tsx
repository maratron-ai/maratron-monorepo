import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DateDisplay } from '../DateDisplay';

// Mock the ClientOnly component for testing
jest.mock('../ClientOnly', () => {
  const mockReact = jest.requireActual('react');
  return {
    ClientOnly: ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => {
      // In tests, we can simulate both server and client rendering
      const [mounted, setMounted] = mockReact.useState(false);
      
      mockReact.useEffect(() => {
        setMounted(true);
      }, []);
      
      return mounted ? children : fallback;
    }
  };
});

describe('DateDisplay', () => {
  it('should render server fallback initially', () => {
    render(<DateDisplay date="2025-01-15T10:30:00Z" />);
    
    // Should show basic date format without time on server
    expect(screen.getByText(/Jan 15, 2025/)).toBeInTheDocument();
  });

  it('should render full date after hydration', async () => {
    render(<DateDisplay date="2025-01-15T10:30:00Z" format="full" />);
    
    // Wait for client-side hydration
    await waitFor(() => {
      expect(screen.getByText(/Jan 15, 2025, \d+:\d+ [AP]M/)).toBeInTheDocument();
    });
  });

  it('should render relative time format', async () => {
    const recentDate = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
    render(<DateDisplay date={recentDate} format="relative" />);
    
    await waitFor(() => {
      expect(screen.getByText('5m ago')).toBeInTheDocument();
    });
  });

  it('should apply custom className', () => {
    render(<DateDisplay date="2025-01-15T10:30:00Z" className="custom-class" />);
    
    const element = screen.getByText(/Jan 15, 2025/);
    expect(element).toHaveClass('custom-class');
  });

  it('should handle invalid dates gracefully', () => {
    render(<DateDisplay date="invalid-date" />);
    
    // Should still render something without crashing
    expect(screen.getByText(/Invalid Date/)).toBeInTheDocument();
  });
});