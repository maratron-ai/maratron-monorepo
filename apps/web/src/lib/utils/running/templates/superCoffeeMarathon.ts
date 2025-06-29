import {
  RunningPlan,
  WeekPlan,
  RunningPlanData,
} from "@maratypes/runningPlan";
import { Pace } from "@maratypes/run";

// A default target pace value (adjust this as appropriate for your app)
const defaultPace: Pace = {
  unit: "miles",
  pace: "08:00",
};

// Build the weekly schedule from the Excel data
const schedule: WeekPlan[] = [
  // Week 1 – no runs scheduled
  {
    weekNumber: 1,
    weeklyMileage: 0,
    unit: "miles",
    runs: [],
  },
  // Week 2
  {
    weekNumber: 2,
    weeklyMileage: 30,
    unit: "miles",
    runs: [
      {
        type: "easy",
        unit: "miles",
        mileage: 5,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      { type: "easy", unit: "miles", mileage: 5, targetPace: defaultPace },
      {
        type: "tempo",
        unit: "miles",
        mileage: 3.1,
        targetPace: defaultPace,
        notes: "5k run test to get training paces & marathon projection",
      },
      {
        type: "easy",
        unit: "miles",
        mileage: 4,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      { type: "long", unit: "miles", mileage: 10, targetPace: defaultPace },
    ],
  },
  // Week 3
  {
    weekNumber: 3,
    weeklyMileage: 33,
    unit: "miles",
    runs: [
      {
        type: "easy",
        unit: "miles",
        mileage: 5,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      { type: "easy", unit: "miles", mileage: 4, targetPace: defaultPace },
      {
        type: "interval",
        unit: "miles",
        mileage: 7,
        targetPace: defaultPace,
        notes: "2 mi WU, 5 x 1 mi HMGP (400 jog), 1 mi WD",
      },
      {
        type: "easy",
        unit: "miles",
        mileage: 4,
        targetPace: defaultPace,
        notes: "Easy with strides uphill",
      },
      { type: "long", unit: "miles", mileage: 12, targetPace: defaultPace },
    ],
  },
  // Week 4
  {
    weekNumber: 4,
    weeklyMileage: 37,
    unit: "miles",
    runs: [
      {
        type: "easy",
        unit: "miles",
        mileage: 5,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      { type: "easy", unit: "miles", mileage: 5, targetPace: defaultPace },
      {
        type: "interval",
        unit: "miles",
        mileage: 9,
        targetPace: defaultPace,
        notes: '2 mi WU, 2 x 1200, 2 x 1k, 4 x 800 @ 10k pace (90") 1 mi WD',
      },
      {
        type: "easy",
        unit: "miles",
        mileage: 4,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      {
        type: "long",
        unit: "miles",
        mileage: 14,
        targetPace: defaultPace,
        notes: "in rolling hills",
      },
    ],
  },
  // Week 5
  {
    weekNumber: 5,
    weeklyMileage: 40,
    unit: "miles",
    runs: [
      {
        type: "easy",
        unit: "miles",
        mileage: 5,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      { type: "easy", unit: "miles", mileage: 5, targetPace: defaultPace },
      {
        type: "interval",
        unit: "miles",
        mileage: 10,
        targetPace: defaultPace,
        notes: "2 mi WU, 2 x 1.5 mi (800), 2 x 1 mi at HMGP (200 jog), 1 WD",
      },
      {
        type: "easy",
        unit: "miles",
        mileage: 4,
        targetPace: defaultPace,
        notes: "Easy with strides uphill",
      },
      {
        type: "long",
        unit: "miles",
        mileage: 16,
        targetPace: defaultPace,
        notes: "All Aerobic",
      },
    ],
  },
  // Week 6
  {
    weekNumber: 6,
    weeklyMileage: 34,
    unit: "miles",
    runs: [
      {
        type: "easy",
        unit: "miles",
        mileage: 5,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      { type: "easy", unit: "miles", mileage: 5, targetPace: defaultPace },
      {
        type: "interval",
        unit: "miles",
        mileage: 8,
        targetPace: defaultPace,
        notes:
          '2 mi WU, 1600, 2 x 1200, 2 x 1k, 4 x 800 @ 10k pace (90") 1 mi WD',
      },
      {
        type: "easy",
        unit: "miles",
        mileage: 4,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      {
        type: "long",
        unit: "miles",
        mileage: 12,
        targetPace: defaultPace,
        notes: "in rolling hills",
      },
    ],
  },
  // Week 7
  {
    weekNumber: 7,
    weeklyMileage: 42,
    unit: "miles",
    runs: [
      { type: "easy", unit: "miles", mileage: 5, targetPace: defaultPace },
      { type: "easy", unit: "miles", mileage: 5, targetPace: defaultPace },
      {
        type: "interval",
        unit: "miles",
        mileage: 10,
        targetPace: defaultPace,
        notes:
          "2 mi warm up, 2 mi, 2 x 1.5, 2 x 1 at MGP building to HMGP (800 jog), 1 mi WD",
      },
      {
        type: "easy",
        unit: "miles",
        mileage: 4,
        targetPace: defaultPace,
        notes: "Easy with strides uphill",
      },
      {
        type: "long",
        unit: "miles",
        mileage: 18,
        targetPace: defaultPace,
        notes: "All Aerobic",
      },
    ],
  },
  // Week 8
  {
    weekNumber: 8,
    weeklyMileage: 35,
    unit: "miles",
    runs: [
      {
        type: "easy",
        unit: "miles",
        mileage: 5,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      { type: "easy", unit: "miles", mileage: 5, targetPace: defaultPace },
      {
        type: "interval",
        unit: "miles",
        mileage: 9,
        targetPace: defaultPace,
        notes: '2 mi WU, 2k, 1600, 2 x 1200, 3 x 800 @ 10k pace (90") 1 mi WD',
      },
      {
        type: "easy",
        unit: "miles",
        mileage: 4,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      {
        type: "long",
        unit: "miles",
        mileage: 12,
        targetPace: defaultPace,
        notes: "in rolling hills",
      },
    ],
  },
  // Week 9
  {
    weekNumber: 9,
    weeklyMileage: 42,
    unit: "miles",
    runs: [
      {
        type: "easy",
        unit: "miles",
        mileage: 5,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      { type: "easy", unit: "miles", mileage: 5, targetPace: defaultPace },
      {
        type: "interval",
        unit: "miles",
        mileage: 10,
        targetPace: defaultPace,
        notes:
          "2 mi warm up, 3 mi, 2 mi, 2 x 1 mi at MGP building to HMGP (800 jog), 1 mi WD",
      },
      {
        type: "easy",
        unit: "miles",
        mileage: 4,
        targetPace: defaultPace,
        notes: "Easy with strides uphill",
      },
      {
        type: "long",
        unit: "miles",
        mileage: 18,
        targetPace: defaultPace,
        notes: "All easy or with 3 x 3 mi at MGP (1 mi easy between each)",
      },
    ],
  },
  // Week 10
  {
    weekNumber: 10,
    weeklyMileage: 35,
    unit: "miles",
    runs: [
      {
        type: "easy",
        unit: "miles",
        mileage: 6,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      { type: "easy", unit: "miles", mileage: 3, targetPace: defaultPace },
      {
        type: "interval",
        unit: "miles",
        mileage: 7,
        targetPace: defaultPace,
        notes: 'Run with 8 x 30" strides (90")',
      },
      {
        type: "easy",
        unit: "miles",
        mileage: 4,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      {
        type: "long",
        unit: "miles",
        mileage: 12,
        targetPace: defaultPace,
        notes: "in rolling hills",
      },
    ],
  },
  // Week 11
  {
    weekNumber: 11,
    weeklyMileage: 45,
    unit: "miles",
    runs: [
      {
        type: "easy",
        unit: "miles",
        mileage: 6,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      { type: "easy", unit: "miles", mileage: 5, targetPace: defaultPace },
      {
        type: "interval",
        unit: "miles",
        mileage: 10,
        targetPace: defaultPace,
        notes: "2 mi warm up, 4 x 2 mi at MGP (400 jog), 1 mi WD",
      },
      {
        type: "easy",
        unit: "miles",
        mileage: 4,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      {
        type: "long",
        unit: "miles",
        mileage: 20,
        targetPace: defaultPace,
        notes:
          "All easy or with segments at MGP (6, 4, 2 mi with 1 mi recovery)",
      },
    ],
  },
  // Week 12
  {
    weekNumber: 12,
    weeklyMileage: 35,
    unit: "miles",
    runs: [
      {
        type: "easy",
        unit: "miles",
        mileage: 6,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      { type: "easy", unit: "miles", mileage: 6, targetPace: defaultPace },
      {
        type: "interval",
        unit: "miles",
        mileage: 7,
        targetPace: defaultPace,
        notes: 'Run with 8 x 30" strides (90")',
      },
      {
        type: "easy",
        unit: "miles",
        mileage: 4,
        targetPace: defaultPace,
        notes: "Easy with strides uphill",
      },
      {
        type: "long",
        unit: "miles",
        mileage: 12,
        targetPace: defaultPace,
        notes: "in rolling hills",
      },
    ],
  },
  // Week 13 (Peak Week)
  {
    weekNumber: 13,
    weeklyMileage: 47,
    unit: "miles",
    runs: [
      {
        type: "easy",
        unit: "miles",
        mileage: 6,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      { type: "easy", unit: "miles", mileage: 5, targetPace: defaultPace },
      {
        type: "interval",
        unit: "miles",
        mileage: 10,
        targetPace: defaultPace,
        notes: "2 mi WU, 5 x 1k (200 jog), 5 x 800 (200 jog) @10k, 1 mi WD",
      },
      {
        type: "easy",
        unit: "miles",
        mileage: 4,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      {
        type: "long",
        unit: "miles",
        mileage: 22,
        targetPace: defaultPace,
        notes:
          "WU 3 mi, MS - 7 mi at MGP (1 mi easy), 6 mi at or faster than MGP",
      },
    ],
  },
  // Week 14 (Taper starts)
  {
    weekNumber: 14,
    weeklyMileage: 37,
    unit: "miles",
    runs: [
      {
        type: "easy",
        unit: "miles",
        mileage: 6,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      { type: "easy", unit: "miles", mileage: 6, targetPace: defaultPace },
      {
        type: "interval",
        unit: "miles",
        mileage: 7,
        targetPace: defaultPace,
        notes: 'Run with 8 x 30" strides (90")',
      },
      {
        type: "easy",
        unit: "miles",
        mileage: 4,
        targetPace: defaultPace,
        notes: "Easy with strides uphill",
      },
      {
        type: "long",
        unit: "miles",
        mileage: 14,
        targetPace: defaultPace,
        notes: "in rolling hills",
      },
    ],
  },
  // Week 15 (Tapering)
  {
    weekNumber: 15,
    weeklyMileage: 34,
    unit: "miles",
    runs: [
      {
        type: "easy",
        unit: "miles",
        mileage: 6,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      {
        type: "easy",
        unit: "miles",
        mileage: 5,
        targetPace: defaultPace,
        notes: "Easy run",
      },
      {
        type: "interval",
        unit: "miles",
        mileage: 9,
        targetPace: defaultPace,
        notes: "2 mi WU, 5 mi at MGP, 2 mi WD",
      },
      {
        type: "easy",
        unit: "miles",
        mileage: 4,
        targetPace: defaultPace,
        notes: "Easy with strides",
      },
      { type: "long", unit: "miles", mileage: 10, targetPace: defaultPace },
    ],
  },
  // Week 16 (Race Week – total non-marathon mileage adjusted to 22, then Marathon)
  {
    weekNumber: 16,
    // Total mileage: 22 (taper) + 26.2 (marathon) = 48.2 miles
    weeklyMileage: 48.2,
    unit: "miles",
    runs: [
      {
        type: "easy",
        unit: "miles",
        mileage: 6,
        targetPace: defaultPace,
        notes: "Easy run",
      },
      {
        type: "easy",
        unit: "miles",
        mileage: 4,
        targetPace: defaultPace,
        notes: "Easy run",
      },
      {
        type: "interval",
        unit: "miles",
        mileage: 8,
        targetPace: defaultPace,
        notes: "5 x 1 mi at MGP (200 jog) 8 mi total",
      },
      {
        type: "easy",
        unit: "miles",
        mileage: 3,
        targetPace: defaultPace,
        notes: "Easy run",
      },
      // Adjusted mileage on Saturday to reach a total of 22 non-marathon miles
      {
        type: "easy",
        unit: "miles",
        mileage: 1,
        targetPace: defaultPace,
        notes: "Easy run with drills & strides",
      },
      {
        type: "marathon",
        unit: "miles",
        mileage: 26.2,
        targetPace: defaultPace,
        notes: "Marathon",
      },
    ],
  },
];

// Create the RunningPlanData object
const runningPlanData: RunningPlanData = {
  weeks: 16,
  schedule,
};

// Wrap the planData in a RunningPlan object
const runningPlan: RunningPlan = {
  userId: "user123", // replace with actual user id
  name: "SuperCoffee Marathon Plan",
  planData: runningPlanData,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default runningPlan;
