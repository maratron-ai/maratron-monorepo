// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const { id } = params
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error fetching user" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const { id } = params;
  try {
    const body = await request.json();
    const updatedUser = await prisma.user.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error updating user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const { id } = params;
  try {
    await prisma.user.delete({
      where: { id },
    });
    return NextResponse.json({ message: "User deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error deleting user" },
      { status: 500 }
    );
  }
}
