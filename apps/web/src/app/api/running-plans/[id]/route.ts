import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import type { RunningPlanData } from "@maratypes/runningPlan";

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

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const { params } = context
    const { id } = params
    const plan = await prisma.runningPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    return NextResponse.json(plan, { status: 200 });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error fetching plan" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { params } = context;
    const { id } = params;

    const existing = await prisma.runningPlan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const existingPlanData = existing.planData as unknown as RunningPlanData;
    const newWeeks =
      body.weeks ?? body.planData?.weeks ?? existing.weeks ?? existingPlanData.weeks;

    let start = body.startDate ? parseDateUTC(body.startDate) : existing.startDate ?? undefined;
    let end = body.endDate ? parseDateUTC(body.endDate) : existing.endDate ?? undefined;

    if (body.startDate && !body.endDate) {
      end = addWeeks(start!, Number(newWeeks) - 1);
    } else if (body.endDate && !body.startDate) {
      start = addWeeks(end!, -(Number(newWeeks) - 1));
    } else if (body.active && !existing.startDate && !body.startDate) {
      start = parseDateUTC(new Date());
      if (!end) {
        end = addWeeks(start, Number(newWeeks) - 1);
      }
    }

    const updated = await prisma.runningPlan.update({
      where: { id },
      data: { ...body, startDate: start, endDate: end },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error updating plan" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    const { params } = context
    const { id } = params
    await prisma.runningPlan.delete({ where: { id } });
    return NextResponse.json({ message: "Plan deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error deleting plan" },
      { status: 500 }
    );
  }
}
