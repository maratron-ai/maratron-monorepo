"use client";

import React, { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  label,
  disabled = false,
  className = "",
  id,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = (date: Date) => {
    onChange?.(date);
    setIsOpen(false);
  };

  const handleMonthChange = (monthIndex: number) => {
    const newDate = new Date(value || new Date());
    newDate.setMonth(monthIndex);
    onChange?.(newDate);
  };

  const handleYearChange = (year: number) => {
    const newDate = new Date(value || new Date());
    newDate.setFullYear(year);
    onChange?.(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(value || new Date());
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    onChange?.(newDate);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </Label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className="w-full justify-between text-left font-normal h-10"
            aria-label={label || "Select date"}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            disabled={disabled}
          >
            <span>{value ? value.toLocaleDateString() : placeholder}</span>
            <ChevronDownIcon className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg rounded-lg" 
          align="start"
          sideOffset={4}
        >
          <div className="p-4 space-y-4">
            {/* Month/Year Controls */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-accent"
                onClick={() => navigateMonth('prev')}
                aria-label="Previous month"
              >
                <ChevronDownIcon className="h-4 w-4 rotate-90" />
              </Button>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select 
                    className="bg-background border border-input rounded px-3 py-1 pr-8 text-sm font-medium min-w-[100px] appearance-none cursor-pointer"
                    value={value?.getMonth() || new Date().getMonth()}
                    onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                    aria-label="Select month"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>
                        {new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 pointer-events-none opacity-50" />
                </div>
                
                <div className="relative">
                  <select 
                    className="bg-background border border-input rounded px-3 py-1 pr-8 text-sm font-medium min-w-[80px] appearance-none cursor-pointer"
                    value={value?.getFullYear() || new Date().getFullYear()}
                    onChange={(e) => handleYearChange(parseInt(e.target.value))}
                    aria-label="Select year"
                  >
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDownIcon className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 pointer-events-none opacity-50" />
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-accent"
                onClick={() => navigateMonth('next')}
                aria-label="Next month"
              >
                <ChevronDownIcon className="h-4 w-4 -rotate-90" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div
                    key={day}
                    className="h-8 w-8 text-xs font-medium text-muted-foreground flex items-center justify-center"
                  >
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const currentDate = value || new Date();
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth();
                  
                  // Get first day of month and how many days
                  const firstDay = new Date(year, month, 1);
                  const lastDay = new Date(year, month + 1, 0);
                  const daysInMonth = lastDay.getDate();
                  const startingDayOfWeek = firstDay.getDay();
                  
                  // Get days from previous month
                  const prevMonth = new Date(year, month - 1, 0);
                  const daysInPrevMonth = prevMonth.getDate();
                  
                  const days = [];
                  
                  // Previous month days (muted)
                  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
                    const day = daysInPrevMonth - i;
                    days.push(
                      <button
                        key={`prev-${day}`}
                        className="h-8 w-8 text-sm text-zinc-300 dark:text-zinc-700 opacity-50 hover:bg-accent hover:text-accent-foreground hover:opacity-100 hover:scale-110 hover:shadow-md rounded-md transition-all duration-200"
                        onClick={() => handleDateSelect(new Date(year, month - 1, day))}
                      >
                        {day}
                      </button>
                    );
                  }
                  
                  // Current month days
                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    const isSelected = value && 
                      date.getDate() === value.getDate() && 
                      date.getMonth() === value.getMonth() && 
                      date.getFullYear() === value.getFullYear();
                    const isToday = 
                      date.toDateString() === new Date().toDateString();
                    
                    days.push(
                      <button
                        key={`current-${day}`}
                        className={`h-8 w-8 text-sm rounded-md transition-all duration-200 relative ${
                          isSelected
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 hover:scale-105 font-semibold shadow-sm hover:shadow-lg'
                            : isToday
                            ? 'bg-accent text-accent-foreground hover:bg-accent/80 hover:scale-110 hover:shadow-md font-bold'
                            : 'hover:bg-accent hover:text-accent-foreground hover:scale-110 hover:shadow-md'
                        }`}
                        onClick={() => handleDateSelect(date)}
                        aria-label={`Select ${date.toLocaleDateString()}`}
                      >
                        {day}
                      </button>
                    );
                  }
                  
                  // Next month days to fill the grid (muted)
                  const totalCells = 42; // 6 weeks * 7 days
                  const remainingCells = totalCells - days.length;
                  for (let day = 1; day <= remainingCells; day++) {
                    days.push(
                      <button
                        key={`next-${day}`}
                        className="h-8 w-8 text-sm text-zinc-300 dark:text-zinc-700 opacity-50 hover:bg-accent hover:text-accent-foreground hover:opacity-100 hover:scale-110 hover:shadow-md rounded-md transition-all duration-200"
                        onClick={() => handleDateSelect(new Date(year, month + 1, day))}
                      >
                        {day}
                      </button>
                    );
                  }
                  
                  return days;
                })()}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}