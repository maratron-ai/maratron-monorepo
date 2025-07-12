"use client";
import React, { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { useUser } from "@hooks/useUser";
import { createRunningPlan } from "@lib/api/plan";
import { RunningPlanData, WeekPlan, PlannedRun } from "@maratypes/runningPlan";
import { DayOfWeek } from "@maratypes/basics";
import { TrainingLevel } from "@maratypes/user";
import { setDayForRunType } from "@utils/running/setRunDay";
import { parsePace, formatPace } from "@utils/running/paces";
import { Button, Checkbox, Label } from "@components/ui";
import { Input } from "@components/ui/input";
import { SelectField } from "@components/ui/FormField";
import { useRouter } from "next/navigation";
import { assignDatesToPlan } from "@utils/running/planDates";
import { calculateWeeksBetweenDates } from "@utils/running/smartDates";
import { 
  generate5kPlan,
  generate10kPlan,
  generateHalfMarathonPlan,
  generateClassicMarathonPlan,
} from "@utils/running/plans/distancePlans";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Badge } from "@components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

interface RunningPlanDisplayProps {
  planData: RunningPlanData;
  planName?: string;
  /**
   * Set the initial editable state of the plan schedule.
   */
  editable?: boolean;
  /**
   * Allows the user to toggle edit mode and save changes. Used when
   * displaying an existing plan.
   */
  allowEditable?: boolean;
  /**
   * Show controls for editing the plan name and saving the plan.
   */
  showPlanMeta?: boolean;
  /**
   * Show the bulk day setter even when the plan is not editable.
   */
  showBulkDaySetter?: boolean;
  onPlanChange?: (plan: RunningPlanData) => void;
  onPlanNameChange?: (name: string) => void;
  /**
   * Callback invoked when the Save button is clicked while editing an
   * existing plan. The updated plan data is provided.
   */
  onSave?: (planData: RunningPlanData) => Promise<void> | void;
  /**
   * Callback invoked when the "Start Now" button is clicked. Useful for
   * persisting the new start date or toggling active state.
   */
  onStartNow?: (planData: RunningPlanData) => Promise<void> | void;
}

