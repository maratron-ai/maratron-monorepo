import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';

export async function GET() {
  try {
    const coaches = await prisma.coachPersona.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ coaches }, { status: 200 });
  } catch (error) {
    console.error('Error fetching coaches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coaches' },
      { status: 500 }
    );
  }
}