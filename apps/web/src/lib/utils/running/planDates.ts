export type { DayOfWeek } from "@maratypes/basics";
import { DayOfWeek } from "@maratypes/basics";
import type { RunningPlanData } from "@maratypes/runningPlan";

function parseDateUTC(date: string | Date): Date {
  if (date instanceof Date) return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // treat plain dates as UTC to avoid timezone offsets
  return new Date(date.includes("T") ? date : `${date}T00:00:00Z`);
}

function startOfDayUTC(date: Date): Date {
  const d = parseDateUTC(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = parseDateUTC(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

function startOfWeekSunday(date: Date): Date {
  const d = startOfDayUTC(date);
  const diff = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

function nextSunday(from: Date = new Date()): Date {
  const base = startOfDayUTC(from);
  const diff = (7 - base.getUTCDay()) % 7;
  base.setUTCDate(base.getUTCDate() + (diff === 0 ? 7 : diff));
  return base;
}

function getNextSundayAfter(date: Date): Date {
  const dayOfWeek = date.getUTCDay(); // 0 = Sunday
  const daysToAdd = dayOfWeek === 0 ? 7 : (7 - dayOfWeek); // Always get next Sunday
  const sunday = new Date(date);
  sunday.setUTCDate(date.getUTCDate() + daysToAdd);
  return sunday;
}

const dayIndexMap: Record<DayOfWeek, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export function dayIndex(day: DayOfWeek): number {
  return dayIndexMap[day];
}

export function assignDatesToPlan(
  plan: RunningPlanData,
  opts: { startDate?: string; endDate?: string; smartStartNow?: boolean }
): RunningPlanData {
  const { startDate, endDate, smartStartNow } = opts;

  const weeks = plan.schedule.length || plan.weeks;
  let baseStart: Date;
  let finalEnd: Date;

  if (startDate) {
    baseStart = startOfDayUTC(parseDateUTC(startDate));
    finalEnd = endDate ? startOfDayUTC(parseDateUTC(endDate)) : addWeeks(baseStart, weeks);
  } else if (endDate) {
    finalEnd = startOfDayUTC(parseDateUTC(endDate));
    baseStart = addWeeks(finalEnd, -weeks);
  } else {
    baseStart = nextSunday();
    finalEnd = addWeeks(baseStart, weeks);
  }

  const today = startOfDayUTC(new Date());
  if (baseStart < today) {
    baseStart = today;
    finalEnd = addWeeks(baseStart, weeks);
  }

  // When we have an end date (race date), prioritize proper race date alignment by working backwards
  // This ensures the race falls on the correct day within a normal training week and all
  // weeks are continuous. The start date may be adjusted to achieve this alignment.
  let adjustedBaseStart = baseStart;
  if (endDate && !startDate) {
    // Only adjust start date for race alignment if no specific start date was provided
    const raceWeekStart = startOfWeekSunday(parseDateUTC(endDate));
    adjustedBaseStart = addWeeks(raceWeekStart, -(weeks - 1));
  }

  const schedule = plan.schedule.map((week, wi) => {
    let weekStart: Date;
    
    if (smartStartNow) {
      // Smart Start Now mode: Special handling
      if (wi === 0) {
        // First week: starts exactly on the adjusted base start (could be mid-week)
        weekStart = adjustedBaseStart;
      } else {
        // Subsequent weeks: start on Sundays after the first week
        const firstWeekNextSunday = getNextSundayAfter(adjustedBaseStart);
        const startDayOfWeek = adjustedBaseStart.getUTCDay();
        
        if (startDayOfWeek >= 4 && startDayOfWeek <= 6) { // Thursday-Saturday
          // Skip one week to allow first week to "absorb" fragments
          weekStart = addWeeks(firstWeekNextSunday, wi); // wi instead of wi-1
        } else {
          // Normal progression for Sun-Wed starts
          weekStart = addWeeks(firstWeekNextSunday, wi - 1);
        }
      }
    } else {
      // Normal mode: original logic
      weekStart = wi === 0 ? adjustedBaseStart : startOfWeekSunday(addWeeks(adjustedBaseStart, wi));
    }
    
    const runs = week.runs.map((r) => {
      let date: Date;
      if (
        endDate &&
        wi === weeks - 1 &&
        (r.type === "race" || r.type === "marathon")
      ) {
        date = startOfDayUTC(parseDateUTC(endDate));
      } else {
        const idx = r.day ? dayIndex(r.day) : 0;
        
        if (smartStartNow && wi === 0) {
          // Smart Start Now: First week handles irregular start
          const dayOfWeekStart = adjustedBaseStart.getUTCDay();
          const targetDayIndex = idx;
          
          // If target day is today or later this week
          if (targetDayIndex >= dayOfWeekStart) {
            const daysFromStart = targetDayIndex - dayOfWeekStart;
            date = addDays(adjustedBaseStart, daysFromStart);
          } else {
            // Target day is next week (first full week)
            const nextWeekStart = getNextSundayAfter(adjustedBaseStart);
            date = addDays(nextWeekStart, targetDayIndex);
          }
        } else if (!smartStartNow && wi === 0) {
          // Normal mode: First week with potential mid-week start
          const startDow = adjustedBaseStart.getUTCDay();
          const diff = idx - startDow;
          date = addDays(adjustedBaseStart, diff >= 0 ? diff : 7 + diff);
        } else {
          // All other cases: standard day calculation
          date = addDays(weekStart, idx);
        }
      }
      return { ...r, date: date.toISOString() };
    });
    
    const done = runs.every((r) => r.done);
    return { ...week, startDate: weekStart.toISOString(), runs, done };
  });

  return {
    ...plan,
    weeks,
    schedule,
    startDate: adjustedBaseStart.toISOString(),
    endDate: finalEnd.toISOString(),
  };
}

export function removeDatesFromPlan(plan: RunningPlanData): RunningPlanData {
  const schedule = plan.schedule.map((week) => ({
    ...week,
    startDate: undefined,
    runs: week.runs.map((r) => ({ ...r, date: undefined })),
  }));
  return {
    ...plan,
    schedule,
    startDate: undefined,
    endDate: undefined,
  };
}
