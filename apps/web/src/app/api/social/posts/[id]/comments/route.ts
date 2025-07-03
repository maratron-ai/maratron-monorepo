import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { COMMENT_LIMIT } from "@lib/socialLimits";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { socialProfileId, text } = await req.json();
  const params = await ctx.params;
  const { id } = params;
  try {
    const comment = await prisma.comment.create({
      data: { postId: id, socialProfileId, text },
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    console.error("Error commenting", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const { id } = params;
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: id },
      include: { 
        socialProfile: {
          select: {
            id: true,
            username: true,
            profilePhoto: true,
            user: { select: { avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: COMMENT_LIMIT,
    });
    return NextResponse.json(comments);
  } catch (err) {
    console.error("Error listing comments", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
