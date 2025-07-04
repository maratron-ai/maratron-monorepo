import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { PROFILE_POST_LIMIT } from "@lib/socialLimits";
import { requireAuth, unauthorizedResponse } from "@lib/middleware/auth";
import { withRateLimit, RATE_LIMITS } from "@lib/middleware/rateLimit";

export const GET = withRateLimit(RATE_LIMITS.SOCIAL, "posts-get")(
  async () => {
    try {
      const posts = await prisma.runPost.findMany({
        include: { socialProfile: true },
        orderBy: { createdAt: "desc" },
        take: PROFILE_POST_LIMIT,
      });
      return NextResponse.json(posts);
    } catch (err) {
      console.error("Error listing posts", err);
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }
  }
);

export const POST = withRateLimit(RATE_LIMITS.SOCIAL, "posts-create")(
  async (request: NextRequest) => {
    // Require authentication
    const authResult = await requireAuth();
    if (!authResult.isAuthenticated) {
      return unauthorizedResponse(authResult.error);
    }
    
    try {
      const data = await request.json();
      
      // Validate that the socialProfileId belongs to the authenticated user
      if (data.socialProfileId) {
        const socialProfile = await prisma.socialProfile.findFirst({
          where: {
            id: data.socialProfileId,
            userId: authResult.userId
          }
        });
        
        if (!socialProfile) {
          return NextResponse.json({ error: "Invalid social profile" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: "socialProfileId is required" }, { status: 400 });
      }
      
      const post = await prisma.runPost.create({ 
        data: data,
        include: {
          socialProfile: true
        }
      });
      
      return NextResponse.json(post, { status: 201 });
    } catch (err) {
      console.error("Error creating post", err);
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }
  }
);
