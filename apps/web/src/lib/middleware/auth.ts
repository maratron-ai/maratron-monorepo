// lib/middleware/auth.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth";

export interface AuthResult {
  isAuthenticated: boolean;
  userId?: string;
  error?: string;
}

/**
 * Authentication middleware for API routes
 * Validates user session and returns user information
 */
export async function requireAuth(): Promise<AuthResult> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return {
        isAuthenticated: false,
        error: "Authentication required"
      };
    }

    return {
      isAuthenticated: true,
      userId: session.user.id
    };
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return {
      isAuthenticated: false,
      error: "Authentication failed"
    };
  }
}

/**
 * Authorization middleware - ensures user can only access their own resources
 */
export async function requireResourceOwnership(userId: string, resourceUserId: string): Promise<boolean> {
  return userId === resourceUserId;
}

/**
 * Helper function to return unauthorized response
 */
export function unauthorizedResponse(message: string = "Unauthorized"): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Helper function to return forbidden response
 */
export function forbiddenResponse(message: string = "Forbidden"): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}

/**
 * Wrapper for protected API routes
 */
export function withAuth<T extends unknown[]>(
  handler: (request: NextRequest, auth: AuthResult, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = await requireAuth(request);
    
    if (!authResult.isAuthenticated) {
      return unauthorizedResponse(authResult.error);
    }
    
    return handler(request, authResult, ...args);
  };
}