import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { socialProfileId } = await req.json();
  const params = await ctx.params;
  const { id } = params;
  try {
    const like = await prisma.like.upsert({
      where: { postId_socialProfileId: { postId: id, socialProfileId } },
      update: {},
      create: { postId: id, socialProfileId },
    });
    return NextResponse.json(like, { status: 201 });
  } catch (err) {
    console.error("Error liking", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { socialProfileId } = await req.json();
  const params = await ctx.params;
  const { id } = params;
  try {
    await prisma.like.delete({
      where: { postId_socialProfileId: { postId: id, socialProfileId } },
    });
    return NextResponse.json({});
  } catch (err) {
    console.error("Error unliking", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
