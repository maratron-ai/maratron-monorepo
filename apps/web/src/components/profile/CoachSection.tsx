"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@components/ui/button';
import { CoachSelector } from '@components/coaches';
import { User } from '@maratypes/user';
import type { CoachPersona } from '@prisma/client';
import styles from './Section.module.css';

interface CoachSectionProps {
  formData: Partial<User>;
  isEditing: boolean;
  onChange: (field: keyof User, value: string | null | CoachPersona) => void;
}

export default function CoachSection({ formData, isEditing, onChange }: CoachSectionProps) {
  const [coaches, setCoaches] = useState<CoachPersona[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  // Load coaches when component mounts or when editing mode is enabled
  useEffect(() => {
    if (isEditing) {
      loadCoaches();
    }
  }, [isEditing]);

  const loadCoaches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/coaches');
      if (!response.ok) {
        throw new Error('Failed to load coaches');
      }
      
      const data = await response.json();
      setCoaches(data.coaches || []);
    } catch (error) {
      console.error('Error loading coaches:', error);
      setError('Failed to load coaches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCoachSelect = async (coachId: string | null) => {
    try {
      setError(null);
      
      // Update via API
      const response = await fetch('/api/user/coach', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coachId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update coach selection');
      }
      
      // Update local form data
      onChange('selectedCoachId', coachId);
      
      // Update the selectedCoach object if needed
      if (coachId) {
        const selectedCoach = coaches.find(coach => coach.id === coachId);
        if (selectedCoach) {
          onChange('selectedCoach', selectedCoach);
        }
      } else {
        onChange('selectedCoach', null);
      }
      
      setShowSelector(false);
    } catch (error) {
      console.error('Error updating coach selection:', error);
      setError('Failed to update coach selection. Please try again.');
    }
  };

  // Use selectedCoach from formData if available, otherwise find in coaches array
  const selectedCoach = formData.selectedCoach || coaches.find(coach => coach.id === formData.selectedCoachId);

  // Get personality-based styling that matches the brand theme with transparent backgrounds
  const getPersonalityStyle = (personality: string | undefined | null) => {
    if (!personality) return 'bg-slate-500/10';
    
    switch (personality.toLowerCase()) {
      case 'motivational':
        return 'bg-purple-500/10';
      case 'mindful':
        return 'bg-blue-500/10';
      case 'analytical':
        return 'bg-indigo-500/10';
      case 'friendly':
        return 'bg-blue-500/10';
      case 'traditional':
        return 'bg-purple-500/10';
      case 'unconventional':
        return 'bg-violet-500/10';
      default:
        return 'bg-slate-500/10';
    }
  };

  const getPersonalityBadgeStyle = (personality: string | undefined | null) => {
    if (!personality) return 'bg-slate-500/20 text-slate-300';
    
    switch (personality.toLowerCase()) {
      case 'motivational':
        return 'bg-purple-500/20 text-purple-300';
      case 'mindful':
        return 'bg-blue-500/20 text-blue-300';
      case 'analytical':
        return 'bg-indigo-500/20 text-indigo-300';
      case 'friendly':
        return 'bg-blue-500/20 text-blue-300';
      case 'traditional':
        return 'bg-purple-500/20 text-purple-300';
      case 'unconventional':
        return 'bg-violet-500/20 text-violet-300';
      default:
        return 'bg-slate-500/20 text-slate-300';
    }
  };

  return (
    <section className={styles.card}>
      <h3 className={styles.title}>AI Coach Persona</h3>
        {!isEditing ? (
          // Display mode
          <div className="space-y-3">
            {selectedCoach ? (
              <div className={`relative overflow-hidden rounded-lg p-4 ${getPersonalityStyle(selectedCoach.personality)}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-2xl shadow-sm border border-white/50">
                      {selectedCoach.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-semibold text-foreground">{selectedCoach.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPersonalityBadgeStyle(selectedCoach.personality)}`}>
                        {selectedCoach.personality}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-2">{selectedCoach.description}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)]"></div>
                      <span className="text-xs font-medium text-muted-foreground">Active in your conversations</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-lg p-6 text-center bg-transparent">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xl mx-auto mb-3">
                  🤖
                </div>
                <h4 className="font-semibold text-foreground mb-2">No AI coach selected</h4>
                <p className="text-sm text-muted-foreground mb-3">Choose a personalized AI coach to get tailored training advice and motivation</p>
                <div className="flex justify-center">
                  <span className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full">Click Edit to select a coach</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Edit mode
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            
            {selectedCoach && !showSelector ? (
              <div className="space-y-3">
                <div className={`relative overflow-hidden rounded-lg p-3 ${getPersonalityStyle(selectedCoach.personality)}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-xl shadow-sm border border-white/50">
                      {selectedCoach.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{selectedCoach.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPersonalityBadgeStyle(selectedCoach.personality)}`}>
                          {selectedCoach.personality}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm">{selectedCoach.description}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSelector(true)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                  >
                    Change Coach
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCoachSelect(null)}
                    className="bg-red-600/30 border-red-500/40 text-red-200 hover:bg-red-600/50 hover:border-red-400/60 hover:text-red-100"
                  >
                    Remove Coach
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {!selectedCoach && !showSelector && (
                  <div className="relative overflow-hidden rounded-lg p-4 text-center bg-transparent">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg mx-auto mb-2">
                      🤖
                    </div>
                    <p className="text-muted-foreground mb-3 text-sm">No AI coach selected</p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowSelector(true)}
                      className="bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] text-white border-0 hover:opacity-90"
                    >
                      Choose Your Coach
                    </Button>
                  </div>
                )}
                
                {showSelector && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-foreground">Choose Your AI Coach</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSelector(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                    
                    <CoachSelector
                      coaches={coaches}
                      selectedCoachId={formData.selectedCoachId}
                      onCoachSelect={handleCoachSelect}
                      loading={loading}
                      error={error}
                    />
                  </div>
                )}
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              <p>Your AI coach will provide personalized training advice and motivation in the chat. You can change your coach anytime.</p>
            </div>
          </div>
        )}
    </section>
  );
}