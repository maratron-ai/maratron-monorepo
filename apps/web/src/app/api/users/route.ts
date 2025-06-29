// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { hashPassword } from "@lib/utils/passwordUtils";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Error fetching users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Request body:", body);
    const { email, password, ...userData } = body;

    // Check if email and password are provided
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    // Check if a user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }

    // Hash the password before storing
    const passwordHash = await hashPassword(password);

    // Create the new user with hashed password
    const newUser = await prisma.user.create({
      data: { 
        ...userData, 
        email,
        passwordHash,
        VDOT: userData.VDOT ?? 30 
      },
      select: {
        // Return user data without passwordHash for security
        id: true,
        name: true,
        email: true,
        age: true,
        gender: true,
        trainingLevel: true,
        VDOT: true,
        goals: true,
        avatarUrl: true,
        yearsRunning: true,
        weeklyMileage: true,
        height: true,
        weight: true,
        injuryHistory: true,
        preferredTrainingDays: true,
        preferredTrainingEnvironment: true,
        device: true,
        defaultDistanceUnit: true,
        defaultElevationUnit: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    return NextResponse.json(newUser, { status: 201 });
  } catch (error: unknown) {
    // Handle known Prisma errors (e.g., unique constraint violation)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error creating user" },
      { status: 500 }
    );
  }
}

