/**
 * ChatInput Component - Input field for chat messages
 */

import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@components/ui/button';
import { Textarea } from '@components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@lib/utils/cn';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  isLoading = false,
  disabled = false,
  placeholder = "Ask about your runs, training, or fitness data..."
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isLoading && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="flex gap-2 items-end max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn(
              "min-h-[44px] max-h-[120px] resize-none pr-12",
              "focus-visible:ring-1"
            )}
            rows={1}
          />
          <div className="absolute right-2 bottom-2">
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isLoading || disabled}
              size="sm"
              className="h-8 w-8 p-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Quick action buttons */}
      <div className="flex gap-2 mt-2 max-w-4xl mx-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSendMessage("Show me my recent runs")}
          disabled={isLoading || disabled}
          className="text-xs"
        >
          Recent Runs
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSendMessage("What's my training summary?")}
          disabled={isLoading || disabled}
          className="text-xs"
        >
          Training Summary
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSendMessage("Show me my shoes")}
          disabled={isLoading || disabled}
          className="text-xs"
        >
          My Shoes
        </Button>
      </div>
    </div>
  );
}