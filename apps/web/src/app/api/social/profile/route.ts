import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function POST(req: NextRequest) {
  const { userId, username, bio, profilePhoto } = await req.json();
  if (!userId || !username) {
    return NextResponse.json(
      { error: "userId and username required" },
      { status: 400 }
    );
  }
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const profile = await prisma.socialProfile.create({
      data: { userId, username, bio, profilePhoto },
    });
    return NextResponse.json(profile, { status: 201 });
  } catch (err) {
    console.error("Error creating profile", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
