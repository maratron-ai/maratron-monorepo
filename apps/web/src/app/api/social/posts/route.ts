import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { PROFILE_POST_LIMIT } from "@lib/socialLimits";
import { requireAuth, unauthorizedResponse } from "@lib/middleware/auth";
import { withRateLimit, RATE_LIMITS } from "@lib/middleware/rateLimit";
import { validateRequest } from "@lib/utils/validation/apiValidator";
import { socialPostSchema, validatePostContent } from "@lib/utils/validation/socialSchemas";

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
      // Validate request body
      const validation = await validateRequest(request, socialPostSchema);
      
      if (!validation.success) {
        return NextResponse.json(
          { error: "Invalid post data", details: validation.errors },
          { status: 400 }
        );
      }
      
      const data = validation.data!;
      
      // Additional content validation and sanitization
      if (data.content) {
        const contentValidation = validatePostContent(data.content);
        if (!contentValidation.isValid) {
          return NextResponse.json(
            { error: contentValidation.error },
            { status: 400 }
          );
        }
        data.content = contentValidation.sanitized!;
      }
      
      // Validate that the socialProfileId belongs to the authenticated user
      const socialProfile = await prisma.socialProfile.findFirst({
        where: {
          id: data.socialProfileId,
          userId: authResult.userId
        }
      });
      
      if (!socialProfile) {
        return NextResponse.json({ error: "Invalid social profile" }, { status: 403 });
      }
      
      // Create post with validated and sanitized data
      const post = await prisma.runPost.create({ 
        data: {
          socialProfileId: data.socialProfileId,
          content: data.content,
          title: data.title,
          runId: data.runId,
          photos: data.photos,
          visibility: data.visibility || 'PUBLIC',
          tags: data.tags
        },
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
