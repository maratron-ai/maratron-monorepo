import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@lib/utils/validation/apiValidator";
import { newsletterSchema } from "@lib/utils/validation/socialSchemas";
import { withRateLimit, RATE_LIMITS } from "@lib/middleware/rateLimit";
import { prisma } from "@lib/prisma";

export const POST = withRateLimit(RATE_LIMITS.AUTH, "newsletter")(async (request: NextRequest) => {
  try {
    // Validate request body
    const validation = await validateRequest(request, newsletterSchema);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid newsletter data", details: validation.errors },
        { status: 400 }
      );
    }
    
    const { email, preferences } = validation.data!;
    
    // Check if email already exists (optional - depends on business logic)
    const existingSubscription = await prisma.newsletterSubscription.findUnique({
      where: { email }
    });
    
    if (existingSubscription) {
      return NextResponse.json(
        { error: "Email already subscribed" },
        { status: 409 }
      );
    }
    
    // Create newsletter subscription
    await prisma.newsletterSubscription.create({
      data: {
        email,
        preferences: preferences || { frequency: 'weekly', topics: [] },
        subscribed: true,
        subscribedAt: new Date()
      }
    });
    
    console.log("Newsletter signup:", email);
    return NextResponse.json({ success: true, message: "Successfully subscribed to newsletter" });
    
  } catch (error) {
    console.error("Newsletter signup error:", error);
    return NextResponse.json(
      { error: "Failed to process newsletter subscription" },
      { status: 500 }
    );
  }
});
