import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const { id } = params;
  const { profileId, password } = await req.json();
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }
  try {
    const group = await prisma.runGroup.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (group.private) {
      if (!password) {
        return NextResponse.json({ error: "Password required" }, { status: 400 });
      }
      const ok = await bcrypt.compare(String(password), group.password ?? "");
      if (!ok) {
        return NextResponse.json({ error: "Invalid password" }, { status: 403 });
      }
    }
    await prisma.runGroupMember.upsert({
      where: { groupId_socialProfileId: { groupId: id, socialProfileId: profileId } },
      update: {},
      create: { groupId: id, socialProfileId: profileId },
    });
    return NextResponse.json({}, { status: 201 });
  } catch (err) {
    console.error("Error joining group", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const params = await ctx.params;
  const { id } = params;
  const { profileId } = await req.json();
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }
  try {
    await prisma.runGroupMember.delete({
      where: { groupId_socialProfileId: { groupId: id, socialProfileId: profileId } },
    });
    return NextResponse.json({});
  } catch (err) {
    console.error("Error leaving group", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
