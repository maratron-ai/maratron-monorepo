import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { requireAuth, unauthorizedResponse } from '@lib/middleware/auth';
import { withRateLimit, RATE_LIMITS } from '@lib/middleware/rateLimit';

export const GET = withRateLimit(RATE_LIMITS.API, "coaches-get")(
  async () => {
    // Require authentication for coach data access
    const authResult = await requireAuth();
    if (!authResult.isAuthenticated) {
      return unauthorizedResponse(authResult.error);
    }

    try {
      const coaches = await prisma.coachPersona.findMany({
        orderBy: { name: 'asc' },
      });

      return NextResponse.json({ coaches }, { status: 200 });
    } catch (error) {
      console.error('Error fetching coaches:', error);
      return NextResponse.json(
        { error: 'Failed to fetch coaches' },
        { status: 500 }
      );
    }
  }
);