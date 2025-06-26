import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { GROUP_LIST_LIMIT } from "@lib/socialLimits";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("profileId");
  try {
    const groups = await prisma.runGroup.findMany({
      include: { _count: { select: { members: true, posts: true } } },
      orderBy: { createdAt: "desc" },
      take: GROUP_LIST_LIMIT,
    });
    let memberships: Set<string> | null = null;
    if (profileId) {
      const memberRows = await prisma.runGroupMember.findMany({
        where: { socialProfileId: profileId },
        select: { groupId: true },
      });
      memberships = new Set(memberRows.map((m) => m.groupId));
    }
    const mapped = groups.map((g) => {
      const { password: _password, ...rest } = g;
      void _password;
      return {
        ...rest,
        memberCount: g._count.members,
        postCount: g._count.posts,
        isMember: memberships ? memberships.has(g.id) : undefined,
      };
    });
    return NextResponse.json(mapped);
  } catch (err) {
    console.error("Error listing groups", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  if (!data.name || !data.ownerId) {
    return NextResponse.json(
      { error: "name and ownerId required" },
      { status: 400 }
    );
  }
  try {
    const { password, ...groupInput } = data;
    const hashed = password ? await bcrypt.hash(String(password), 10) : undefined;
    const group = await prisma.runGroup.create({
      data: { ...groupInput, password: hashed },
    });
    // ensure creator is a member for private groups
    if (group.private) {
      await prisma.runGroupMember.create({
        data: { groupId: group.id, socialProfileId: group.ownerId },
      });
    }
    const { password: _password, ...groupWithoutPassword } = group;
    void _password;
    return NextResponse.json(groupWithoutPassword, { status: 201 });
  } catch (err) {
    console.error("Error creating group", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
