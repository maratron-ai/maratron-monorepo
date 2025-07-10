"use client";

import { useState } from "react";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import { SelectField } from "@components/ui/FormField";
import { TimePicker } from "@components/ui/time-picker";
import { Alert, AlertDescription } from "@components/ui/alert";
import { Card, CardContent } from "@components/ui/card";
import { calculateVDOTJackDaniels } from "@utils/running/jackDaniels";
import { parseDuration } from "@utils/time";
import { updateUser } from "@lib/api/user/user";

interface Props {
  userId: string;
  onComplete?: () => void;
}

export default function VDOTEstimator({ userId, onComplete }: Props) {
  const [distance, setDistance] = useState<"5k" | "10k">("5k");
  const [time, setTime] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const seconds = parseDuration(time);
    if (!seconds) {
      setError("Please enter time as mm:ss or hh:mm:ss");
      return;
    }
    setSaving(true);
    try {
      const meters = distance === "5k" ? 5000 : 10000;
      const vdot = Math.round(calculateVDOTJackDaniels(meters, seconds));
      await updateUser(userId, { VDOT: vdot });
      if (onComplete) onComplete();
    } catch (err) {
      console.error(err);
      setError("Failed to save VDOT");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="distance" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Race Distance
          </Label>
          <div className="mt-2">
            <SelectField
              name="distance"
              label=""
              value={distance}
              onChange={(_, value) => setDistance(value as "5k" | "10k")}
              options={[
                { value: "5k", label: "5K" },
                { value: "10k", label: "10K" },
              ]}
            />
          </div>
        </div>
        
        <div>
          <TimePicker
            id="race-time"
            label="Race Time"
            value={time}
            onChange={(value) => setTime(value)}
            placeholder="h:mm:ss"
            alwaysShowHours
            required
          />
        </div>
      </div>
      
      {error && (
        <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <AlertDescription className="text-red-600 dark:text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="pt-4">
        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
          {saving ? "Calculating..." : "Calculate VDOT"}
        </Button>
      </div>
    </form>
  );
}
