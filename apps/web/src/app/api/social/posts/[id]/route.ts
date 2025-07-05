import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@lib/prisma";
import { authOptions } from "@lib/auth";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const { id } = params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.runPost.findFirst({
      where: { 
        id,
        socialProfile: {
          userId: session.user.id
        }
      },
      include: { socialProfile: true, comments: true, likes: true },
    });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(post);
  } catch (err) {
    console.error("Error getting post", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const { id } = params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the post belongs to the authenticated user
    const existingPost = await prisma.runPost.findFirst({
      where: { 
        id,
        socialProfile: {
          userId: session.user.id
        }
      },
    });
    if (!existingPost) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = await req.json();
    const post = await prisma.runPost.update({ where: { id }, data });
    return NextResponse.json(post);
  } catch (err) {
    console.error("Error updating post", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const { id } = params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the post belongs to the authenticated user
    const existingPost = await prisma.runPost.findFirst({
      where: { 
        id,
        socialProfile: {
          userId: session.user.id
        }
      },
    });
    if (!existingPost) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.runPost.delete({ where: { id } });
    return NextResponse.json({});
  } catch (err) {
    console.error("Error deleting post", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