const RunningPlanDisplay: React.FC<RunningPlanDisplayProps> = ({
  planData,
  planName,
  editable = false,
  allowEditable = false,
  showPlanMeta = false,
  showBulkDaySetter = false,
  onPlanChange,
  onPlanNameChange,
  onSave,
  onStartNow,
}) => {
  const { profile: user } = useUser();
  const [editingName, setEditingName] = useState(false);
  const [isEditable, setIsEditable] = useState(editable);
  const router = useRouter();

  useEffect(() => {
    setIsEditable(editable);
  }, [editable]);

  const updateRun = (weekIdx: number, runIdx: number, field: string, value: unknown) => {
    if (!onPlanChange) return;
    const newSchedule = planData.schedule.map((w, wi) => {
      if (wi !== weekIdx) return w;
      const runs = w.runs.map((r, ri) =>
        ri === runIdx ? { ...r, [field]: value } : r
      );
      return { ...w, runs };
    });
    onPlanChange({ ...planData, schedule: newSchedule });
  };

  const regeneratePlanWithNewDates = (startDate: string, endDate: string) => {
    if (!onPlanChange) return;

    const newWeeks = calculateWeeksBetweenDates(startDate, endDate);
    
    if (newWeeks < 1) {
      alert('Invalid date range: End date must be at least 1 week after start date.');
      return;
    }

    // Extract plan parameters from the existing plan
    const distanceUnit = planData.schedule[0]?.runs[0]?.unit || 'miles';
    const targetDistance = planData.schedule[planData.schedule.length - 1]?.runs.find(r => r.type === 'marathon' || r.type === 'race')?.mileage || 26.2;
    
    // Estimate VDOT from existing pace zones (fallback to 35 if not available)
    const marathonRun = planData.schedule.find(w => w.runs.some(r => r.type === 'marathon'))?.runs.find(r => r.type === 'marathon');
    const targetPace = marathonRun?.targetPace?.pace;
    
    // Default parameters for regeneration
    const regenerationParams = {
      weeks: newWeeks,
      distanceUnit: distanceUnit as 'miles' | 'kilometers',
      trainingLevel: TrainingLevel.Intermediate, // Default to intermediate
      vdot: 35, // Default VDOT
      targetPace,
      runsPerWeek: 4,
      crossTrainingDays: 0,
    };

    try {
      let newPlan: RunningPlanData;
      
      // Determine race type based on target distance
      if (targetDistance <= 3.2) {
        newPlan = generate5kPlan(regenerationParams);
      } else if (targetDistance <= 6.5) {
        newPlan = generate10kPlan(regenerationParams);
      } else if (targetDistance <= 13.2) {
        newPlan = generateHalfMarathonPlan(regenerationParams);
      } else {
        newPlan = generateClassicMarathonPlan(regenerationParams);
      }

      // Assign the new dates to the regenerated plan
      const planWithDates = assignDatesToPlan(newPlan, {
        startDate,
        endDate,
      });

      onPlanChange(planWithDates);
    } catch (error) {
      console.error('Error regenerating plan:', error);
      // Fallback to just updating dates on existing plan
      const updated = assignDatesToPlan(planData, {
        startDate,
        endDate,
      });
      onPlanChange(updated);
    }
  };

  const updateStartDate = (date: string) => {
    if (!onPlanChange || !planData.endDate) return;
    
    const newWeeks = calculateWeeksBetweenDates(date, planData.endDate);
    const originalWeeks = planData.schedule.length;
    
    // If the number of weeks changed significantly, regenerate the plan
    if (Math.abs(newWeeks - originalWeeks) > 1) {
      const shouldRegenerate = confirm(
        `Changing the start date will change your plan from ${originalWeeks} weeks to ${newWeeks} weeks. This will regenerate your training plan. Continue?`
      );
      
      if (shouldRegenerate) {
        regeneratePlanWithNewDates(date, planData.endDate);
      }
    } else {
      // Minor change, just update dates
      const updated = assignDatesToPlan(planData, {
        startDate: date,
        endDate: planData.endDate,
      });
      onPlanChange(updated);
    }
  };

  const updateEndDateCreation = (date: string) => {
    if (!onPlanChange) return;
    
    if (planData.startDate) {
      const newWeeks = calculateWeeksBetweenDates(planData.startDate, date);
      const originalWeeks = planData.schedule.length;
      
      // If the number of weeks changed significantly, regenerate the plan
      if (Math.abs(newWeeks - originalWeeks) > 1) {
        const shouldRegenerate = confirm(
          `Changing the race date will change your plan from ${originalWeeks} weeks to ${newWeeks} weeks. This will regenerate your training plan. Continue?`
        );
        
        if (shouldRegenerate) {
          regeneratePlanWithNewDates(planData.startDate, date);
        }
        return;
      }
    }
    
    // Minor change or no start date set, just update dates
    const updated = assignDatesToPlan(planData, {
      startDate: planData.startDate,
      endDate: date,
    });
    onPlanChange(updated);
  };

  const updateEndDateSaved = (date: string) => {
    if (!onPlanChange || !planData.startDate) return;
    
    const newWeeks = calculateWeeksBetweenDates(planData.startDate, date);
    const originalWeeks = planData.schedule.length;
    
    // If the number of weeks changed significantly, offer to regenerate
    if (Math.abs(newWeeks - originalWeeks) > 1) {
      const shouldRegenerate = confirm(
        `Changing the race date will change your plan from ${originalWeeks} weeks to ${newWeeks} weeks. This will regenerate your training plan. Continue?`
      );
      
      if (shouldRegenerate) {
        regeneratePlanWithNewDates(planData.startDate, date);
      }
    } else {
      // Minor change, just update dates
      const updated = assignDatesToPlan(planData, {
        startDate: planData.startDate,
        endDate: date,
      });
      onPlanChange(updated);
    }
  };

  const startToday = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const updated = assignDatesToPlan(planData, {
      startDate: today,
      endDate: planData.endDate,
    });
    onPlanChange?.(updated);
    if (onStartNow) {
      await onStartNow(updated);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const plan = await createRunningPlan({
        userId: user.id!,
        planData,
        name: planName ?? "Running Plan",
        startDate: planData.startDate ? new Date(planData.startDate) : undefined,
        endDate: planData.endDate ? new Date(planData.endDate) : undefined,
        active: false,
      });
      alert("Plan saved");
      router.push(`/plans/${plan.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to save plan");
    }
  };
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
      {showPlanMeta ? (
        <>
          {/* <h2 className="text-2xl font-bold text-center mb-4">Running Plan:</h2> */}
          <div className="mb-4 flex items-center gap-2">
            {/* <span className="font-semibold">Plan Name:</span> */}
            {editingName ? (
              <Input
                type="text"
                value={planName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onPlanNameChange?.(e.target.value)
                }
                onBlur={() => setEditingName(false)}
                autoFocus
                className="w-full max-w-md text-2xl font-bold text-center mb-4 block mx-auto"
              />
            ) : (
              <h2 className="w-full text-2xl font-bold text-center mb-4">
                {planName}
                <Button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="text-zinc-900 dark:text-zinc-100 hover:text-primary w-auto bg-transparent no-underline transition-colors hover:bg-transparent"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </h2>
            )}
          </div>
          <div className="mt-4 flex justify-center gap-4 pb-5">
            <Button
              type="button"
              onClick={handleSave}
              className="bg-transparent text-underline px-4 py-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 block w-auto text-zinc-900 dark:text-zinc-100 bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
            >
              Save Plan
            </Button>
            <Button
              type="button"
              onClick={() => setIsEditable((e) => !e)}
              className="bg-transparent text-underline px-4 py-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 block w-auto text-zinc-900 dark:text-zinc-100 bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
            >
              {isEditable ? "Done" : "Edit"}
            </Button>
            <Button
              type="button"
              onClick={startToday}
              className="bg-transparent text-underline px-4 py-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 block w-auto text-zinc-900 dark:text-zinc-100 bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
            >
              Start Now
            </Button>
          </div>
          <div className="flex flex-row justify-center items-start space-x-8 mb-4">
            <div>
              <label className="block mb-1 font-semibold text-center">
                Start Date
              </label>
              <Input
                type="date"
                value={planData.startDate?.slice(0, 10) || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateStartDate(e.target.value)
                }
                className="text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-lg mb-2 backdrop-blur-sm">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {planData.startDate && planData.endDate 
                    ? `${calculateWeeksBetweenDates(planData.startDate, planData.endDate)} weeks`
                    : `${planData.schedule.length} weeks`
                  }
                </span>
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Training Plan
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              <label className="block mb-1 font-semibold text-center">
                Race Date
              </label>
              <Input
                type="date"
                value={planData.endDate?.slice(0, 10) || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateEndDateCreation(e.target.value)
                }
                className="text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-center mb-2">
            {planName || "Your Running Plan"}
          </h2>
          {allowEditable && (
            <div className="mb-4 flex justify-center gap-2">
              <Button
                onClick={() => setIsEditable((e) => !e)}
                className="border-none bg-transparent text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 focus:ring-0"
              >
                {isEditable ? "Cancel" : "Edit"}
              </Button>
              <Button
                type="button"
                onClick={startToday}
                className="border-none bg-transparent text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 focus:ring-0"
              >
                Start Now
              </Button>
              {isEditable && (
                <Button
                  onClick={async () => {
                    await onSave?.(planData);
                    setIsEditable(false);
                  }}
                  className="border-none bg-transparent text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  Save
                </Button>
              )}
            </div>
          )}
          <div className="mb-4 flex justify-center items-center gap-6">
            <div className="flex flex-col items-center text-center">
              <label className="block mb-1 font-semibold">Start Date</label>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {planData.startDate?.slice(0, 10) || "Not set"}
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-lg backdrop-blur-sm">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {planData.startDate && planData.endDate 
                    ? `${calculateWeeksBetweenDates(planData.startDate, planData.endDate)} weeks`
                    : `${planData.schedule.length} weeks`
                  }
                </span>
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Training Plan
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              <label className="block mb-1 font-semibold">Race Date</label>
              <Input
                type="date"
                value={planData.endDate?.slice(0, 10) || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateEndDateSaved(e.target.value)
                }
                className="text-zinc-900 dark:text-zinc-100 w-auto"
              />
            </div>
          </div>
        </>
      )}
      {(isEditable || showBulkDaySetter) && (
        <BulkDaySetter planData={planData} onPlanChange={onPlanChange} />
      )}
      <Accordion type="multiple" className="w-full space-y-4">
        {planData.schedule.map((weekPlan, wi) => (
          <AccordionWeek
            key={weekPlan.weekNumber}
            weekPlan={weekPlan}
            editable={isEditable}
            weekIndex={wi}
            updateRun={updateRun}
          />
        ))}
      </Accordion>
    </div>
  );
};

interface AccordionWeekProps {
  weekPlan: WeekPlan;
  editable: boolean;
  weekIndex: number;
  updateRun: (weekIdx: number, runIdx: number, field: string, value: unknown) => void;
}

const AccordionWeek: React.FC<AccordionWeekProps> = ({
  weekPlan,
  editable,
  weekIndex,
  updateRun,
}) => {
  const isWeekComplete = weekPlan.runs.every(run => run.done);

  const days: DayOfWeek[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const runTypes = ["easy", "tempo", "interval", "long", "marathon", "cross", "race"] as const;

  return (
    <AccordionItem value={`week-${weekPlan.weekNumber}`}>
      <Card className={`bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm ${
        isWeekComplete ? "opacity-75" : ""
      }`}>
        <AccordionTrigger className="hover:no-underline">
          <CardHeader className="flex-row items-center justify-between w-full py-0">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Week {weekPlan.weekNumber}
                {weekPlan.phase && (
                  <Badge variant="outline" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700">
                    {weekPlan.phase} phase
                  </Badge>
                )}
              </CardTitle>
              {isWeekComplete && (
                <Badge className="bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 border border-green-300 dark:border-green-700">
                  Complete
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Total Mileage: {Math.round(weekPlan.weeklyMileage * 10)/10} {weekPlan.unit}
              </div>
              {weekPlan.notes && (
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {weekPlan.notes}
                </div>
              )}
            </div>
          </CardHeader>
        </AccordionTrigger>
        <AccordionContent>
          <CardContent className="pt-0 pb-2">
            <div className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
              <p>Start: {weekPlan.startDate?.slice(0, 10)}</p>
              {weekPlan.notes && <p className="mt-1">{weekPlan.notes}</p>}
            </div>
            <div className="space-y-3">
              {weekPlan.runs.map((run, index) => {
                const past = run.date ? new Date(run.date) < new Date() : false;
                const isCompleted = past || run.done;
                return (
                  <Card key={index} className={`bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 ${
                    isCompleted ? "opacity-75" : ""
                  }`}>
                    <CardContent className="p-3">
                      {editable ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-zinc-900 dark:text-zinc-100 text-sm font-medium">Type</Label>
                              <SelectField
                                name="type"
                                label=""
                                options={runTypes.map((t) => ({ label: t, value: t }))}
                                value={run.type}
                                onChange={(_, value) =>
                                  updateRun(weekIndex, index, "type", value)
                                }
                              />
                            </div>
                            <div>
                              <Label className="text-zinc-900 dark:text-zinc-100 text-sm font-medium">Mileage</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={run.mileage}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    updateRun(
                                      weekIndex,
                                      index,
                                      "mileage",
                                      Math.round(Number(e.target.value) * 10) / 10
                                    )
                                  }
                                  className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                                />
                                <span className="text-zinc-600 dark:text-zinc-400">{run.unit}</span>
                              </div>
                            </div>
                            <div>
                              <Label className="text-zinc-900 dark:text-zinc-100 text-sm font-medium">Target Pace</Label>
                              <Input
                                type="text"
                                value={run.targetPace.pace}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  updateRun(weekIndex, index, "targetPace", {
                                    ...run.targetPace,
                                    pace: formatPace(parsePace(e.target.value)),
                                  })
                                }
                                className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                              />
                            </div>
                            <div>
                              <Label className="text-zinc-900 dark:text-zinc-100 text-sm font-medium">Day</Label>
                              <SelectField
                                name="day"
                                label=""
                                options={days.map((d) => ({ label: d, value: d }))}
                                value={run.day || "Sunday"}
                                onChange={(_, value) =>
                                  updateRun(
                                    weekIndex,
                                    index,
                                    "day",
                                    value as DayOfWeek
                                  )
                                }
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-zinc-900 dark:text-zinc-100 text-sm font-medium">Notes</Label>
                            <Input
                              type="text"
                              value={run.notes || ""}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateRun(weekIndex, index, "notes", e.target.value)
                              }
                              className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`run-${weekIndex}-${index}-edit-done`}
                              checked={run.done || false}
                              onCheckedChange={(checked: boolean) =>
                                updateRun(weekIndex, index, "done", Boolean(checked))
                              }
                            />
                            <Label
                              htmlFor={`run-${weekIndex}-${index}-edit-done`}
                              className="text-sm text-zinc-900 dark:text-zinc-100"
                            >
                              Mark as completed
                            </Label>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={
                                run.type === "marathon" 
                                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100" 
                                  : "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-600"
                              }
                            >
                              {run.type.charAt(0).toUpperCase() + run.type.slice(1)}
                            </Badge>
                            <span className="text-zinc-600 dark:text-zinc-400">•</span>
                            <span className="text-zinc-900 dark:text-zinc-100">{run.mileage} {run.unit}</span>
                            <span className="text-zinc-600 dark:text-zinc-400">•</span>
                            <span className="text-zinc-900 dark:text-zinc-100">{run.targetPace.pace} per {run.targetPace.unit}</span>
                          </div>
                          {run.day && (
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">
                              <strong>Day:</strong> {run.day}
                            </div>
                          )}
                          {run.date && (
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">
                              <strong>Date:</strong> {run.date.slice(0, 10)}
                            </div>
                          )}
                          {run.notes && (
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">
                              <strong>Notes:</strong> {run.notes}
                            </div>
                          )}
                          {typeof run.done !== "undefined" && (
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`run-${weekIndex}-${index}-view-done`}
                                checked={run.done}
                                onCheckedChange={(checked: boolean) =>
                                  updateRun(weekIndex, index, "done", Boolean(checked))
                                }
                                disabled={editable}
                              />
                              <Label
                                htmlFor={`run-${weekIndex}-${index}-view-done`}
                                className="text-sm text-zinc-900 dark:text-zinc-100"
                              >
                                Completed
                              </Label>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
};

interface BulkDaySetterProps {
  planData: RunningPlanData;
  onPlanChange?: (plan: RunningPlanData) => void;
}

const BulkDaySetter: React.FC<BulkDaySetterProps> = ({ planData, onPlanChange }) => {
  const days: DayOfWeek[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const runTypes: PlannedRun["type"][] = ["easy", "tempo", "interval", "long", "cross"];
  const [type, setType] = useState<PlannedRun["type"]>("easy");
  const [day, setDay] = useState<DayOfWeek>("Monday");

  const apply = () => {
    if (!onPlanChange) return;
    const updated = setDayForRunType(planData, type, day);
    onPlanChange(updated);
  };

  return (
    <div className="mb-4 flex items-center gap-2 justify-center">
      <span>Set all</span>
      <SelectField
        name="bulkType"
        label=""
        value={type}
        options={runTypes.map((t) => ({ label: t, value: t }))}
        onChange={(_, value) => setType(value as PlannedRun["type"])}
      />
      <span>runs to</span>
      <SelectField
        name="bulkDay"
        label=""
        value={day}
        options={days.map((d) => ({ label: d, value: d }))}
        onChange={(_, value) => setDay(value as DayOfWeek)}
      />
      <Button
        type="button"
        onClick={apply}
        className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1 rounded block w-auto text-zinc-900 dark:text-zinc-100 bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
      >
        Apply
      </Button>
    </div>
  );
};

export default RunningPlanDisplay;
