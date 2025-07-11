"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@hooks/useUser";
import { TrainingLevel } from "@maratypes/user";
// import type { DayOfWeek } from "@maratypes/basics";
// import type { PlannedRun } from "@maratypes/runningPlan";
import { Spinner } from "@components/ui";
import { Input } from "@components/ui/input";
import { SelectField } from "@components/ui/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui";
import { Button } from "@components/ui/button";
import { Switch } from "@components/ui/switch";
import { Label } from "@components/ui/label";
import { TimePicker } from "@components/ui/time-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { DatePicker } from "@components/ui/date-picker";
import InfoTooltip from "@components/ui/info-tooltip";
import RunningPlanDisplay from "./RunningPlanDisplay";
import {
  generate5kPlan,
  generate10kPlan,
  generateHalfMarathonPlan,
  generateClassicMarathonPlan,
} from "@utils/running/plans/distancePlans";
import { calculatePaceForVDOT } from "@utils/running/jackDaniels";
import { validateGoalPace } from "@utils/running/validation";
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
  const [targetPace, setTargetPace] = useState<string>("8:00");
  const [targetTotalTime, setTargetTotalTime] = useState<string>("3:45:00");
  const [planData, setPlanData] = useState<RunningPlanData | null>(null);
  const [showJson, setShowJson] = useState<boolean>(false);
  const [planName, setPlanName] = useState<string>(
    defaultPlanName(DEFAULT_RACE, 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [goalValidation, setGoalValidation] = useState<{
    isValid: boolean;
    projectedVDOT: number;
    message?: string;
  } | null>(null);

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

  // Calculate realistic default target pace based on VDOT and race distance
  useEffect(() => {
    if (vdot && targetDistance) {
      const toMeters = distanceUnit === "miles" ? 1609.34 : 1000;
      const raceMeters = targetDistance * toMeters;
      const calculatedMarathonPace = calculatePaceForVDOT(raceMeters, vdot, "M");
      setTargetPace(calculatedMarathonPace);
    }
  }, [vdot, targetDistance, distanceUnit]);

  // Validate goal pace/time and provide progression feedback
  useEffect(() => {
    if (vdot && targetDistance && weeks) {
      const goalValue = useTotalTime ? targetTotalTime : targetPace;
      if (!goalValue) {
        setGoalValidation(null);
        return;
      }
      
      try {
        const toMeters = distanceUnit === "miles" ? 1609.34 : 1000;
        const raceMeters = targetDistance * toMeters;
        const calculatedMarathonPace = calculatePaceForVDOT(raceMeters, vdot, "M");
        
        let actualPace = goalValue;
        
        // If using total time, convert to pace
        if (useTotalTime) {
          // Parse total time (h:mm:ss) and convert to pace per mile/km
          const timeParts = goalValue.split(':');
          let totalSeconds = 0;
          
          if (timeParts.length === 3) {
            // h:mm:ss format
            totalSeconds = parseInt(timeParts[0]) * 3600 + parseInt(timeParts[1]) * 60 + parseInt(timeParts[2]);
          } else if (timeParts.length === 2) {
            // mm:ss format  
            totalSeconds = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
          }
          
          if (totalSeconds > 0) {
            // Calculate pace per unit (mile or km)
            const paceSeconds = totalSeconds / targetDistance;
            const paceMinutes = Math.floor(paceSeconds / 60);
            const remainingSeconds = Math.round(paceSeconds % 60);
            actualPace = `${paceMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
          }
        }
        
        const validation = validateGoalPace(actualPace, calculatedMarathonPace, vdot, weeks);
        
        // Customize message based on mode
        if (useTotalTime) {
          const modeText = 'finish time';
          validation.message = validation.message.replace('Goal pace', `Goal pace`);
        }
        
        setGoalValidation(validation);
      } catch (error) {
        // Handle validation errors gracefully
        if (error instanceof Error) {
          const formatHint = useTotalTime ? 'h:mm:ss format (e.g., "3:45:00")' : 'mm:ss format (e.g., "8:30")';
          setGoalValidation({
            isValid: false,
            projectedVDOT: vdot,
            message: `Invalid ${useTotalTime ? 'time' : 'pace'} format: ${error.message.includes('format') ? `Please use ${formatHint}` : error.message}`
          });
        } else {
          const formatHint = useTotalTime ? 'h:mm:ss like "3:45:00"' : 'mm:ss like "8:30"';
          setGoalValidation({
            isValid: false,
            projectedVDOT: vdot,
            message: `Please check your ${useTotalTime ? 'time' : 'pace'} format (use ${formatHint})`
          });
        }
      }
    } else {
      setGoalValidation(null);
    }
  }, [vdot, targetDistance, targetPace, targetTotalTime, weeks, distanceUnit, useTotalTime]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs before generating plan
    if (!useTotalTime && goalValidation && !goalValidation.isValid) {
      alert(`Cannot generate plan: ${goalValidation.message}`);
      return;
    }
    
    try {
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
      let assumedEndDate: string;

      if (!endDate) {
        const projectedEndDate = new Date(today);
        projectedEndDate.setDate(today.getDate() + weeks * 7);

        // Adjust to nearest following Sunday
        const dayOfWeek = projectedEndDate.getDay(); // 0 is Sunday
        const daysToAdd = (7 - dayOfWeek) % 7;
        projectedEndDate.setDate(projectedEndDate.getDate() + daysToAdd);

        assumedEndDate = projectedEndDate.toISOString().slice(0, 10);
      } else {
        assumedEndDate = endDate.toISOString().slice(0, 10);
      }

      const withDates = assignDatesToPlan(plan, {
        startDate: assumedStartDate,
        endDate: assumedEndDate,
      });
      setPlanData(withDates);
      if (withDates.endDate) {
        setEndDate(new Date(withDates.endDate));
      }
    } catch (error) {
      // Handle plan generation errors gracefully
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while generating the plan';
      
      alert(`Error generating training plan: ${errorMessage}`);
      console.error('Plan generation error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl font-light text-zinc-900 dark:text-zinc-100 mb-2">
          Generate Your Running Plan
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Create a personalized training plan based on your goals and fitness level.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner className="h-6 w-6 text-zinc-400" />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-6">
              <form onSubmit={handleGenerate} className="space-y-6">
                {/* Basic Configuration Section */}
                <div>
                  <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-5 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Basic Configuration
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 items-start">
                    {/* Row 1: Race Distance */}
                    <div className="md:col-start-1">
                      <div className="space-y-2">
                        <Label htmlFor="race-distance" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          Race Distance
                        </Label>
                        <Select value={raceType} onValueChange={(value) => setRaceType(value as RaceType)}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select race distance" />
                          </SelectTrigger>
                          <SelectContent 
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg"
                            position="popper"
                            side="bottom"
                            align="start"
                          >
                            <SelectItem value="5k">5K</SelectItem>
                            <SelectItem value="10k">10K</SelectItem>
                            <SelectItem value="half">Half Marathon</SelectItem>
                            <SelectItem value="full">Marathon</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Row 1: Training Weeks */}
                    <div className="md:col-start-2">
                      <div className="space-y-2">
                        <Label htmlFor="training-weeks" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          Training Weeks
                        </Label>
                        <Input
                          id="training-weeks"
                          name="weeks"
                          type="number"
                          min={8}
                          value={String(weeks)}
                          onChange={(e) => setWeeks(Number(e.target.value))}
                          className="h-10"
                        />
                      </div>
                    </div>
                    
                    {/* Row 2: Training Level */}
                    <div className="md:col-start-1">
                      <div className="space-y-2">
                        <Label htmlFor="training-level" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          Training Level
                        </Label>
                        <Select value={trainingLevel} onValueChange={(value) => setTrainingLevel(value as TrainingLevel)}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select training level" />
                          </SelectTrigger>
                          <SelectContent 
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg"
                            position="popper"
                            side="bottom"
                            align="start"
                          >
                            <SelectItem value={TrainingLevel.Beginner}>Beginner</SelectItem>
                            <SelectItem value={TrainingLevel.Intermediate}>Intermediate</SelectItem>
                            <SelectItem value={TrainingLevel.Advanced}>Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Row 2: Race Date */}
                    <div className="md:col-start-2">
                      <DatePicker
                        value={endDate}
                        onChange={setEndDate}
                        label="Race Date"
                        placeholder="Select date"
                        id="race-date"
                      />
                    </div>
                  </div>
                </div>

                {/* Goal Configuration Section */}
                <div>
                  <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-5 flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    Goal Configuration
                  </h2>
                  
                  {/* Goal Input Row - Toggle and Time Picker on Same Line */}
                  <div className="flex items-end gap-4 mb-4">
                    {/* Toggle on Left */}
                    <div className="flex items-center space-x-2 px-1 py-1 bg-zinc-100/60 dark:bg-zinc-800/60 rounded-lg border border-zinc-200/40 dark:border-zinc-700/40">
                      <button
                        type="button"
                        onClick={() => setUseTotalTime(false)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                          !useTotalTime 
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700' 
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        Pace
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseTotalTime(true)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                          useTotalTime 
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700' 
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        Total Time
                      </button>
                    </div>
                    
                    {/* Time Picker on Right */}
                    <div className="flex-1 max-w-xs">
                      {useTotalTime ? (
                        <TimePicker
                          id="target-total-time"
                          value={targetTotalTime}
                          onChange={(value) => setTargetTotalTime(value)}
                          placeholder="h:mm:ss"
                          alwaysShowHours
                          className="[&>div:last-child]:hidden [&>div:nth-child(2)>div:last-child]:text-xs [&>div:nth-child(2)>div:last-child]:text-zinc-400"
                        />
                      ) : (
                        <TimePicker
                          id="target-pace"
                          value={targetPace}
                          onChange={(value) => setTargetPace(value)}
                          placeholder="mm:ss"
                          className="[&>div:last-child]:hidden [&>div:nth-child(2)>div:last-child]:text-xs [&>div:nth-child(2)>div:last-child]:text-zinc-400"
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Validation Feedback - Works for Both Modes */}
                  {goalValidation && (
                    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-xs ${
                      goalValidation.isValid 
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/40 dark:border-emerald-800/40' 
                        : 'bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200/40 dark:border-amber-800/40'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${goalValidation.isValid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">
                          {goalValidation.isValid ? 'Progressive' : 'Ambitious'} • 
                        </span>
                        <span className="opacity-90">{goalValidation.message}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
                {/* Advanced Settings Section */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      Advanced Settings
                    </h2>
                    
                    {/* Compact Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowAdvanced((p) => !p)}
                      className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors flex items-center space-x-1"
                    >
                      <span>{showAdvanced ? "Hide" : "Show"}</span>
                      <svg 
                        className={`w-3 h-3 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {showAdvanced && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 items-start pt-2">
                      {/* Runs Per Week */}
                      <div className="space-y-2">
                        <Label htmlFor="runs-per-week" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          Runs Per Week
                        </Label>
                        <Input
                          id="runs-per-week"
                          name="runsPerWeek"
                          type="number"
                          min={1}
                          max={7}
                          value={String(runsPerWeek)}
                          onChange={(_n, v) => setRunsPerWeek(Number(v))}
                          className="h-10"
                        />
                      </div>
                      
                      {/* Cross Training Days */}
                      <div className="space-y-2">
                        <Label htmlFor="cross-training" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          Cross Training Days
                        </Label>
                        <Input
                          id="cross-training"
                          name="crossTrainingDays"
                          type="number"
                          min={0}
                          max={7 - runsPerWeek}
                          value={String(crossTrainingDays)}
                          onChange={(_n, v) => setCrossTrainingDays(Number(v))}
                          className="h-10"
                        />
                      </div>
                      
                      {/* VDOT */}
                      <div className="space-y-2">
                        <div className="relative">
                          <Label htmlFor="vdot" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            VDOT
                          </Label>
                          <div className="absolute top-0 left-[2.75rem]">
                            <InfoTooltip 
                              content={
                                <div className="max-w-sm">
                                  <p className="font-semibold mb-1">VDOT (V-dot O2 max)</p>
                                  <p className="text-sm">
                                    Jack Daniels&apos; training intensity measure based on your race performance. 
                                    Higher values indicate better aerobic fitness. Used to calculate your 
                                    training paces for easy runs, tempo runs, and intervals.
                                  </p>
                                </div>
                              }
                            />
                          </div>
                        </div>
                        <Input
                          id="vdot"
                          name="vdot"
                          type="number"
                          min={20}
                          max={60}
                          value={String(vdot)}
                          onChange={(_n, v) => setVdot(Number(v))}
                          className="h-10"
                        />
                      </div>
                    </div>
                  )}
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center pt-8">
                <Button
                  type="submit"
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white px-10 py-4 text-base font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-0.5"
                >
                  <div className="flex items-center space-x-2">
                    <span>Generate Training Plan</span>
                    <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse"></div>
                  </div>
                </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Generated Plan Display */}
      {planData && (
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/50 dark:bg-zinc-900/50 border-0 shadow-none backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-lg font-light text-zinc-900 dark:text-zinc-100 mb-1">
                  Your Training Plan
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Review and customize your personalized training plan
                </p>
              </div>
              
              <RunningPlanDisplay
                planData={planData}
                planName={planName}
                showPlanMeta
                showBulkDaySetter
                onPlanNameChange={setPlanName}
                onPlanChange={setPlanData}
              />
              
              {/* Debug Section */}
              <div className="mt-6 pt-4 border-t border-zinc-200/50 dark:border-zinc-700/50">
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    id="showJson"
                    name="showJson"
                    type="checkbox"
                    checked={showJson}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setShowJson(e.target.checked)
                    }
                    className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <Label htmlFor="showJson" className="text-xs text-zinc-500 dark:text-zinc-400">
                    Show JSON Debug Info
                  </Label>
                  {showJson && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          JSON.stringify(planData, null, 2)
                        );
                        alert("JSON copied to clipboard!");
                      }}
                      className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors underline underline-offset-1"
                    >
                      Copy JSON
                    </button>
                  )}
                </div>
                {showJson && (
                  <pre className="bg-zinc-50/50 dark:bg-zinc-800/30 border border-zinc-200/50 dark:border-zinc-700/50 p-3 rounded-lg overflow-x-auto text-xs text-zinc-700 dark:text-zinc-300 font-mono">
                    {JSON.stringify(planData, null, 2)}
                  </pre>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PlanGenerator;
