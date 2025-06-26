import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../chat/ChatInput';

describe('ChatInput', () => {
  const mockOnSendMessage = jest.fn();
  
  const defaultProps = {
    onSendMessage: mockOnSendMessage,
    isLoading: false,
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders textarea with placeholder', () => {
    render(<ChatInput {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText('Ask about your runs, training, or fitness data...');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('renders quick action buttons', () => {
    render(<ChatInput {...defaultProps} />);
    
    expect(screen.getByText('Recent Runs')).toBeInTheDocument();
    expect(screen.getByText('Training Summary')).toBeInTheDocument();
    expect(screen.getByText('My Shoes')).toBeInTheDocument();
  });

  it('allows typing in textarea', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello world');
    
    expect(textarea).toHaveValue('Hello world');
  });

  it('calls onSendMessage when quick action is clicked', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} />);
    
    const recentRunsButton = screen.getByText('Recent Runs');
    await user.click(recentRunsButton);
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Show me my recent runs');
  });

  it('disables input when loading', () => {
    render(<ChatInput {...defaultProps} isLoading={true} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  it('disables all inputs when disabled prop is true', () => {
    render(<ChatInput {...defaultProps} disabled={true} />);
    
    const textarea = screen.getByRole('textbox');
    const buttons = screen.getAllByRole('button');
    
    expect(textarea).toBeDisabled();
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('sends message on Enter key press', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    
    await user.type(textarea, 'Test message');
    await user.keyboard('{Enter}');
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('does not send on Shift+Enter', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    
    await user.type(textarea, 'Line 1');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    await user.type(textarea, 'Line 2');
    
    expect(mockOnSendMessage).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Line 1\nLine 2');
  });

  it('trims whitespace before sending', () => {
    render(<ChatInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: '  Test message  ' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
  });
});