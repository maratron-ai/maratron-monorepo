import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@lib/middleware/auth";
import { withRateLimit, RATE_LIMITS } from "@lib/middleware/rateLimit";

export const POST = withRateLimit(RATE_LIMITS.API, "contact-post")(
  async (request: NextRequest) => {
    // Require authentication for contact form submissions
    const authResult = await requireAuth(request);
    if (!authResult.isAuthenticated) {
      return unauthorizedResponse(authResult.error);
    }

    try {
      const { email, message } = await request.json();
      
      // Basic input validation
      if (!email || !message) {
        return NextResponse.json(
          { error: "Email and message are required" },
          { status: 400 }
        );
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }

      // Message length validation
      if (message.length > 5000) {
        return NextResponse.json(
          { error: "Message too long (max 5000 characters)" },
          { status: 400 }
        );
      }

      console.log("Contact form submission:", { 
        email, 
        messageLength: message.length,
        userId: authResult.userId 
      });
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Contact form error:", error);
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  }
);
