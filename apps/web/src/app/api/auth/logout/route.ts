// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );

  // Clear the session cookie by setting maxAge to 0
  response.cookies.set("session_user", "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    // secure: true, // Uncomment for production/HTTPS
    maxAge: 0, // This deletes the cookie
  });

  return response;
}
