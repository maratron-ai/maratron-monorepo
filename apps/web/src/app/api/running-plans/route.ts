import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { defaultPlanName, getDistanceLabel, RaceType } from "@utils/running/planName";

function parseDateUTC(date: string | Date): Date {
  if (date instanceof Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }
  return new Date(date.includes("T") ? date : `${date}T00:00:00Z`);
}

function addDays(date: Date, days: number): Date {
  const d = parseDateUTC(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}


export async function GET() {
  try {
    const plans = await prisma.runningPlan.findMany();
    return NextResponse.json(plans, { status: 200 });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error fetching plans" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, weeks, planData, name, startDate, endDate, active } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const derivedWeeks =
      weeks ?? planData?.weeks ?? planData?.schedule?.length ?? null;

    if (derivedWeeks === null || Number.isNaN(Number(derivedWeeks))) {
      return NextResponse.json({ error: "Weeks is required" }, { status: 400 });
    }

    const count = await prisma.runningPlan.count({ where: { userId } });
    let defaultName = `Training Plan ${count + 1}`;
    if (!name && body.raceType) {
      const race = body.raceType as RaceType;
      const label = getDistanceLabel(race);
      const raceCount = await prisma.runningPlan.count({
        where: { userId, name: { startsWith: label } },
      });
      defaultName = defaultPlanName(race, raceCount + 1);
    }
    const isFirstPlan = count === 0;

    let start = startDate ? parseDateUTC(startDate) : undefined;
    let end = endDate ? parseDateUTC(endDate) : undefined;

    if (start && !end) {
      end = addWeeks(start, Number(derivedWeeks) - 1);
    } else if (end && !start) {
      start = addWeeks(end, -(Number(derivedWeeks) - 1));
    } else if ((active || isFirstPlan) && !start) {
      start = parseDateUTC(new Date());
      end = addWeeks(start, Number(derivedWeeks) - 1);
    }

    const newPlan = await prisma.runningPlan.create({
      data: {
        user: { connect: { id: userId } },
        weeks: Number(derivedWeeks),
        planData,
        name: name || defaultName,
        startDate: start,
        endDate: end,
        active: isFirstPlan ? true : active ?? false,
      },
    });

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error("Error creating running plan:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error creating plan" },
      { status: 500 }
    );
  }
}
