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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Calendar } from "@components/ui/calendar";
import { ChevronDownIcon } from "lucide-react";
import InfoTooltip from "@components/ui/info-tooltip";
import { TimePicker } from "@components/ui/time-picker";
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
  const [datePickerOpen, setDatePickerOpen] = useState<boolean>(false);
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

  // Validate goal pace and provide progression feedback
  useEffect(() => {
    if (vdot && targetDistance && targetPace && weeks) {
      try {
        const toMeters = distanceUnit === "miles" ? 1609.34 : 1000;
        const raceMeters = targetDistance * toMeters;
        const calculatedMarathonPace = calculatePaceForVDOT(raceMeters, vdot, "M");
        
        const validation = validateGoalPace(targetPace, calculatedMarathonPace, vdot, weeks);
        setGoalValidation(validation);
      } catch (error) {
        // Handle validation errors gracefully
        if (error instanceof Error) {
          setGoalValidation({
            isValid: false,
            projectedVDOT: vdot,
            message: `Invalid pace format: ${error.message.includes('format') ? 'Please use mm:ss format (e.g., "8:30")' : error.message}`
          });
        } else {
          setGoalValidation({
            isValid: false,
            projectedVDOT: vdot,
            message: 'Please check your pace format (use mm:ss like "8:30")'
          });
        }
      }
    } else {
      setGoalValidation(null);
    }
  }, [vdot, targetDistance, targetPace, weeks, distanceUnit]);

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
          <Card className="bg-white/70 dark:bg-zinc-900/70 border-zinc-200/50 dark:border-zinc-700/50 shadow-sm backdrop-blur-sm">
            <CardContent className="p-8">
              <form onSubmit={handleGenerate} className="space-y-6">
                {/* Basic Configuration */}
                <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 items-start">
                  {/* Row 1: Race Distance */}
                  <div className="md:col-start-1">
                    <div className="space-y-2">
                      <Label htmlFor="race-distance" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Race Distance
                      </Label>
                      <Select value={raceType} onValueChange={(value) => setRaceType(value as RaceType)}>
                        <SelectTrigger className="h-10 border-zinc-200/50 dark:border-zinc-700/50 bg-white/70 dark:bg-zinc-800/70">
                          <SelectValue placeholder="Select race distance" />
                        </SelectTrigger>
                        <SelectContent 
                          className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-700/50 shadow-lg"
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
                        className="h-10 border-zinc-200/50 dark:border-zinc-700/50 bg-white/70 dark:bg-zinc-800/70"
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
                        <SelectTrigger className="h-10 border-zinc-200/50 dark:border-zinc-700/50 bg-white/70 dark:bg-zinc-800/70">
                          <SelectValue placeholder="Select training level" />
                        </SelectTrigger>
                        <SelectContent 
                          className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-700/50 shadow-lg"
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
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Race Date
                      </Label>
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between text-left font-normal h-10 border-zinc-200/50 dark:border-zinc-700/50 bg-white/70 dark:bg-zinc-800/70"
                            aria-label="Select race date"
                            aria-haspopup="dialog"
                            aria-expanded={datePickerOpen}
                          >
                            <span>{endDate ? endDate.toLocaleDateString() : "Select date"}</span>
                            <ChevronDownIcon className="h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-auto p-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg rounded-lg" 
                          align="center"
                          side="bottom"
                          sideOffset={4}
                        >
                          <div className="p-4 space-y-4">
                            {/* Month/Year Controls */}
                            <div className="flex items-center justify-between">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-accent"
                                onClick={() => {
                                  const newDate = new Date(endDate || new Date());
                                  newDate.setMonth(newDate.getMonth() - 1);
                                  setEndDate(newDate);
                                }}
                                aria-label="Previous month"
                              >
                                <ChevronDownIcon className="h-4 w-4 rotate-90" />
                              </Button>
                              
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <select 
                                    className="bg-background border border-input rounded px-3 py-1 pr-8 text-sm font-medium min-w-[100px] appearance-none cursor-pointer"
                                    value={endDate?.getMonth() || new Date().getMonth()}
                                    onChange={(e) => {
                                      const newDate = new Date(endDate || new Date());
                                      newDate.setMonth(parseInt(e.target.value));
                                      setEndDate(newDate);
                                    }}
                                    aria-label="Select month"
                                  >
                                    {Array.from({ length: 12 }, (_, i) => (
                                      <option key={i} value={i}>
                                        {new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'long' })}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDownIcon className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 pointer-events-none opacity-50" />
                                </div>
                                
                                <div className="relative">
                                  <select 
                                    className="bg-background border border-input rounded px-3 py-1 pr-8 text-sm font-medium min-w-[80px] appearance-none cursor-pointer"
                                    value={endDate?.getFullYear() || new Date().getFullYear()}
                                    onChange={(e) => {
                                      const newDate = new Date(endDate || new Date());
                                      newDate.setFullYear(parseInt(e.target.value));
                                      setEndDate(newDate);
                                    }}
                                    aria-label="Select year"
                                  >
                                    {Array.from({ length: 10 }, (_, i) => {
                                      const year = new Date().getFullYear() + i;
                                      return (
                                        <option key={year} value={year}>
                                          {year}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <ChevronDownIcon className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 pointer-events-none opacity-50" />
                                </div>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-accent"
                                onClick={() => {
                                  const newDate = new Date(endDate || new Date());
                                  newDate.setMonth(newDate.getMonth() + 1);
                                  setEndDate(newDate);
                                }}
                                aria-label="Next month"
                              >
                                <ChevronDownIcon className="h-4 w-4 -rotate-90" />
                              </Button>
                            </div>

                            {/* Calendar Grid */}
                            <div className="space-y-2">
                              {/* Day Headers */}
                              <div className="grid grid-cols-7 gap-1">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                  <div
                                    key={day}
                                    className="h-8 w-8 text-xs font-medium text-muted-foreground flex items-center justify-center"
                                  >
                                    {day}
                                  </div>
                                ))}
                              </div>
                              
                              {/* Calendar Days */}
                              <div className="grid grid-cols-7 gap-1">
                                {(() => {
                                  const currentDate = endDate || new Date();
                                  const year = currentDate.getFullYear();
                                  const month = currentDate.getMonth();
                                  
                                  // Get first day of month and how many days
                                  const firstDay = new Date(year, month, 1);
                                  const lastDay = new Date(year, month + 1, 0);
                                  const daysInMonth = lastDay.getDate();
                                  const startingDayOfWeek = firstDay.getDay();
                                  
                                  // Get days from previous month
                                  const prevMonth = new Date(year, month - 1, 0);
                                  const daysInPrevMonth = prevMonth.getDate();
                                  
                                  const days = [];
                                  
                                  // Previous month days (muted)
                                  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
                                    const day = daysInPrevMonth - i;
                                    days.push(
                                      <button
                                        key={`prev-${day}`}
                                        className="h-8 w-8 text-sm text-zinc-400 dark:text-zinc-600 opacity-30 hover:opacity-70 hover:bg-accent/50 hover:text-accent-foreground rounded-md transition-colors"
                                        onClick={() => {
                                          const newDate = new Date(year, month - 1, day);
                                          setEndDate(newDate);
                                          setDatePickerOpen(false);
                                        }}
                                      >
                                        {day}
                                      </button>
                                    );
                                  }
                                  
                                  // Current month days
                                  for (let day = 1; day <= daysInMonth; day++) {
                                    const date = new Date(year, month, day);
                                    const isSelected = endDate && 
                                      date.getDate() === endDate.getDate() && 
                                      date.getMonth() === endDate.getMonth() && 
                                      date.getFullYear() === endDate.getFullYear();
                                    const isToday = 
                                      date.toDateString() === new Date().toDateString();
                                    
                                    days.push(
                                      <button
                                        key={`current-${day}`}
                                        className={`h-8 w-8 text-sm rounded-md transition-colors relative ${
                                          isSelected
                                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold shadow-sm'
                                            : isToday
                                            ? 'bg-accent text-accent-foreground hover:bg-accent/80 font-bold'
                                            : 'hover:bg-accent hover:text-accent-foreground'
                                        }`}
                                        onClick={() => {
                                          setEndDate(date);
                                          setDatePickerOpen(false);
                                        }}
                                        aria-label={`Select ${date.toLocaleDateString()}`}
                                      >
                                        {day}
                                      </button>
                                    );
                                  }
                                  
                                  // Next month days to fill the grid (muted)
                                  const totalCells = 42; // 6 weeks * 7 days
                                  const remainingCells = totalCells - days.length;
                                  for (let day = 1; day <= remainingCells; day++) {
                                    days.push(
                                      <button
                                        key={`next-${day}`}
                                        className="h-8 w-8 text-sm text-zinc-400 dark:text-zinc-600 opacity-30 hover:opacity-70 hover:bg-accent/50 hover:text-accent-foreground rounded-md transition-colors"
                                        onClick={() => {
                                          const newDate = new Date(year, month + 1, day);
                                          setEndDate(newDate);
                                          setDatePickerOpen(false);
                                        }}
                                      >
                                        {day}
                                      </button>
                                    );
                                  }
                                  
                                  return days;
                                })()}
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goal Configuration */}
              <div>
                <div className="space-y-5">
                  {/* Target Pace or Total Time */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      {/* Toggle */}
                      <div className="flex-shrink-0">
                        <div className="flex items-center gap-2 p-1 bg-white/70 dark:bg-zinc-800/70 border border-zinc-200/50 dark:border-zinc-700/50 rounded-lg h-[42px]">
                          <button
                            type="button"
                            onClick={() => setUseTotalTime(false)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                              !useTotalTime 
                                ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100' 
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                            }`}
                          >
                            Pace
                          </button>
                          <button
                            type="button"
                            onClick={() => setUseTotalTime(true)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                              useTotalTime 
                                ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100' 
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                            }`}
                          >
                            Total Time
                          </button>
                        </div>
                      </div>
                      
                      {/* Time Input */}
                      <div className="flex-1">
                        {useTotalTime ? (
                          <TimePicker
                            id="target-total-time"
                            label=""
                            value={targetTotalTime}
                            onChange={(value) => setTargetTotalTime(value)}
                            placeholder="h:mm:ss"
                            alwaysShowHours
                          />
                        ) : (
                          <TimePicker
                            id="target-pace"
                            label=""
                            value={targetPace}
                            onChange={(value) => setTargetPace(value)}
                            placeholder="mm:ss"
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* Validation Feedback */}
                    {goalValidation && !useTotalTime && (
                      <div className={`p-4 rounded-lg border transition-all ${
                        goalValidation.isValid 
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border-emerald-200/50 dark:border-emerald-800/50' 
                          : 'bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border-amber-200/50 dark:border-amber-800/50'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className={`w-2 h-2 rounded-full ${goalValidation.isValid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {goalValidation.isValid ? 'Progressive Training Plan' : 'Ambitious Goal'}
                            </p>
                            <p className="text-sm opacity-90 leading-relaxed">{goalValidation.message}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {goalValidation && useTotalTime && (
                      <div className={`p-4 rounded-lg border transition-all ${
                        goalValidation.isValid 
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border-emerald-200/50 dark:border-emerald-800/50' 
                          : 'bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border-amber-200/50 dark:border-amber-800/50'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className={`w-2 h-2 rounded-full ${goalValidation.isValid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {goalValidation.isValid ? 'Progressive Training Plan' : 'Ambitious Goal'}
                            </p>
                            <p className="text-sm opacity-90 leading-relaxed">{goalValidation.message}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Advanced Settings Toggle */}
              <div className="flex items-center justify-center py-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((p) => !p)}
                  className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors underline underline-offset-2"
                >
                  {showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings"}
                </button>
              </div>

              {showAdvanced && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Runs Per Week */}
                    <Input
                      label="Runs Per Week"
                      name="runsPerWeek"
                      type="number"
                      min={1}
                      max={7}
                      value={String(runsPerWeek)}
                      onChange={(_n, v) => setRunsPerWeek(Number(v))}
                      className="mt-1 border-zinc-200/50 dark:border-zinc-700/50 bg-white/70 dark:bg-zinc-800/70"
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
                      className="mt-1 border-zinc-200/50 dark:border-zinc-700/50 bg-white/70 dark:bg-zinc-800/70"
                    />
                    {/* VDOT */}
                    <Input
                      label={
                        <div className="flex items-center gap-1">
                          VDOT
                          <InfoTooltip 
                            content={
                              <div className="max-w-xs">
                                <p className="font-medium text-xs mb-1">VDOT</p>
                                <p className="text-xs">
                                  Jack Daniels&apos; fitness measure used to calculate training paces.
                                </p>
                              </div>
                            }
                          />
                        </div>
                      }
                      name="vdot"
                      type="number"
                      min={20}
                      max={60}
                      value={String(vdot)}
                      onChange={(_n, v) => setVdot(Number(v))}
                      className="mt-1 border-zinc-200/50 dark:border-zinc-700/50 bg-white/70 dark:bg-zinc-800/70"
                    />
                  </div>
                </div>
              )}

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
