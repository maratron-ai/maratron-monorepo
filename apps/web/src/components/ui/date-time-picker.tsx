"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { cn } from "@lib/utils/cn";
import { Calendar, Clock } from "lucide-react";

interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  className?: string;
  showDate?: boolean;
  showSeconds?: boolean;
  format12Hour?: boolean;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value = new Date(),
  onChange,
  className,
  showDate = true,
  showSeconds = true,
  format12Hour = true,
}) => {
  const [currentTime, setCurrentTime] = React.useState(value);
  const [editMode, setEditMode] = React.useState(false);

  React.useEffect(() => {
    setCurrentTime(value);
  }, [value]);

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    let ampm = "";

    if (format12Hour) {
      ampm = hours >= 12 ? " PM" : " AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
    }

    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = minutes.toString().padStart(2, "0");
    const formattedSeconds = seconds.toString().padStart(2, "0");

    if (showSeconds) {
      return `${formattedHours}:${formattedMinutes}:${formattedSeconds}${ampm}`;
    } else {
      return `${formattedHours}:${formattedMinutes}${ampm}`;
    }
  };

  const [hours, setHours] = React.useState(currentTime.getHours().toString().padStart(2, "0"));
  const [minutes, setMinutes] = React.useState(currentTime.getMinutes().toString().padStart(2, "0"));
  const [seconds, setSeconds] = React.useState(currentTime.getSeconds().toString().padStart(2, "0"));
  const [ampm, setAmpm] = React.useState(currentTime.getHours() >= 12 ? "PM" : "AM");

  React.useEffect(() => {
    let displayHours = currentTime.getHours();
    if (format12Hour) {
      displayHours = displayHours % 12;
      displayHours = displayHours ? displayHours : 12;
    }
    setHours(displayHours.toString().padStart(2, "0"));
    setMinutes(currentTime.getMinutes().toString().padStart(2, "0"));
    setSeconds(currentTime.getSeconds().toString().padStart(2, "0"));
    setAmpm(currentTime.getHours() >= 12 ? "PM" : "AM");
  }, [currentTime, format12Hour]);

  const updateTimeFromInputs = (newHours: string, newMinutes: string, newSeconds: string, newAmpm: string) => {
    let hourValue = parseInt(newHours) || 0;
    const minuteValue = parseInt(newMinutes) || 0;
    const secondValue = parseInt(newSeconds) || 0;
    
    if (format12Hour) {
      if (newAmpm === "PM" && hourValue !== 12) {
        hourValue += 12;
      } else if (newAmpm === "AM" && hourValue === 12) {
        hourValue = 0;
      }
    }
    
    const newTime = new Date(currentTime);
    newTime.setHours(hourValue, minuteValue, secondValue);
    setCurrentTime(newTime);
    onChange?.(newTime);
  };

  const handleInputChange = (field: "hours" | "minutes" | "seconds", value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    let maxValue = 59;
    let maxLength = 2;
    
    if (field === "hours") {
      maxValue = format12Hour ? 12 : 23;
      if (numericValue === "0" && format12Hour) return; // Don't allow 0 in 12-hour format
    }
    
    if (numericValue.length <= maxLength && (parseInt(numericValue) || 0) <= maxValue) {
      const paddedValue = numericValue.padStart(2, "0");
      
      switch (field) {
        case "hours":
          setHours(paddedValue);
          updateTimeFromInputs(paddedValue, minutes, seconds, ampm);
          break;
        case "minutes":
          setMinutes(paddedValue);
          updateTimeFromInputs(hours, paddedValue, seconds, ampm);
          break;
        case "seconds":
          setSeconds(paddedValue);
          updateTimeFromInputs(hours, minutes, paddedValue, ampm);
          break;
      }
    }
  };

  const handleAmpmToggle = () => {
    const newAmpm = ampm === "AM" ? "PM" : "AM";
    setAmpm(newAmpm);
    updateTimeFromInputs(hours, minutes, seconds, newAmpm);
  };

  const handleTimeClick = () => {
    setEditMode(!editMode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: "hours" | "minutes" | "seconds") => {
    if (e.key === ":" || e.key === "Tab") {
      e.preventDefault();
      const currentInput = e.target as HTMLInputElement;
      const inputs = currentInput.form?.querySelectorAll('input[type="text"]');
      if (inputs) {
        const currentIndex = Array.from(inputs).indexOf(currentInput);
        const nextInput = inputs[currentIndex + 1] as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }
    }
  };

  const TimeDisplay = () => (
    <div className="bg-zinc-800 dark:bg-zinc-900 border border-zinc-700 dark:border-zinc-600 rounded-lg px-6 py-4">
      <div className="text-2xl font-mono text-zinc-100 dark:text-zinc-50 tracking-wider">
        {formatTime(currentTime)}
      </div>
    </div>
  );

  const TimeInputs = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 justify-center">
        <div className="flex items-center gap-1">
          <Input
            type="text"
            inputMode="numeric"
            value={hours}
            onChange={(e) => handleInputChange("hours", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, "hours")}
            onFocus={(e) => e.target.select()}
            className="w-12 text-center bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            maxLength={2}
          />
          <span className="text-zinc-500 dark:text-zinc-400">:</span>
          <Input
            type="text"
            inputMode="numeric"
            value={minutes}
            onChange={(e) => handleInputChange("minutes", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, "minutes")}
            onFocus={(e) => e.target.select()}
            className="w-12 text-center bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            maxLength={2}
          />
          {showSeconds && (
            <>
              <span className="text-zinc-500 dark:text-zinc-400">:</span>
              <Input
                type="text"
                inputMode="numeric"
                value={seconds}
                onChange={(e) => handleInputChange("seconds", e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "seconds")}
                onFocus={(e) => e.target.select()}
                className="w-12 text-center bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                maxLength={2}
              />
            </>
          )}
          {format12Hour && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAmpmToggle}
              className="ml-2 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              {ampm}
            </Button>
          )}
        </div>
      </div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
        Enter time manually. Use Tab or : to move between fields.
      </div>
    </div>
  );

  return (
    <div className={cn("w-full max-w-sm", className)}>
      <Card className="bg-zinc-900 dark:bg-zinc-950 border-zinc-700 dark:border-zinc-800 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-zinc-100 dark:text-zinc-50 flex items-center gap-2">
            <Clock className="w-5 h-5 text-zinc-400" />
            Date and Time Picker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showDate && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Calendar className="w-4 h-4" />
              <span>{currentTime.toLocaleDateString()}</span>
            </div>
          )}
          
          <TimeDisplay />
          
          <div className="mt-4">
            <TimeInputs />
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => {
                  const now = new Date();
                  setCurrentTime(now);
                  onChange?.(now);
                }}
                variant="outline"
                size="sm"
                className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700"
              >
                Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DateTimePicker;