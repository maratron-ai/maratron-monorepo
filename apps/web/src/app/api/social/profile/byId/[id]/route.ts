import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await ctx.params;
  const { id } = params;
  const data = await req.json();
  
  try {
    // Verify user owns this profile
    const existingProfile = await prisma.socialProfile.findUnique({
      where: { id },
      select: { userId: true }
    });
    
    if (!existingProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    
    if (existingProfile.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
