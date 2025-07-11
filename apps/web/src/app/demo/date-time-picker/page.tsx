"use client";

import { useState } from "react";
import { DateTimePicker } from "@components/ui/date-time-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";

export default function DateTimePickerDemo() {
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [showDemo2, setShowDemo2] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Date and Time Picker Demo
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Interactive date and time picker component with dark theme styling.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Main Demo */}
          <div className="space-y-6">
            <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
                  Primary Demo
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Click on the time display to access editing controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DateTimePicker
                  value={selectedDateTime}
                  onChange={setSelectedDateTime}
                  showDate={true}
                  showSeconds={true}
                  format12Hour={true}
                />
              </CardContent>
            </Card>

            {/* Selected Value Display */}
            <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-zinc-900 dark:text-zinc-100">
                  Selected Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Full Date/Time:</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100">
                      {selectedDateTime.toString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">ISO String:</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100">
                      {selectedDateTime.toISOString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Timestamp:</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100">
                      {selectedDateTime.getTime()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Variations */}
          <div className="space-y-6">
            <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
                  Component Variations
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Different configurations of the date/time picker
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* 24-Hour Format */}
                <div>
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
                    24-Hour Format (No Seconds)
                  </h3>
                  <DateTimePicker
                    value={new Date()}
                    showDate={false}
                    showSeconds={false}
                    format12Hour={false}
                  />
                </div>

                {/* Time Only */}
                <div>
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
                    Time Only (12-Hour)
                  </h3>
                  <DateTimePicker
                    value={new Date()}
                    showDate={false}
                    showSeconds={true}
                    format12Hour={true}
                  />
                </div>

              </CardContent>
            </Card>

            {/* Controls */}
            <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-zinc-900 dark:text-zinc-100">
                  Demo Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setSelectedDateTime(new Date())}
                  className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                >
                  Reset to Current Time
                </Button>
                
                <Button
                  onClick={() => {
                    const newTime = new Date();
                    newTime.setHours(5, 20, 2); // Set to match the image: 05:20:02
                    setSelectedDateTime(newTime);
                  }}
                  variant="outline"
                  className="w-full border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Set to 05:20:02 AM
                </Button>

                <Button
                  onClick={() => {
                    const randomTime = new Date();
                    randomTime.setHours(
                      Math.floor(Math.random() * 24),
                      Math.floor(Math.random() * 60),
                      Math.floor(Math.random() * 60)
                    );
                    setSelectedDateTime(randomTime);
                  }}
                  variant="outline"
                  className="w-full border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Random Time
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Usage Example */}
        <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm mt-8">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
              Usage Example
            </CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">
              How to use the DateTimePicker component in your code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg overflow-x-auto text-sm">
              <code className="text-zinc-900 dark:text-zinc-100">{`import { DateTimePicker } from "@components/ui/date-time-picker";

const [selectedTime, setSelectedTime] = useState(new Date());

<DateTimePicker
  value={selectedTime}
  onChange={setSelectedTime}
  showDate={true}
  showSeconds={true}
  format12Hour={true}
/>`}</code>
            </pre>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}