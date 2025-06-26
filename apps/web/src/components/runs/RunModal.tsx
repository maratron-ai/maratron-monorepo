"use client";

import { Run } from "@maratypes/run";
import { Card } from "@components/ui";
import { Button } from "@components/ui/button";
import { getRunName } from "@utils/running/getRunName";

interface RunModalProps {
  run: Run;
  onClose: () => void;
}

export default function RunModal({ run, onClose }: RunModalProps) {
  if (!run) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={onClose}
    >
      <Card
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg p-6 rounded-lg shadow-lg bg-background"
      >
        <Button
          aria-label="Close"
          onClick={onClose}
          className="
            absolute top-2 right-2
            bg-transparent
            text-2xl font-bold text-foreground text-opacity-60
            hover:text-primary hover:bg-transparent
            focus:outline-none focus:ring-0 focus-visible:ring-0
            transition-colors
          "
        >
          ×
        </Button>

        <h2 className="text-lg font-semibold mb-4 text-foreground">
          {run.name || getRunName(run)}
        </h2>
        <div className="space-y-2 text-sm text-foreground">
          <p>
            <span className="font-semibold">Distance:</span> {run.distance}{" "}
            {run.distanceUnit}
          </p>
          <p>
            <span className="font-semibold">Duration:</span> {run.duration}
          </p>
          {run.pace && (
            <p>
              <span className="font-semibold">Pace:</span> {run.pace.pace} /{" "}
              {run.pace.unit}
            </p>
          )}
          {run.elevationGain !== undefined && (
            <p>
              <span className="font-semibold">Elevation Gain:</span>{" "}
              {run.elevationGain} {run.elevationGainUnit}
            </p>
          )}
          {run.notes && (
            <p>
              <span className="font-semibold">Notes:</span> {run.notes}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
