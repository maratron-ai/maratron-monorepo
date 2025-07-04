import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { GROUP_LIST_LIMIT } from "@lib/socialLimits";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("profileId");
  const page = parseInt(req.nextUrl.searchParams.get("page") || "0");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || GROUP_LIST_LIMIT.toString()), 100);
  
  try {
    // OPTIMIZED: Single query with conditional membership include
    const [groups, totalCount] = await Promise.all([
      prisma.runGroup.findMany({
        include: { 
          _count: { select: { members: true, posts: true } },
          // Conditionally include user's membership status
          ...(profileId && {
            members: {
              where: { socialProfileId: profileId },
              select: { socialProfileId: true },
              take: 1, // Only need to know if user is a member
            }
          })
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: page * limit,
      }),
      prisma.runGroup.count()
    ]);

    const mapped = groups.map((g) => {
      const { password: _password, members, ...rest } = g;
      void _password;
      return {
        ...rest,
        memberCount: g._count.members,
        postCount: g._count.posts,
        isMember: profileId ? (members && members.length > 0) : undefined,
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages - 1;
    const hasPreviousPage = page > 0;

    return NextResponse.json({
      groups: mapped,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      }
    });
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
