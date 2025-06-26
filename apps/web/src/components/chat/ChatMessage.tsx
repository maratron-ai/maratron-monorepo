/**
 * ChatMessage Component - Displays individual chat messages
 */

import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Badge } from '@components/ui/badge';
import { Card, CardContent } from '@components/ui/card';
import { Skeleton } from '@components/ui/skeleton';
import { Bot, User, Zap } from 'lucide-react';
import { cn } from '@lib/utils/cn';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  isLoading?: boolean;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
  avatarUrl?: string;
  userName?: string;
}

export function ChatMessage({
  role,
  content,
  timestamp,
  isLoading = false,
  toolCalls,
  avatarUrl,
  userName
}: ChatMessageProps) {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  if (isSystem) return null; // Don't render system messages

  return (
    <div className="w-full px-4 py-2">
      <div className={cn(
        'flex gap-3 max-w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}>
        {!isUser && (
          <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
            <AvatarImage src="/tron.svg" alt="Maratron AI" />
            <AvatarFallback>
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}

        <div className={cn(
          'max-w-[calc(100%-4rem)] min-w-0 space-y-2',
          isUser ? 'flex flex-col items-end' : 'flex flex-col items-start'
        )}>
          {/* Tool calls indicator */}
          {toolCalls && toolCalls.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {toolCalls.map((tool, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  {tool.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Message content */}
          <Card className={cn(
            'relative max-w-full min-w-0',
            isUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted'
          )}>
            <CardContent className="p-3 min-w-0 max-w-full">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <div 
                  className="text-sm whitespace-pre-wrap break-all min-w-0 max-w-full"
                  style={{ 
                    wordWrap: 'break-word',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word'
                  }}
                >
                  {content}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamp */}
          {timestamp && (
            <div className={cn(
              'text-xs text-muted-foreground',
              isUser ? 'text-right' : 'text-left'
            )}>
              {timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          )}
        </div>

        {isUser && (
          <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
            <AvatarImage src={avatarUrl} alt={userName} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}