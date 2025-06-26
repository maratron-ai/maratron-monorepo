import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ username: string }> }) {
  const params = await ctx.params;
  const { username } = params;
  try {
    const profile = await prisma.socialProfile.findUnique({
      where: { username },
      include: {
        user: {
          select: {
            name: true,
            avatarUrl: true,
            _count: { select: { runs: true } },
          },
        },
        _count: { select: { followers: true, following: true, posts: true } },
      },
    });
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const total = await prisma.run.aggregate({
      where: { userId: profile.userId },
      _sum: { distance: true },
    });

    const data = {
      id: profile.id,
      userId: profile.userId,
      username: profile.username,
      bio: profile.bio,
      avatarUrl: profile.user.avatarUrl,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      name: profile.user.name,
      runCount: profile.user._count.runs,
      totalDistance: total._sum.distance ?? 0,
      followerCount: profile._count.followers,
      followingCount: profile._count.following,
      postCount: profile._count.posts,
    };

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error getting profile", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
