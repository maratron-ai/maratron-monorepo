import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { FEED_POST_LIMIT } from "@lib/socialLimits";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  try {
    const viewerProfile = await prisma.socialProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    const followed = await prisma.follow.findMany({
      where: { follower: { userId } },
      select: { followingId: true },
    });
    const ids = followed.map((f) => f.followingId);
    if (viewerProfile) ids.push(viewerProfile.id);
    const posts = await prisma.runPost.findMany({
      where: {
        socialProfileId: { in: ids },
        groupId: null,
      },
      include: {
        socialProfile: {
          include: { user: { select: { avatarUrl: true } } },
        },
        _count: { select: { likes: true, comments: true } },
        likes: {
          where: { socialProfile: { userId } },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: FEED_POST_LIMIT,
    });

    const mapped = posts.map((p) => ({
      id: p.id,
      socialProfileId: p.socialProfileId,
      distance: p.distance,
      time: p.time,
      caption: p.caption,
      photoUrl: p.photoUrl,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      socialProfile: p.socialProfile,
      likeCount: p._count.likes,
      commentCount: p._count.comments,
      liked: p.likes.length > 0,
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    console.error("Error fetching feed", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
