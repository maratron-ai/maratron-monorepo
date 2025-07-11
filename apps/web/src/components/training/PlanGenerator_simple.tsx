"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@hooks/useUser";
import { TrainingLevel } from "@maratypes/user";
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
  const [distanceUnit, setDistanceUnit] = useState<"miles" | "kilometers">("miles");
  const [weeks, setWeeks] = useState<number>(DISTANCE_INFO[DEFAULT_RACE].weeks);
  const [targetDistance, setTargetDistance] = useState<number>(DISTANCE_INFO[DEFAULT_RACE].miles);
  const [vdot, setVdot] = useState<number>(30);
  const [useTotalTime, setUseTotalTime] = useState<boolean>(false);
  const [targetPace, setTargetPace] = useState<string>("8:00");
  const [targetTotalTime, setTargetTotalTime] = useState<string>("3:45:00");
  const [planData, setPlanData] = useState<RunningPlanData | null>(null);
  const [showJson, setShowJson] = useState<boolean>(false);
  const [planName, setPlanName] = useState<string>(defaultPlanName(DEFAULT_RACE, 1));
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [goalValidation, setGoalValidation] = useState<{
    isValid: boolean;
    projectedVDOT: number;
    message?: string;
  } | null>(null);

  const [trainingLevel, setTrainingLevel] = useState<TrainingLevel>(TrainingLevel.Beginner);
  const [runsPerWeek, setRunsPerWeek] = useState<number>(4);
  const [crossTrainingDays, setCrossTrainingDays] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple test function for now
    console.log("Generate plan clicked");
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
                <div>
                  <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-5">
                    Basic Configuration  
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="race-distance" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Race Distance
                      </Label>
                      <Select value={raceType} onValueChange={(value) => setRaceType(value as RaceType)}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select race distance" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5k">5K</SelectItem>
                          <SelectItem value="10k">10K</SelectItem>
                          <SelectItem value="half">Half Marathon</SelectItem>
                          <SelectItem value="full">Marathon</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-8">
                  <Button type="submit" size="lg" className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
                    Generate Training Plan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PlanGenerator;