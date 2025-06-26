import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInterface } from '../chat/ChatInterface';
import { useSession } from 'next-auth/react';

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

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
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: 'test-message-id',
        role: 'assistant',
        content: 'Test response',
      }),
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

  it('renders chat interface when authenticated', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    render(<ChatInterface />);
    expect(screen.getByText('Maratron AI')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays quick action buttons', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    render(<ChatInterface />);
    expect(screen.getByText('Recent Runs')).toBeInTheDocument();
    expect(screen.getByText('Training Summary')).toBeInTheDocument();
    expect(screen.getByText('My Shoes')).toBeInTheDocument();
  });

  it('allows typing in the textarea', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    render(<ChatInterface />);
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    expect(textarea).toHaveValue('Hello');
  });
});