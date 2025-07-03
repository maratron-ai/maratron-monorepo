'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ChatInterface } from '@components/chat/ChatInterface';

interface CoachPersona {
  id: string;
  name: string;
  description: string;
  icon: string;
  personality: string;
}

export function ChatPageClient() {
  const { data: session } = useSession();
  const [selectedCoach, setSelectedCoach] = useState<CoachPersona | null>(null);

  // Fetch user's selected coach
  useEffect(() => {
    const fetchUserCoach = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/users/${session.user.id}`);
          if (response.ok) {
            const userData = await response.json();
            if (userData.selectedCoach) {
              setSelectedCoach(userData.selectedCoach);
            }
          }
        } catch (error) {
          console.error('Failed to fetch user coach:', error);
        }
      }
    };

    fetchUserCoach();
  }, [session?.user?.id]);

  const displayCoach = selectedCoach ? {
    name: selectedCoach.name,
    icon: selectedCoach.icon,
    description: selectedCoach.description
  } : {
    name: 'Maratron AI Assistant',
    icon: '🤖',
    description: 'Your AI running companion'
  };

  return (
      <div className="h-screen w-full flex flex-col overflow-hidden">
        <div className="container mx-auto px-4 max-w-4xl flex-shrink-0 py-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg border-2 border-white/50">
              {displayCoach.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  {displayCoach.name}
                </h1>
                {selectedCoach && (
                  <span className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-full">
                    {selectedCoach.personality}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                {displayCoach.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-sm text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 min-h-0 container mx-auto px-4 max-w-4xl pb-6">
          <ChatInterface 
            className="h-full max-h-full" 
            selectedCoach={selectedCoach}
          />
        </div>
      </div>
  );
}