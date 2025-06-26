import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@lib/prisma";

export async function GET(_req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  try {
    const post = await prisma.runPost.findUnique({
      where: { id },
      include: { socialProfile: true, comments: true, likes: true },
    });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(post);
  } catch (err) {
    console.error("Error getting post", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  try {
    const data = await req.json();
    const post = await prisma.runPost.update({ where: { id }, data });
    return NextResponse.json(post);
  } catch (err) {
    console.error("Error updating post", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  try {
    await prisma.runPost.delete({ where: { id } });
    return NextResponse.json({});
  } catch (err) {
    console.error("Error deleting post", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
