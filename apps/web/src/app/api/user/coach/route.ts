import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@lib/prisma';
import { authOptions } from '@lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { selectedCoach: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user coach:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user coach' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Missing coachId in request body' },
        { status: 400 }
      );
    }

    const { coachId } = body;

    if (coachId === undefined) {
      return NextResponse.json(
        { error: 'Missing coachId in request body' },
        { status: 400 }
      );
    }

    // If coachId is not null, verify the coach exists
    if (coachId !== null) {
      const coach = await prisma.coachPersona.findUnique({
        where: { id: coachId },
      });

      if (!coach) {
        return NextResponse.json(
          { error: 'Invalid coach ID' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { selectedCoachId: coachId },
      include: { selectedCoach: true },
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('Error updating user coach:', error);
    return NextResponse.json(
      { error: 'Failed to update user coach selection' },
      { status: 500 }
    );
  }
}