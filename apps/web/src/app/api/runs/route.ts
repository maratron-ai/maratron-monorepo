// src/app/api/runs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { calculateVDOTJackDaniels } from "@utils/running/jackDaniels";
import { parseDuration } from "@utils/time";

export async function GET(request: NextRequest) {
  try {
    // Extract userId from query parameters for proper authorization
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Only return runs for the specified user
    const runs = await prisma.run.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });
    
    return NextResponse.json(runs, { status: 200 });
  } catch (error) {
    console.error("Error fetching runs:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error fetching runs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const {
      date,
      duration,
      distance,
      distanceUnit,
      trainingEnvironment,
      pace, // expected format: { pace: string, unit: "miles" | "kilometers" } or null
      elevationGain,
      elevationGainUnit,
      notes,
      userId,
      shoeId,
      name,
    } = body;
    
    // Validate required fields
    if (!date || !duration || !distance || !distanceUnit || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: date, duration, distance, distanceUnit, userId" },
        { status: 400 }
      );
    }
    
    // Validate data types and ranges
    if (typeof distance !== 'number' || distance <= 0) {
      return NextResponse.json(
        { error: "Distance must be a positive number" },
        { status: 400 }
      );
    }
    
    if (!['miles', 'kilometers'].includes(distanceUnit)) {
      return NextResponse.json(
        { error: "Distance unit must be 'miles' or 'kilometers'" },
        { status: 400 }
      );
    }

    let finalShoeId: string | undefined = shoeId;
    if (!finalShoeId && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { defaultShoeId: true },
      });
      if (user?.defaultShoeId) {
        finalShoeId = user.defaultShoeId;
      }
    }

    const newRun = await prisma.run.create({
      data: {
        date: new Date(date),
        duration,
        distance: Number(distance),
        distanceUnit,
        trainingEnvironment: trainingEnvironment || null,
        name: name || `${new Date(date).toLocaleDateString()} ${new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${trainingEnvironment ? ` - ${trainingEnvironment}` : ''}`,
        pace: pace ? pace.pace : null,
        paceUnit: pace ? pace.unit : null,
        elevationGain: elevationGain ? Number(elevationGain) : null,
        elevationGainUnit:
          elevationGainUnit && elevationGainUnit.trim() !== ""
            ? elevationGainUnit
            : null,
        notes: notes || null,
        user: { connect: { id: userId } },
        ...(finalShoeId ? { shoe: { connect: { id: finalShoeId } } } : {}),
      },
    });

    if (finalShoeId) {
      const shoe = await prisma.shoe.findUnique({
        where: { id: finalShoeId },
        select: { distanceUnit: true },
      });
      if (shoe) {
        let increment = Number(distance);
        if (shoe.distanceUnit !== distanceUnit) {
          increment =
            shoe.distanceUnit === "miles"
              ? Number(distance) * 0.621371
              : Number(distance) * 1.60934;
        }
        await prisma.shoe.update({
          where: { id: finalShoeId },
          data: {
            currentDistance: {
              increment,
            },
          },
        });
      }
    }

    // Estimate VDOT from this run and update user only if it's higher
    try {
      const meters =
        distanceUnit === "miles" ? Number(distance) * 1609.34 : Number(distance) * 1000;
      const seconds = parseDuration(duration);
      const vdot = Math.round(calculateVDOTJackDaniels(meters, seconds));
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { VDOT: true },
      });
      if (user && (user.VDOT === null || vdot > user.VDOT)) {
        await prisma.user.update({ where: { id: userId }, data: { VDOT: vdot } });
      }
    } catch (err) {
      console.error("Failed to update VDOT", err);
    }

    return NextResponse.json(newRun, { status: 201 });
  } catch (error) {
    console.error("Error creating run:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error creating run",
      },
      { status: 500 }
    );
  }
}
