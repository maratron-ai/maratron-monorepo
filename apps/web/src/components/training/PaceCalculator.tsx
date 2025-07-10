// src/components/PaceCalculator.tsx
"use client";

import React, { useState } from "react";
import {
  RacePrediction,
  calculateRacePaces,
} from "@lib/utils/running/calculateRacePaces";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Label } from "@components/ui/label";
import { Alert, AlertDescription } from "@components/ui/alert";
import { Badge } from "@components/ui/badge";

const PaceCalculator: React.FC = () => {
  const [raceTime, setRaceTime] = useState(""); // Known race time in minutes
  const [distance, setDistance] = useState(""); // Known race distance in kilometers
  const [predictions, setPredictions] = useState<RacePrediction[]>([]);
  const [error, setError] = useState("");

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const timeInMinutes = parseFloat(raceTime);
    const distanceKm = parseFloat(distance);

    if (
      isNaN(timeInMinutes) ||
      isNaN(distanceKm) ||
      timeInMinutes <= 0 ||
      distanceKm <= 0
    ) {
      setError("Please enter valid numbers for race time and distance.");
      return;
    }

    const preds = calculateRacePaces(timeInMinutes, distanceKm);
    setPredictions(preds);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-zinc-900 dark:text-zinc-100">
            Race Pace Calculator
          </CardTitle>
          <CardDescription className="text-zinc-600 dark:text-zinc-400">
            Enter your race time and distance to predict performance in other races
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCalculate} className="space-y-6">
            {error && (
              <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <AlertDescription className="text-red-600 dark:text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="raceTime" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Race Time (minutes)
                </Label>
                <Input
                  id="raceTime"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 42.5"
                  value={raceTime}
                  onChange={(e) => setRaceTime(e.target.value)}
                  className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="distance" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Distance (km)
                </Label>
                <Input
                  id="distance"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 10.0"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              Calculate Predictions
            </Button>
          </form>
        </CardContent>
      </Card>

      {predictions.length > 0 && (
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
              Race Predictions
            </CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">
              Based on your {distance}km race in {raceTime} minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {predictions.map((pred, index) => (
                <div key={index} className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-600">
                      {pred.target}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Time:</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{pred.predictedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Pace/km:</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{pred.pacePerKm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Pace/mile:</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{pred.pacePerMile}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaceCalculator;
