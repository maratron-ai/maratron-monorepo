import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function POST(req: NextRequest) {
  const { followerId, followingId } = await req.json();
  if (!followerId || !followingId) {
    return NextResponse.json({ error: "followerId and followingId required" }, { status: 400 });
  }
  try {
    const follow = await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      update: {},
      create: { followerId, followingId },
    });
    return NextResponse.json(follow, { status: 201 });
  } catch (err) {
    console.error("Error following", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const followerId = req.nextUrl.searchParams.get("followerId");
  const followingId = req.nextUrl.searchParams.get("followingId");
  if (!followerId || !followingId) {
    return NextResponse.json(
      { error: "followerId and followingId required" },
      { status: 400 }
    );
  }
  try {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return NextResponse.json({ following: !!follow });
  } catch (err) {
    console.error("Error checking follow", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { followerId, followingId } = await req.json();
  try {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return NextResponse.json({});
  } catch (err) {
    console.error("Error unfollow", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
