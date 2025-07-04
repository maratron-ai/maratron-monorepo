// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { requireAuth, requireResourceOwnership, unauthorizedResponse, forbiddenResponse } from "@lib/middleware/auth";
import { withRateLimit, RATE_LIMITS } from "@lib/middleware/rateLimit";
import { cache, cacheManager } from "@lib/cache/cache-manager";

export const GET = withRateLimit(RATE_LIMITS.API, "user-get")(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const params = await context.params;
    const { id } = params;
    
    // Require authentication
    const authResult = await requireAuth(request);
    if (!authResult.isAuthenticated) {
      return unauthorizedResponse(authResult.error);
    }
    
    // Users can only access their own profile
    if (!await requireResourceOwnership(authResult.userId!, id)) {
      return forbiddenResponse("You can only access your own profile");
    }
    
    try {
      // Use cache with fallback to database
      const user = await cache.user.profile(id, async () => {
        return await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            trainingLevel: true,
            defaultDistanceUnit: true,
            goals: true,
            yearsRunning: true,
            weeklyMileage: true,
            preferredTrainingDays: true,
            selectedCoach: {
              select: {
                id: true,
                name: true,
                icon: true,
                description: true
              }
            },
            createdAt: true,
            updatedAt: true
          },
        });
      });
      
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      
      return NextResponse.json(user, { status: 200 });
    } catch (error) {
      console.error("Error fetching user:", error);
      return NextResponse.json(
        { error: "Failed to fetch user" },
        { status: 500 }
      );
    }
  }
);

export const PUT = withRateLimit(RATE_LIMITS.API, "user-put")(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const params = await context.params;
    const { id } = params;
    
    // Require authentication
    const authResult = await requireAuth(request);
    if (!authResult.isAuthenticated) {
      return unauthorizedResponse(authResult.error);
    }
    
    // Users can only update their own profile
    if (!await requireResourceOwnership(authResult.userId!, id)) {
      return forbiddenResponse("You can only update your own profile");
    }
    
    try {
      const body = await request.json();
      
      // Filter out fields that should not be updated directly
      // Remove relational fields, computed fields, and sensitive data
      /* eslint-disable @typescript-eslint/no-unused-vars */
      const {
        id: bodyId,
        createdAt,
        updatedAt,
        runs,
        runningPlans,
        shoes,
        sessions,
        profile,
        defaultShoe,
        selectedCoach,
        passwordHash, // Never allow password hash updates via this endpoint
        email, // Email changes should go through separate verification
        ...updateData
      } = body;
      /* eslint-enable @typescript-eslint/no-unused-vars */
      
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          trainingLevel: true,
          defaultDistanceUnit: true,
          goals: true,
          yearsRunning: true,
          weeklyMileage: true,
          preferredTrainingDays: true,
          selectedCoach: {
            select: {
              id: true,
              name: true,
              icon: true,
              description: true
            }
          },
          updatedAt: true
        },
      });
      
      // Invalidate user cache after update
      await cacheManager.invalidateByTags(['user']);
      
      return NextResponse.json(updatedUser, { status: 200 });
    } catch (error) {
      console.error("Error updating user:", error);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }
  }
);

export const DELETE = withRateLimit(RATE_LIMITS.API, "user-delete")(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const params = await context.params;
    const { id } = params;
    
    // Require authentication
    const authResult = await requireAuth(request);
    if (!authResult.isAuthenticated) {
      return unauthorizedResponse(authResult.error);
    }
    
    // Users can only delete their own profile
    if (!await requireResourceOwnership(authResult.userId!, id)) {
      return forbiddenResponse("You can only delete your own profile");
    }
    
    try {
      await prisma.user.delete({
        where: { id },
      });
      
      // Invalidate all user-related cache entries
      await cacheManager.invalidateByTags(['user', 'social', 'runs', 'shoes']);
      
      return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
    } catch (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json(
        { error: "Failed to delete user" },
        { status: 500 }
      );
    }
  }
);
