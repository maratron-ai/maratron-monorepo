"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@hooks/useUser";
import { TrainingLevel } from "@maratypes/user";
// import type { DayOfWeek } from "@maratypes/basics";
// import type { PlannedRun } from "@maratypes/runningPlan";
import ToggleSwitch from "@components/ToggleSwitch";
import { Spinner } from "@components/ui";
import { Input } from "@components/ui/input";
import { SelectField } from "@components/ui/FormField";
import { Button } from "@components/ui/button";
import RunningPlanDisplay from "./RunningPlanDisplay";
import {
  generate5kPlan,
  generate10kPlan,
  generateHalfMarathonPlan,
  generateClassicMarathonPlan,
} from "@utils/running/plans/distancePlans";
import { RunningPlanData } from "@maratypes/runningPlan";
import { listRunningPlans } from "@lib/api/plan";
import { assignDatesToPlan } from "@utils/running/planDates";
import {
  defaultPlanName,
  getDistanceLabel,
  RaceType,
} from "@utils/running/planName";


const DISTANCE_INFO: Record<RaceType, { miles: number; km: number; weeks: number }> = {
  "5k": { miles: 3.1, km: 5, weeks: 8 },
  "10k": { miles: 6.2, km: 10, weeks: 10 },
  half: { miles: 13.1, km: 21.1, weeks: 12 },
  full: { miles: 26.2, km: 42.2, weeks: 16 },
};

const DEFAULT_RACE: RaceType = "full";

