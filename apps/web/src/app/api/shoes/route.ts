// src/app/api/shoes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { shoeSchema } from "@lib/schemas/shoeSchema";

export async function GET() {
  try {
    const shoes = await prisma.shoe.findMany();
    return NextResponse.json(shoes, { status: 200 });
  } catch (error) {
    console.error("Error fetching shoes:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error fetching shoes",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await shoeSchema.validate(body, { abortEarly: false, stripUnknown: true });

    const {
      userId, // Always required; should come from auth/session in prod
      name,
      notes,
      currentDistance,
      distanceUnit,
      maxDistance,
      retired,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const newShoe = await prisma.shoe.create({
      data: {
        user: { connect: { id: userId } },
        name,
        notes: notes || null,
        currentDistance: currentDistance ? Number(currentDistance) : 0,
        distanceUnit,
        maxDistance: Number(maxDistance),
        retired: !!retired,
      },
    });

    return NextResponse.json(newShoe, { status: 201 });
  } catch (error) {
    console.error("Error creating shoe:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error creating shoe",
      },
      { status: 500 }
    );
  }
}
