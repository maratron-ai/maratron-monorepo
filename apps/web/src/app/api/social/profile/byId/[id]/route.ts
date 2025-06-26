import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const { id } = params;
  const data = await req.json();
  try {
    const profile = await prisma.socialProfile.update({
      where: { id },
      data: {
        username: data.username,
        bio: data.bio,
        profilePhoto: data.profilePhoto,
      },
    });
    return NextResponse.json(profile);
  } catch (err) {
    console.error("Error updating profile", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