const PlanGenerator: React.FC = () => {
  const { profile: user, loading } = useUser();

  // Set initial state to user's info (if available), fallback to defaults
const [raceType, setRaceType] = useState<RaceType>(DEFAULT_RACE);
const [distanceUnit, setDistanceUnit] = useState<"miles" | "kilometers">(
  "miles"
);
const [weeks, setWeeks] = useState<number>(DISTANCE_INFO[DEFAULT_RACE].weeks);
const [targetDistance, setTargetDistance] = useState<number>(
  DISTANCE_INFO[DEFAULT_RACE].miles
);
  const [vdot, setVdot] = useState<number>(30);
  const [useTotalTime, setUseTotalTime] = useState<boolean>(false);
  const [targetPace, setTargetPace] = useState<string>("10:00");
  const [targetTotalTime, setTargetTotalTime] = useState<string>("3:45:00");
  const [planData, setPlanData] = useState<RunningPlanData | null>(null);
  const [showJson, setShowJson] = useState<boolean>(false);
  const [planName, setPlanName] = useState<string>(
    defaultPlanName(DEFAULT_RACE, 1)
  );
  const [endDate, setEndDate] = useState<string>("");

  const [trainingLevel, setTrainingLevel] = useState<TrainingLevel>(
    TrainingLevel.Beginner
  );
  const [runsPerWeek, setRunsPerWeek] = useState<number>(4);
  const [crossTrainingDays, setCrossTrainingDays] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  // const [runTypeDays, setRunTypeDays] = useState<
  //   Partial<Record<PlannedRun["type"], DayOfWeek>>
  // >({});
  // const days: DayOfWeek[] = [
  //   "Sunday",
  //   "Monday",
  //   "Tuesday",
  //   "Wednesday",
  //   "Thursday",
  //   "Friday",
  //   "Saturday",
  // ];
  // const runTypes: PlannedRun["type"][] = [ // doesn't include race
  //   "easy",
  //   "tempo",
  //   "interval",
  //   "long",
  // ];

  // const handleRunDayChange = (
  //   type: PlannedRun["type"],
  //   day: DayOfWeek | ""
  // ) => {
  //   setRunTypeDays((prev) => ({
  //     ...prev,
  //     ...(day ? { [type]: day } : { [type]: undefined }),
  //   }));
  // };
  useEffect(() => {
    if (crossTrainingDays > 7 - runsPerWeek) {
      setCrossTrainingDays(7 - runsPerWeek);
    }
  }, [runsPerWeek, crossTrainingDays]);

  useEffect(() => {
    const fetchName = async () => {
      if (!user?.id) return;
      try {
        const all = await listRunningPlans();
        const userPlans = all.filter((p: { userId: string; name?: string }) => p.userId === user.id);
        const label = getDistanceLabel(raceType);
        const count = userPlans.filter((p: { name: string; }) => p.name?.startsWith(label)).length; // not sure if p's type is right
        setPlanName(defaultPlanName(raceType, count + 1));
      } catch (err) {
        console.error(err);
      }
    };
    fetchName();
  }, [user?.id, raceType]);
  // const [defaultShoeId, setDefaultShoeId] = useState<string | undefined>(
  //   undefined
  // );

  // On load/fetch, update state defaults from user profile
  useEffect(() => {
    if (user) {
      if (user.trainingLevel) setTrainingLevel(user.trainingLevel);
      setVdot(user.VDOT ?? 30);
      if (user.defaultDistanceUnit) setDistanceUnit(user.defaultDistanceUnit);
      // if (user.defaultShoeId) setDefaultShoeId(user.defaultShoeId);
      // Optionally, set other user-specific defaults
    } else {
      setVdot(30);
    }
  }, [user]);

  useEffect(() => {
    const info = DISTANCE_INFO[raceType];
    setWeeks(info.weeks);
    setTargetDistance(
      distanceUnit === "kilometers" ? info.km : info.miles
    );
  }, [raceType, distanceUnit]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const opts = {
      weeks,
      distanceUnit,
      trainingLevel,
      vdot,
      targetPace: useTotalTime ? undefined : targetPace,
      targetTotalTime: useTotalTime ? targetTotalTime : undefined,
      runsPerWeek,
      crossTrainingDays,
      // runTypeDays,
    };
    let plan: RunningPlanData;
    switch (raceType) {
      case "5k":
        plan = generate5kPlan(opts);
        break;
      case "10k":
        plan = generate10kPlan(opts);
        break;
      case "half":
        plan = generateHalfMarathonPlan(opts);
        break;
      default:
        plan = generateClassicMarathonPlan(opts);
        break;
    }
    // Assign default start and end dates if not provided
    const today = new Date();
    const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const diff = (7 - base.getUTCDay()) % 7;
    base.setUTCDate(base.getUTCDate() + (diff === 0 ? 7 : diff));
    const assumedStartDate = base.toISOString().slice(0, 10);
    let assumedEndDate = endDate;

    if (!endDate) {
      const projectedEndDate = new Date(today);
      projectedEndDate.setDate(today.getDate() + weeks * 7);

      // Adjust to nearest following Sunday
      const dayOfWeek = projectedEndDate.getDay(); // 0 is Sunday
      const daysToAdd = (7 - dayOfWeek) % 7;
      projectedEndDate.setDate(projectedEndDate.getDate() + daysToAdd);

      assumedEndDate = projectedEndDate.toISOString().slice(0, 10);
    }

    const withDates = assignDatesToPlan(plan, {
      startDate: assumedStartDate,
      endDate: assumedEndDate,
    });
    setPlanData(withDates);
    setEndDate(withDates.endDate?.slice(0, 10) ?? "");
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 p-4 space-y-4">
      <h1 className="text-2xl font-bold text-center mb-4">
        Generate Your Running Plan
      </h1>
      {loading ? (
        <div className="flex justify-center py-4">
          <Spinner className="h-5 w-5" />
        </div>
      ) : (
        <form onSubmit={handleGenerate} className="space-y-4">
          {/* Weeks */}
          <Input
            label="Weeks"
            name="weeks"
            type="number"
            min={8}
            value={String(weeks)}
            onChange={(_n, v) => setWeeks(Number(v))}
            className="mt-1"
          />
          {/* Race Date */}
          <Input
            label="Race Date"
            name="raceDate"
            type="date"
            value={endDate}
            onChange={(_n, v) => setEndDate(v)}
            className="mt-1"
          />
          {/* Race Selection */}
          <SelectField
            label="Race Distance"
            name="raceType"
            options={[
              { value: "5k", label: "5K" },
              { value: "10k", label: "10K" },
              { value: "half", label: "Half Marathon" },
              { value: "full", label: "Marathon" },
            ]}
            value={raceType}
            onChange={(_n, v) => setRaceType(v as RaceType)}
            className="mt-1"
          />
          <span className="text-sm mt-1">
            Target Distance: {targetDistance} {distanceUnit}
          </span>
          {/* Training Level */}
          <SelectField
            label="Training Level"
            name="trainingLevel"
            options={[
              { value: TrainingLevel.Beginner, label: "Beginner" },
              { value: TrainingLevel.Intermediate, label: "Intermediate" },
              { value: TrainingLevel.Advanced, label: "Advanced" },
            ]}
            value={trainingLevel}
            onChange={(_n, v) => setTrainingLevel(v as TrainingLevel)}
            className="mt-1"
          />

          {/* Goal Input Mode */}
          <ToggleSwitch
            checked={useTotalTime}
            onChange={(c) => setUseTotalTime(c)}
            leftLabel="Pace"
            rightLabel="Total Time"
          />
          {/* Target Pace or Total Time */}
          {useTotalTime ? (
            <Input
              label="Target Total Time (hh:mm:ss or mm:ss)"
              name="targetTotalTime"
              type="text"
              value={targetTotalTime}
              onChange={(_n, v) => setTargetTotalTime(v)}
              className="mt-1"
            />
          ) : (
            <Input
              label="Target Pace (mm:ss)"
              name="targetPace"
              type="text"
              value={targetPace}
              onChange={(_n, v) => setTargetPace(v)}
              className="mt-1"
            />
          )}
          <div className="flex items-center w-full space-x-2">
            <Button
              type="button"
              onClick={() => setShowAdvanced((p) => !p)}
              className="w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
            >
              {showAdvanced ? "Hide Advanced" : "Show Advanced"}
            </Button>
          </div>
          {showAdvanced && (
            <div className="space-y-4">
              {/* Runs Per Week */}
              <Input
                label="Runs Per Week"
                name="runsPerWeek"
                type="number"
                min={1}
                max={7}
                value={String(runsPerWeek)}
                onChange={(_n, v) => setRunsPerWeek(Number(v))}
                className="mt-1"
              />
              {/* Cross Training Days */}
              <Input
                label="Cross Training Days"
                name="crossTrainingDays"
                type="number"
                min={0}
                max={7 - runsPerWeek}
                value={String(crossTrainingDays)}
                onChange={(_n, v) => setCrossTrainingDays(Number(v))}
                className="mt-1"
              />
              {/* VDOT */}
              <Input
                label="VDOT"
                name="vdot"
                type="number"
                min={20}
                max={60}
                value={String(vdot)}
                onChange={(_n, v) => setVdot(Number(v))}
                className="mt-1"
              />
              {/* Run Type Days
              <div className="grid grid-cols-2 gap-4">
                {runTypes.map((type) => (
                  <SelectField
                    key={type}
                    label={`${type.charAt(0).toUpperCase() + type.slice(1)} Day`}
                    name={`runType-${type}`}
                    options={[
                      { value: "", label: "None" },
                      ...days.map((day) => ({ value: day, label: day })),
                    ]}
                    value={runTypeDays[type] || ""}
                    onChange={(_n, v) => handleRunDayChange(type, v as DayOfWeek)}
                  />
                ))}
              </div> */}
            </div>
          )}
          <div className="flex-1 flex justify-center">
            <Button
              type="submit"
              className="w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
            >
              Generate Plan
            </Button>
          </div>
        </form>
      )}
      {planData && (
        <div className="mt-6">
          <RunningPlanDisplay
            planData={planData}
            planName={planName}
            showPlanMeta
            showBulkDaySetter
            onPlanNameChange={setPlanName}
            onPlanChange={setPlanData}
          />
          <div className="mt-4">
            <label className="flex items-center space-x-2">
              <label htmlFor="showJson" className="flex items-center space-x-2">
                {/* Keep this as input not Input */}
                <input
                  id="showJson"
                  name="showJson"
                  type="checkbox"
                  checked={showJson}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setShowJson(e.target.checked)
                  }
                  className="form-checkbox"
                />
                <span>Show JSON</span>
              </label>
              {showJson && (
                <Button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(planData, null, 2)
                    );
                    alert("JSON copied to clipboard!");
                  }}
                  className="ml-2 text-primary underline block w-auto bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from"
                >
                  Copy JSON
                </Button>
              )}
            </label>
            {showJson && (
              <pre className="bg-background p-4 rounded overflow-x-auto mt-2 text-foreground">
                {JSON.stringify(planData, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanGenerator;
