// app/api/shoes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@lib/prisma";
import { shoeSchema } from "@lib/schemas/shoeSchema";
import { authOptions } from "@lib/auth";

// GET /api/shoes/[id] — Get a specific shoe
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
    const shoe = await prisma.shoe.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!shoe) {
      return NextResponse.json({ error: "Shoe not found" }, { status: 404 });
    }
    return NextResponse.json(shoe, { status: 200 });
  } catch (error) {
    console.error("Error fetching shoe:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error fetching shoe" },
      { status: 500 }
    );
  }
}

// PUT /api/shoes/[id] — Update a shoe
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
    await shoeSchema.validate(body, { abortEarly: false, stripUnknown: true });

    const params = await context.params
    const { id } = params
    
    // Verify the shoe belongs to the authenticated user
    const existingShoe = await prisma.shoe.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existingShoe) {
      return NextResponse.json({ error: "Shoe not found" }, { status: 404 });
    }

    const updatedShoe = await prisma.shoe.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(updatedShoe, { status: 200 });
  } catch (error) {
    console.error("Error updating shoe:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error updating shoe" },
      { status: 500 }
    );
  }
}

// DELETE /api/shoes/[id] — Delete a shoe
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
    
    // Verify the shoe belongs to the authenticated user
    const existingShoe = await prisma.shoe.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existingShoe) {
      return NextResponse.json({ error: "Shoe not found" }, { status: 404 });
    }

    await prisma.shoe.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Shoe deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting shoe:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error deleting shoe" },
      { status: 500 }
    );
  }
}
