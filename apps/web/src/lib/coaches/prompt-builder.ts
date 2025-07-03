import type { CoachPersona } from '@prisma/client';

/**
 * Type for user with optional selected coach
 */
export interface UserWithCoach {
  id: string;
  name: string;
  selectedCoach?: CoachPersona | null;
}

/**
 * Extracts the system prompt from a coach persona
 */
export function getCoachSystemPrompt(coach: CoachPersona | null | undefined): string | null {
  if (!coach) {
    return null;
  }
  return coach.systemPrompt || '';
}

/**
 * Combines base system prompt with coach persona prompt
 */
export function enhanceSystemPrompt(
  basePrompt: string | null | undefined,
  coachPrompt: string | null | undefined
): string {
  // Handle null/undefined base prompt
  if (!basePrompt && coachPrompt) {
    return coachPrompt;
  }
  
  if (!basePrompt) {
    return '';
  }

  // If no coach prompt, return base prompt
  if (!coachPrompt || coachPrompt.trim() === '') {
    return basePrompt;
  }

  // Combine prompts with clear structure
  return `${basePrompt}

## COACH PERSONA
${coachPrompt}

## IMPORTANT INSTRUCTIONS
- Embody the coach persona completely in your responses
- Maintain the coach's personality, tone, and communication style
- The coach persona takes priority in how you communicate
- Still provide accurate running advice while staying in character
- Use the coach's specific language patterns and motivational approach`;
}

/**
 * Builds a complete personalized prompt with coach persona and user context
 */
export function buildPersonalizedPrompt(
  basePrompt: string,
  user: UserWithCoach,
  userContext?: string | null
): string {
  // Start with base prompt
  let prompt = basePrompt;

  // Add user-specific context
  if (user.name) {
    prompt += `\n\n## USER CONTEXT\nYou are helping ${user.name}.`;
  }

  // Add additional user context if provided
  if (userContext && userContext.trim()) {
    prompt += `\n\nUser Information:\n${userContext}`;
  }

  // Get coach system prompt if user has selected a coach
  const coachPrompt = getCoachSystemPrompt(user.selectedCoach);
  
  // Enhance with coach persona
  if (coachPrompt) {
    prompt = enhanceSystemPrompt(prompt, coachPrompt);
    
    // Add coach-specific instructions
    prompt += `\n\n## COACH IDENTITY
You are ${user.selectedCoach?.name}, coaching ${user.name}. Stay in character and provide advice as this specific coach would.`;
  }

  return prompt;
}

/**
 * Creates a system prompt specifically for chat interactions
 */
export function buildChatSystemPrompt(
  user: UserWithCoach,
  userContext?: string | null
): string {
  const baseChatPrompt = `You are an expert running coach and assistant with comprehensive knowledge of training, nutrition, injury prevention, and racing strategies. You have access to the user's running data and can provide personalized advice based on their history, goals, and current fitness level.

## CORE RESPONSIBILITIES
- Provide personalized running advice based on user data
- Help with training plans, race preparation, and goal setting
- Assist with injury prevention and recovery strategies
- Offer motivation and support for running goals
- Answer questions about running techniques, gear, and nutrition

## COMMUNICATION STYLE
- Be encouraging and supportive
- Use specific data when available
- Provide actionable advice
- Ask clarifying questions when needed
- Celebrate achievements and progress`;

  return buildPersonalizedPrompt(baseChatPrompt, user, userContext);
}

/**
 * Validates that a coach persona prompt is well-formed
 */
export function validateCoachPersona(coach: Partial<CoachPersona>): void {
  if (!coach.name) {
    throw new Error('Coach name is required');
  }
  
  if (!coach.description) {
    throw new Error('Coach description is required');
  }
  
  if (!coach.icon) {
    throw new Error('Coach icon is required');
  }
  
  if (!coach.systemPrompt || coach.systemPrompt.trim() === '') {
    throw new Error('System prompt cannot be empty');
  }
  
  if (!coach.personality) {
    throw new Error('Coach personality is required');
  }
}

/**
 * Checks if a user has a coach selected
 */
export function hasSelectedCoach(user: UserWithCoach): boolean {
  return !!(user.selectedCoach && user.selectedCoach.id);
}

/**
 * Gets the coach name for display purposes
 */
export function getCoachDisplayName(user: UserWithCoach): string | null {
  if (!hasSelectedCoach(user)) {
    return null;
  }
  return user.selectedCoach?.name || null;
}