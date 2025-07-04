// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { verifyPassword } from "@lib/utils/passwordUtils";
import { withRateLimit, RATE_LIMITS } from "@lib/middleware/rateLimit";

// Enhanced secure cookie configuration
function setCookie(response: NextResponse, name: string, value: string) {
  const isProduction = process.env.NODE_ENV === "production";
  
  response.cookies.set(name, value, {
    httpOnly: true, // Prevents XSS access
    path: "/",
    sameSite: "strict", // CSRF protection
    secure: isProduction, // HTTPS only in production
    maxAge: 60 * 60 * 24 * 7, // 1 week
    ...(isProduction && {
      domain: process.env.COOKIE_DOMAIN, // Set domain in production
    }),
  });
}

export const POST = withRateLimit(RATE_LIMITS.AUTH, "login")(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password are required" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({ 
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          passwordHash: true,
          avatarUrl: true,
          trainingLevel: true,
          defaultDistanceUnit: true,
        }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Verify password using bcrypt
      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Remove password hash from response for security
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...userWithoutPassword } = user;

      // Set secure session cookie
      const response = NextResponse.json(userWithoutPassword, { status: 200 });
      setCookie(response, "session_user", user.id);

      return response;
    } catch (error) {
      console.error("Authentication error:", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }
);