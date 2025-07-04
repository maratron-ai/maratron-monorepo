// src/app/api/runs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { calculateVDOTJackDaniels } from "@utils/running/jackDaniels";
import { parseDuration } from "@utils/time";
import { cache, cacheManager } from "@lib/cache/cache-manager";
import { validateQuery, validateRequest } from "@lib/utils/validation/apiValidator";
import { withRequestLogging } from "@lib/middleware/requestLogger";
import { withErrorHandler, ErrorUtils, handlePrismaError } from "@lib/utils/errorHandling";
import { logger } from "@lib/logger";
import runSchema from "@lib/schemas/runSchema";
import * as Yup from "yup";

// Query validation schema for GET endpoint
const runsQuerySchema = Yup.object().shape({
  userId: Yup.string().required("User ID is required"),
  page: Yup.number().integer().min(0, "Page must be 0 or greater").default(0),
  limit: Yup.number().integer().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").default(50),
  includeShoe: Yup.boolean().default(false)
});

export const GET = withRequestLogging()(
  withErrorHandler(async (request: NextRequest) => {
    const requestId = request.headers.get('x-request-id');
    
    // Validate query parameters
    const queryValidation = await validateQuery(request, runsQuerySchema);
    if (!queryValidation.success) {
      throw ErrorUtils.validationError(queryValidation.errors || [], requestId);
    }

    const { userId, page, limit, includeShoe } = queryValidation.data;
    
    try {
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
      
      logger.info('Runs retrieved successfully', {
        userId,
        page,
        limit,
        totalCount,
        requestId
      });
      
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
      const dbError = handlePrismaError(error, 'fetch', 'runs', requestId);
      throw dbError;
    }
  })
);

export const POST = withRequestLogging()(
  withErrorHandler(async (request: NextRequest) => {
    const requestId = request.headers.get('x-request-id');
    
    // Validate request body using the existing run schema
    const validation = await validateRequest(request, runSchema);
    if (!validation.success) {
      throw ErrorUtils.validationError(validation.errors || [], requestId);
    }

    const {
      date,
      duration,
      distance,
      distanceUnit,
      trainingEnvironment,
      pace,
      elevationGain,
      elevationGainUnit,
      notes,
      userId,
      shoeId,
      name,
    } = validation.data;

    try {
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

      logger.info('Run created successfully', {
        userId,
        runId: newRun.id,
        distance,
        duration,
        requestId
      });

      return NextResponse.json(newRun, { status: 201 });
    } catch (error) {
      const dbError = handlePrismaError(error, 'create', 'run', requestId);
      throw dbError;
    }
  })
);
