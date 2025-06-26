import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { PROFILE_POST_LIMIT } from "@lib/socialLimits";

export async function GET() {
  try {
    const posts = await prisma.runPost.findMany({
      include: { socialProfile: true },
      orderBy: { createdAt: "desc" },
      take: PROFILE_POST_LIMIT,
    });
    return NextResponse.json(posts);
  } catch (err) {
    console.error("Error listing posts", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const post = await prisma.runPost.create({ data });
    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error("Error creating post", err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
