// src/components/PaceCalculator.tsx
"use client";

import React, { useState } from "react";
import {
  RacePrediction,
  calculateRacePaces,
} from "@lib/utils/running/calculateRacePaces";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";

const PaceCalculator: React.FC = () => {
  const [raceTime, setRaceTime] = useState(""); // Known race time in minutes
  const [distance, setDistance] = useState(""); // Known race distance in kilometers
  const [predictions, setPredictions] = useState<RacePrediction[]>([]);

  const handleCalculate = () => {
    const timeInMinutes = parseFloat(raceTime);
    const distanceKm = parseFloat(distance);

    if (
      isNaN(timeInMinutes) ||
      isNaN(distanceKm) ||
      timeInMinutes <= 0 ||
      distanceKm <= 0
    ) {
      alert("Please enter valid numbers for race time and distance.");
      return;
    }

    const preds = calculateRacePaces(timeInMinutes, distanceKm);
    setPredictions(preds);
  };

  return (
    <div>
      <h2>Race Pace Calculator</h2>
      <label>Known Race Time (minutes):</label>
      <Input
        type="number"
        value={raceTime}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setRaceTime(e.target.value)
        }
      />

      <label>Known Race Distance (km):</label>
      <Input
        type="number"
        value={distance}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDistance(e.target.value)}
      />

      <Button
        onClick={handleCalculate}
        className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from"
      >
        Calculate Predictions
      </Button>

      {predictions.length > 0 && (
        <div>
          <h3>Race Predictions</h3>
          <ul>
            {predictions.map((pred, index) => (
              <li key={index}>
                <strong>{pred.target}:</strong> Predicted Time:{" "}
                {pred.predictedTime}, Pace per Km: {pred.pacePerKm}, Pace per
                Mile: {pred.pacePerMile}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PaceCalculator;
