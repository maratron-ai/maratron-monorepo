import { prisma } from '@lib/prisma';
import type { CoachPersona, User } from '@prisma/client';

/**
 * Validates that a coach persona has all required fields
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
 * Get all available coach personas
 */
export async function getAllCoaches(): Promise<CoachPersona[]> {
  return await prisma.coachPersona.findMany({
    orderBy: { name: 'asc' }
  });
}

/**
 * Get a specific coach persona by ID
 */
export async function getCoachById(coachId: string): Promise<CoachPersona | null> {
  return await prisma.coachPersona.findUnique({
    where: { id: coachId }
  });
}

/**
 * Update user's selected coach
 */
export async function updateUserCoach(userId: string, coachId: string | null): Promise<User> {
  return await prisma.user.update({
    where: { id: userId },
    data: { selectedCoachId: coachId }
  });
}

/**
 * Get user with their selected coach
 */
export async function getUserWithCoach(userId: string): Promise<(User & { selectedCoach?: CoachPersona | null }) | null> {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: { selectedCoach: true }
  });
}