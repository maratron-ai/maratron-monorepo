import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { GROUP_POST_LIMIT } from "@lib/socialLimits";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const { id } = params;
  const profileId = req.nextUrl.searchParams.get("profileId");
  try {
    const group = await prisma.runGroup.findUnique({
      where: { id },
      select: { private: true },
    });
    if (!group)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (group.private) {
      if (!profileId)
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      const member = await prisma.runGroupMember.findUnique({
        where: {
          groupId_socialProfileId: { groupId: id, socialProfileId: profileId },
        },
      });
      if (!member)
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const posts = await prisma.runPost.findMany({
      where: { groupId: id },
      include: {
        socialProfile: { include: { user: { select: { avatarUrl: true } } } },
        _count: { select: { likes: true, comments: true } },
        likes: profileId
          ? { where: { socialProfileId: profileId }, select: { id: true } }
          : undefined,
      },
      orderBy: { createdAt: "desc" },
      take: GROUP_POST_LIMIT,
    });
    const mapped = posts.map((p) => ({
      id: p.id,
      socialProfileId: p.socialProfileId,
      groupId: p.groupId,
      distance: p.distance,
      time: p.time,
      caption: p.caption,
      photoUrl: p.photoUrl,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      socialProfile: p.socialProfile,
      likeCount: p._count.likes,
      commentCount: p._count.comments,
      liked: profileId ? p.likes.length > 0 : false,
    }));
    return NextResponse.json(mapped);
  } catch (err) {
    console.error("Error listing group posts", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const { id } = params;
  const data = await req.json();
  try {
    const post = await prisma.runPost.create({
      data: { ...data, groupId: id },
    });
    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error("Error creating group post", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
