// Example usage of the DatePicker component

import React, { useState } from "react";
import { DatePicker } from "./date-picker";

export function DatePickerExamples() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);

  return (
    <div className="space-y-6 p-6 max-w-md">
      <h2 className="text-lg font-semibold">DatePicker Examples</h2>
      
      {/* Basic usage */}
      <DatePicker
        value={selectedDate}
        onChange={setSelectedDate}
        label="Event Date"
        placeholder="Choose a date"
      />
      
      {/* With custom styling */}
      <DatePicker
        value={birthDate}
        onChange={setBirthDate}
        label="Birth Date"
        placeholder="Select your birth date"
        className="max-w-xs"
        id="birth-date"
      />
      
      {/* Disabled state */}
      <DatePicker
        value={deadline}
        onChange={setDeadline}
        label="Project Deadline"
        placeholder="Coming soon..."
        disabled={true}
      />
      
      {/* Without label */}
      <DatePicker
        value={selectedDate}
        onChange={setSelectedDate}
        placeholder="Pick any date"
      />
      
      {/* Display selected values */}
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Selected Event Date: {selectedDate?.toLocaleDateString() || "None"}</p>
        <p>Birth Date: {birthDate?.toLocaleDateString() || "None"}</p>
        <p>Deadline: {deadline?.toLocaleDateString() || "Disabled"}</p>
      </div>
    </div>
  );
}

// Simple form example
export function DatePickerForm() {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', { startDate, endDate });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 max-w-md">
      <h3 className="text-lg font-semibold">Date Range Form</h3>
      
      <DatePicker
        value={startDate}
        onChange={setStartDate}
        label="Start Date"
        placeholder="Select start date"
        id="start-date"
      />
      
      <DatePicker
        value={endDate}
        onChange={setEndDate}
        label="End Date"
        placeholder="Select end date"
        id="end-date"
      />
      
      <button
        type="submit"
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        disabled={!startDate || !endDate}
      >
        Submit
      </button>
    </form>
  );
}