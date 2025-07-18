import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await ctx.params;
  const { id } = params;
  const profileId = req.nextUrl.searchParams.get("profileId");
  try {
    const group = await prisma.runGroup.findUnique({
      where: { id },
      include: {
        owner: true,
        members: { include: { socialProfile: { include: { user: { select: { avatarUrl: true } } } } } },
        _count: { select: { members: true, posts: true } },
      },
    });
    if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let isMember = false;
    if (profileId) {
      const m = await prisma.runGroupMember.findUnique({
        where: { groupId_socialProfileId: { groupId: id, socialProfileId: profileId } },
      });
      isMember = !!m;
    }

    const userIds = group.members.map((m) => m.socialProfile.userId);
    const distAgg = await prisma.run.aggregate({
      _sum: { distance: true },
      where: { userId: { in: userIds } },
    });

    const { password: _password, ...rest } = group;
    void _password;
    const data = {
      ...rest,
      memberCount: group._count.members,
      postCount: group._count.posts,
      members: group.members.map((m) => m.socialProfile),
      totalDistance: distAgg._sum.distance ?? 0,
      isMember,
    };
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error getting group", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
