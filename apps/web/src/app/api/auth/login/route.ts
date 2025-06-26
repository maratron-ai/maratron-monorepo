// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

// set cookie
function setCookie(response: NextResponse, name: string, value: string) {
  response.cookies.set(name, value, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    // secure: true, // use in production with HTTPS
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // For now, no password check

    // Set a simple session cookie (user ID)
    const response = NextResponse.json(user, { status: 200 });
    setCookie(response, "session_user", user.id);

    return response;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}