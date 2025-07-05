// app/api/runs/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@lib/prisma";
import { calculateVDOTJackDaniels } from "@utils/running/jackDaniels";
import { parseDuration } from "@utils/time";
import { authOptions } from "@lib/auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params
    const { id } = params
    const run = await prisma.run.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    return NextResponse.json(run, { status: 200 });
  } catch (error) {
    console.error("Error fetching run:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error fetching run" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const params = await context.params
    const { id } = params
    
    // Verify the run belongs to the authenticated user
    const existingRun = await prisma.run.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existingRun) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const updatedRun = await prisma.run.update({
      where: { id },
      data: body,
    });

    try {
      const meters =
        updatedRun.distanceUnit === "miles"
          ? updatedRun.distance * 1609.34
          : updatedRun.distance * 1000;
      const seconds = parseDuration(updatedRun.duration);
      const vdot = Math.round(calculateVDOTJackDaniels(meters, seconds));
      const user = await prisma.user.findUnique({
        where: { id: updatedRun.userId },
        select: { VDOT: true },
      });
      if (user && (user.VDOT === null || vdot > user.VDOT)) {
        await prisma.user.update({ where: { id: updatedRun.userId }, data: { VDOT: vdot } });
      }
    } catch (err) {
      console.error("Failed to update VDOT", err);
    }

    return NextResponse.json(updatedRun, { status: 200 });
  } catch (error) {
    console.error("Error updating run:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error updating run" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params
    const { id } = params
    
    // Verify the run belongs to the authenticated user
    const existingRun = await prisma.run.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existingRun) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    await prisma.run.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Run deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting run:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error deleting run" },
      { status: 500 }
    );
  }
}

