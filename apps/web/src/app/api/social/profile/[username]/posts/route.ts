import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { PROFILE_POST_LIMIT } from "@lib/socialLimits";

export async function GET(_req: NextRequest, ctx: { params: { username: string } }) {
  const { username } = ctx.params;
  try {
    const profile = await prisma.socialProfile.findUnique({ where: { username } });
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const posts = await prisma.runPost.findMany({
      where: { socialProfileId: profile.id },
      include: { _count: { select: { likes: true, comments: true } } },
      orderBy: { createdAt: "desc" },
      take: PROFILE_POST_LIMIT,
    });
    return NextResponse.json(posts);
  } catch (err) {
    console.error("Error fetching posts", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
