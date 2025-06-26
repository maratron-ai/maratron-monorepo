"use client";

import React from "react";
import RunForm from "@components/runs/RunForm";
import { createRun } from "@lib/api/run";
import { Run } from "@maratypes/run";
import type { DistanceUnit, ElevationUnit, TrainingEnvironment } from "@maratypes/basics";

const CreateRun: React.FC = () => {

  interface RawRunDto {
    id?: string;
    date: string;
    duration: string;
    distance: number;
    distanceUnit: DistanceUnit;
    trainingEnvironment?: TrainingEnvironment;
    name?: string;
    pace?: string;
    paceUnit?: DistanceUnit;
    elevationGain?: number;
    elevationGainUnit?: ElevationUnit;
    notes?: string;
    userId: string;
    shoeId?: string;
  }

  const handleRunSubmit = async (run: Run) => {
    console.log("TEST");
    try {
      // attach the current user's ID here
      // For example, if you have an auth hook:
      // run.socialProfileId = currentUserId;

      const dto: Partial<RawRunDto> = {
        ...run,
        date: run.date.toISOString(),
        pace: run.pace?.pace,
        paceUnit: run.pace?.unit,
      };
      const createdRun = await createRun(dto);
      console.log("Run created successfully:", createdRun);
    } catch (error) {
      console.error("Error creating run:", error);
      // Handle error (show a notification, etc.)
    }
  };

  return (
    <div>
      <h1>Create a New Run</h1>
      <RunForm onSubmit={handleRunSubmit} />
    </div>
  );
};

export default CreateRun;
