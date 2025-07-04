// src/app/api/runs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { calculateVDOTJackDaniels } from "@utils/running/jackDaniels";
import { parseDuration } from "@utils/time";
import { cache, cacheManager } from "@lib/cache/cache-manager";

export async function GET(request: NextRequest) {
  try {
    // Extract parameters from query string
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '0');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 items
    const includeShoe = searchParams.get('includeShoe') === 'true';
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate pagination parameters
    if (page < 0 || limit < 1) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }
    
    // OPTIMIZED: Cache runs data with pagination
    const runsData = await cache.user.runs(userId, page, limit, async () => {
      const [runs, totalCount] = await Promise.all([
        prisma.run.findMany({
          where: { userId },
          orderBy: { date: 'desc' },
          take: limit,
          skip: page * limit,
          select: {
            id: true,
            date: true,
            duration: true,
            distance: true,
            distanceUnit: true,
            pace: true,
            paceUnit: true,
            elevationGain: true,
            elevationGainUnit: true,
            trainingEnvironment: true,
            name: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
            // Conditionally include shoe data
            ...(includeShoe && {
              shoe: {
                select: {
                  id: true,
                  name: true,
                  currentDistance: true,
                  maxDistance: true,
                  distanceUnit: true,
                }
              }
            })
          }
        }),
        // Get total count for pagination metadata
        prisma.run.count({
          where: { userId }
        })
      ]);
      
      return { runs, totalCount };
    });
    
    const { runs, totalCount } = runsData;

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages - 1;
    const hasPreviousPage = page > 0;
    
    return NextResponse.json({
      runs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      }
    }, { status: 200 });
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

    // OPTIMIZED: Use transaction to eliminate N+1 queries
    const newRun = await prisma.$transaction(async (tx) => {
      // Single query to get user data (defaultShoeId and current VDOT)
      const userData = await tx.user.findUnique({
        where: { id: userId },
        select: { 
          defaultShoeId: true, 
          VDOT: true,
        },
      });

      // Determine final shoe ID
      const finalShoeId = shoeId || userData?.defaultShoeId;
      
      // Get shoe data if needed (for distance unit conversion)
      const shoeData = finalShoeId ? await tx.shoe.findUnique({
        where: { id: finalShoeId },
        select: { distanceUnit: true },
      }) : null;

      // Calculate distance increment for shoe if applicable
      let shoeDistanceIncrement = 0;
      if (shoeData) {
        shoeDistanceIncrement = Number(distance);
        if (shoeData.distanceUnit !== distanceUnit) {
          shoeDistanceIncrement =
            shoeData.distanceUnit === "miles"
              ? Number(distance) * 0.621371
              : Number(distance) * 1.60934;
        }
      }

      // Calculate VDOT for user update
      let newVDOT: number | null = null;
      try {
        const meters =
          distanceUnit === "miles" ? Number(distance) * 1609.34 : Number(distance) * 1000;
        const seconds = parseDuration(duration);
        const calculatedVDOT = Math.round(calculateVDOTJackDaniels(meters, seconds));
        
        // Only update VDOT if it's higher than current
        if (!userData?.VDOT || calculatedVDOT > userData.VDOT) {
          newVDOT = calculatedVDOT;
        }
      } catch (err) {
        console.error("Failed to calculate VDOT", err);
      }

      // Execute all operations in parallel within the transaction
      const operations = [
        // Create the new run
        tx.run.create({
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                defaultDistanceUnit: true,
              }
            },
            shoe: finalShoeId ? {
              select: {
                id: true,
                name: true,
                currentDistance: true,
                maxDistance: true,
              }
            } : false,
          }
        }),
      ];

      // Add shoe update operation if needed
      if (finalShoeId && shoeDistanceIncrement > 0) {
        operations.push(
          tx.shoe.update({
            where: { id: finalShoeId },
            data: {
              currentDistance: {
                increment: shoeDistanceIncrement,
              },
            },
          })
        );
      }

      // Add user VDOT update operation if needed
      if (newVDOT) {
        operations.push(
          tx.user.update({
            where: { id: userId },
            data: { VDOT: newVDOT },
          })
        );
      }

      // Execute all operations in parallel
      const results = await Promise.all(operations);
      
      // Return the created run (first operation result)
      return results[0];
    });

    // Invalidate runs cache after creating a new run
    await cacheManager.invalidateByTags(['runs', 'user']);

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
