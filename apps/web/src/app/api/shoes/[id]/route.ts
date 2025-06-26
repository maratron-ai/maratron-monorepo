// app/api/shoes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { shoeSchema } from "@lib/schemas/shoeSchema";

// GET /api/shoes/[id] — Get a specific shoe
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { params } = context
    const { id } = params
    const shoe = await prisma.shoe.findUnique({
      where: { id },
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
  context: { params: { id: string } }
) {
  try {
    const body = await request.json();
    await shoeSchema.validate(body, { abortEarly: false, stripUnknown: true });

    const { params } = context
    const { id } = params
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
  context: { params: { id: string } }
) {
  try {
    const { params } = context
    const { id } = params
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
