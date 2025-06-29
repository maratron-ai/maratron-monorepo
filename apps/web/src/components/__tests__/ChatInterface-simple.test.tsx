import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChatInterface } from '../chat/ChatInterface';
import { useSession } from 'next-auth/react';

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock MCP health check response
const mockMCPHealthResponse = {
  ok: true,
  json: () => Promise.resolve({
    mcpStatus: 'connected',
    availableTools: ['get_smart_user_context']
  }),
};

const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
  },
};

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock different fetch calls based on method and URL
    (fetch as jest.Mock).mockImplementation((url, options) => {
      if (options?.method === 'GET') {
        // Health check call
        return Promise.resolve(mockMCPHealthResponse);
      } else {
        // Chat API call
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'test-message-id',
            role: 'assistant',
            content: 'Test response',
          }),
        });
      }
    });
  });

  it('shows loading state when session is loading', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    });

    render(<ChatInterface />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows authentication required when not authenticated', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<ChatInterface />);
    expect(screen.getByText(/Please sign in to access/)).toBeInTheDocument();
  });

  it('renders chat interface when authenticated', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    await act(async () => {
      render(<ChatInterface />);
    });
    
    expect(screen.getByText('Maratron AI')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays quick action buttons', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    await act(async () => {
      render(<ChatInterface />);
    });
    
    expect(screen.getByText('Recent Runs')).toBeInTheDocument();
    expect(screen.getByText('Training Summary')).toBeInTheDocument();
    expect(screen.getByText('My Shoes')).toBeInTheDocument();
  });

  it('allows typing in the textarea', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    await act(async () => {
      render(<ChatInterface />);
    });
    
    const textarea = screen.getByRole('textbox');
    
    act(() => {
      fireEvent.change(textarea, { target: { value: 'Hello' } });
    });
    
    expect(textarea).toHaveValue('Hello');
  });
});