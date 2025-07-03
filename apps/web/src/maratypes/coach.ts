import type { CoachPersona, User } from '@prisma/client';

/**
 * Coach persona data structure
 */
export interface CoachPersonaData {
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  personality: string;
}

/**
 * User with selected coach relationship
 */
export interface UserWithCoach extends User {
  selectedCoach?: CoachPersona | null;
}

/**
 * Coach selection component props
 */
export interface CoachSelectorProps {
  coaches: CoachPersona[];
  selectedCoachId?: string | null;
  onCoachSelect: (coachId: string | null) => void;
  loading?: boolean;
  error?: string | null;
}

/**
 * Individual coach card component props
 */
export interface CoachCardProps {
  coach: CoachPersona;
  isSelected: boolean;
  onSelect: (coachId: string) => void;
  disabled?: boolean;
}

/**
 * Coach API response types
 */
export interface CoachesResponse {
  coaches: CoachPersona[];
}

export interface UserCoachResponse {
  user: UserWithCoach;
}

export interface CoachSelectionRequest {
  coachId: string | null;
}

/**
 * Coach personality types enum
 */
export enum CoachPersonalityType {
  MOTIVATIONAL = 'motivational',
  ZEN = 'zen',
  ANALYTICAL = 'analytical',
  FRIENDLY = 'friendly',
  TRADITIONAL = 'traditional',
  UNCONVENTIONAL = 'unconventional'
}

/**
 * Coach prompt builder context
 */
export interface PromptContext {
  userContext?: string | null;
  basePrompt: string;
  user: UserWithCoach;
}

export type {
  CoachPersona,
  UserWithCoach as UserWithSelectedCoach
};