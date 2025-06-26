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
    const profile = await prisma.socialProfile.create({
      data: { userId, username, bio, profilePhoto },
    });
    return NextResponse.json(profile, { status: 201 });
  } catch (err) {
    console.error("Error creating profile", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
