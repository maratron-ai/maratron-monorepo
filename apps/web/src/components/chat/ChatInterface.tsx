/**
 * ChatInterface Component - Main chat interface
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
// import { ScrollArea } from '@components/ui/scroll-area';
import { Alert, AlertDescription } from '@components/ui/alert';
import { Separator } from '@components/ui/separator';
import { Badge } from '@components/ui/badge';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Bot, AlertCircle, Sparkles, Activity, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@lib/utils/cn';

interface ChatInterfaceProps {
  className?: string;
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const { data: session, status } = useSession();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // MCP status tracking
  const [mcpStatus, setMcpStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'unknown'>('unknown');

  const [messages, setMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
    mcpStatus?: 'enhanced' | 'no-data-needed' | 'fallback';
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const append = useCallback(async (message: { role: string; content: string }) => {
    const fullMessage = {
      id: Date.now().toString(),
      role: message.role as 'user' | 'assistant' | 'system',
      content: message.content,
      timestamp: new Date()
    };
    const newMessages = [...messages, fullMessage];
    setMessages(newMessages);
    
    if (message.role === 'user') {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages }),
        });
        
        if (!response.ok) {
          throw new Error('Chat request failed');
        }
        
        const responseData = await response.json();
        const assistantMessage = {
          id: Date.now().toString() + '_assistant',
          role: 'assistant' as const,
          content: responseData.content || responseData.message || 'No response',
          timestamp: new Date(),
          toolCalls: responseData.toolCalls || [],
          mcpStatus: responseData.mcpStatus
        };
        setMessages([...newMessages, assistantMessage]);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [messages]);

  // Initialize MCP context when user session is available
  useEffect(() => {
    async function initializeMCP() {
      if (!session?.user?.id) {
        setMcpStatus('unknown');
        return;
      }

      try {
        setMcpStatus('connecting');
        
        // Check MCP server health
        const healthResponse = await fetch('/api/chat', { method: 'GET' });
        const healthData = await healthResponse.json();
        
        if (healthData.mcpStatus === 'connected') {
          setMcpStatus('connected');
        } else {
          setMcpStatus('disconnected');
        }
      } catch (error) {
        console.error('Failed to initialize MCP:', error);
        setMcpStatus('disconnected');
      }
    }

    initializeMCP();
  }, [session?.user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && messages.length > 0) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (session?.user && !isInitialized && messages.length === 0) {
      const welcomeMessage = `Hello ${session.user.name || 'there'}! 👋 

I'm your Maratron AI coach, powered by Claude 3.5. I specialize in:

🏃‍♂️ **Training Science** - Evidence-based running advice and periodization
🩹 **Injury Prevention** - Form analysis and recovery strategies  
🥗 **Sports Nutrition** - Fueling strategies for training and racing
🎯 **Race Preparation** - Pacing, tapering, and mental strategies
💪 **Performance Analysis** - Help you understand your data and progress

I'm here to help you become a stronger, healthier runner. What would you like to discuss about your training?`;

      append({
        role: 'assistant',
        content: welcomeMessage
      });
      setIsInitialized(true);
    }
  }, [session, isInitialized, messages.length, append]);

  const handleSendMessage = async (message: string) => {
    await append({
      role: 'user',
      content: message
    });
  };

  if (status === 'loading') {
    return (
      <Card className={cn('flex-1 flex flex-col', className)}>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Bot className="h-8 w-8 mx-auto text-muted-foreground animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Card className={cn('flex-1 flex flex-col', className)}>
        <CardContent className="flex-1 flex items-center justify-center">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to access the Maratron AI assistant.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('flex-1 flex flex-col h-full min-h-0', className)}>
      {/* Header */}
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Maratron AI</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Beta
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            {/* MCP Status Indicator */}
            <div className="flex items-center gap-1 text-xs">
              {mcpStatus === 'connected' ? (
                <>
                  <Wifi className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">MCP Connected</span>
                </>
              ) : mcpStatus === 'connecting' ? (
                <>
                  <Wifi className="h-3 w-3 text-yellow-500 animate-pulse" />
                  <span className="text-yellow-600">Connecting...</span>
                </>
              ) : mcpStatus === 'disconnected' ? (
                <>
                  <WifiOff className="h-3 w-3 text-red-500" />
                  <span className="text-red-600">Offline Mode</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-500">Unknown</span>
                </>
              )}
            </div>
            
            {/* AI Model Info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>Claude 3.5</span>
            </div>
          </div>
        </div>
        <Separator />
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <div 
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto min-h-0 max-h-full"
          style={{ height: '100%' }}
        >
          <div className="space-y-1">
            {messages.map((message, index) => (
              <div key={message.id || index} className="space-y-1">
                <ChatMessage
                  role={message.role}
                  content={message.content}
                  timestamp={new Date()}
                  isLoading={isLoading && index === messages.length - 1 && message.role === 'assistant'}
                  toolCalls={message.toolCalls}
                  avatarUrl={session?.user?.image}
                  userName={session?.user?.name}
                />
                
                {/* MCP Status Badge for Assistant Messages */}
                {message.role === 'assistant' && message.mcpStatus && (
                  <div className="flex justify-end px-4">
                    <Badge 
                      variant={
                        message.mcpStatus === 'enhanced' ? 'default' :
                        message.mcpStatus === 'no-data-needed' ? 'secondary' :
                        'outline'
                      }
                      className="text-xs"
                    >
                      {message.mcpStatus === 'enhanced' ? '✨ Personalized' :
                       message.mcpStatus === 'no-data-needed' ? '💬 General Advice' :
                       '⚠️ Fallback Mode'}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading indicator for new messages */}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <ChatMessage
                role="assistant"
                content=""
                isLoading={true}
              />
            )}
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="p-4 border-t flex-shrink-0">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error.message || 'Something went wrong. Please try again.'}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            disabled={!!error}
          />
        </div>
      </CardContent>
    </Card>
  );
}