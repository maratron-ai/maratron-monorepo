import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChatMessage } from '../chat/ChatMessage';

describe('ChatMessage', () => {
  const defaultProps = {
    role: 'user' as const,
    content: 'Hello, this is a test message',
    timestamp: new Date('2024-01-01T06:00:00Z'),
  };

  it('renders user message content', () => {
    render(<ChatMessage {...defaultProps} />);
    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
  });

  it('renders assistant message content', () => {
    render(
      <ChatMessage 
        {...defaultProps} 
        role="assistant" 
        content="I can help with your running data!" 
      />
    );
    expect(screen.getByText('I can help with your running data!')).toBeInTheDocument();
  });

  it('displays timestamp', () => {
    render(<ChatMessage {...defaultProps} />);
    // Check that some time-related text is present
    const timeElement = screen.getByText(/AM|PM/);
    expect(timeElement).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <ChatMessage 
        {...defaultProps} 
        role="assistant" 
        content="" 
        isLoading={true} 
      />
    );
    
    // Check for loading animation
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('does not render system messages', () => {
    render(
      <ChatMessage 
        {...defaultProps} 
        role="system" 
        content="This is a system message" 
      />
    );
    
    expect(screen.queryByText('This is a system message')).not.toBeInTheDocument();
  });

  it('handles multiline text', () => {
    const multilineText = 'Line 1\nLine 2\nLine 3';
    render(<ChatMessage {...defaultProps} content={multilineText} />);
    
    // Check that the content is present by looking for part of the text
    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    expect(screen.getByText(/Line 2/)).toBeInTheDocument();
    expect(screen.getByText(/Line 3/)).toBeInTheDocument();
  });

  it('displays tool call badges when present', () => {
    render(
      <ChatMessage 
        {...defaultProps} 
        role="assistant"
        toolCalls={[
          { name: 'getUserRuns', arguments: { limit: 5 } },
          { name: 'getDatabaseSummary', arguments: {} },
        ]}
      />
    );
    
    expect(screen.getByText('getUserRuns')).toBeInTheDocument();
    expect(screen.getByText('getDatabaseSummary')).toBeInTheDocument();
  });
});