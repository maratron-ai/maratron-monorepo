// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { 
  AuthenticationError, 
  createErrorResponse, 
  withErrorHandler,
  handlePrismaError 
} from "@lib/utils/errorHandling";
import { logger } from "@lib/logger";

/**
 * Safe user data for client exposure (excludes sensitive fields)
 */
function sanitizeUserData(user: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, sessions, ...safeUserData } = user;
  
  return safeUserData;
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = globalThis.crypto?.randomUUID() || Math.random().toString(36);
  
  try {
    const userId = request.cookies.get("session_user")?.value;

    if (!userId) {
      throw new AuthenticationError("Authentication required", requestId);
    }

    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: {
        profile: {
          select: {
            id: true,
            username: true,
            bio: true,
            profilePhoto: true
          }
        },
        selectedCoach: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            personality: true
          }
        }
      }
    });

    if (!user) {
      throw new AuthenticationError("Authentication failed", requestId);
    }

    // Log successful authentication (without sensitive data)
    logger.info("User authenticated", {
      userId: user.id,
      email: user.email,
      requestId
    });

    // Return sanitized user data
    return NextResponse.json(sanitizeUserData(user), { status: 200 });
    
  } catch (error) {
    // Handle database errors securely
    if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
      const appError = handlePrismaError(error, 'findUser', 'User', requestId);
      return createErrorResponse(appError, requestId);
    }
    
    // Re-throw AppErrors (they'll be handled by withErrorHandler)
    throw error;
  }
});
