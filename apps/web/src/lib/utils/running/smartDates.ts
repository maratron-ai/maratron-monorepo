/**
 * Smart date utilities for training plan date management
 * Provides functionality for "start now" button and smart date editing
 */

export interface PlanLengthValidation {
  isValid: boolean;
  severity?: 'warning' | 'error';
  message: string;
}

export interface StartNowButtonState {
  text: string;
  isDisabled: boolean;
  weeks: number;
  severity?: 'warning' | 'error';
  message?: string;
}

/**
 * Parse date to UTC Date object for consistent calculations
 */
function parseDateUTC(date: string | Date): Date {
  if (date instanceof Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }
  // Treat plain dates as UTC to avoid timezone offsets
  const dateStr = typeof date === 'string' ? date : date.toISOString();
  const parsed = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00Z`);
  
  // Check for invalid dates
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  
  return parsed;
}

/**
 * Add weeks to a date
 */
function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + (weeks * 7));
  return result;
}

/**
 * Calculate the number of complete weeks between two dates
 */
export function calculateWeeksBetweenDates(
  startDate: string | Date, 
  endDate: string | Date
): number {
  const start = parseDateUTC(startDate);
  const end = parseDateUTC(endDate);
  
  if (end < start) {
    return 0;
  }
  
  const diffMs = end.getTime() - start.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.floor(diffDays / 7);
}

/**
 * Calculate how many weeks a plan would be if starting today for the given race date
 */
export function calculateStartNowWeeks(
  raceDate: string | Date,
  today?: string | Date
): number {
  const todayDate = today ? parseDateUTC(today) : parseDateUTC(new Date());
  return calculateWeeksBetweenDates(todayDate, raceDate);
}

/**
 * Validate if a plan length is reasonable and provide user feedback
 */
export function validatePlanLength(weeks: number): PlanLengthValidation {
  if (weeks <= 0) {
    return {
      isValid: false,
      severity: 'error',
      message: 'Plan must be at least 1 week long'
    };
  }
  
  if (weeks > 52) {
    return {
      isValid: false,
      severity: 'error',
      message: 'Plan cannot exceed 52 weeks (maximum supported length)'
    };
  }
  
  if (weeks === 1) {
    return {
      isValid: true,
      severity: 'warning',
      message: 'This is a very short plan shorter than the minimum recommended 4-week plan length'
    };
  }
  
  if (weeks < 4) {
    return {
      isValid: true,
      severity: 'warning',
      message: 'This is a very short plan. Consider a longer training period for better results'
    };
  }
  
  if (weeks > 30) {
    return {
      isValid: true,
      severity: 'warning',
      message: 'This is a very long plan. Consider breaking it into phases'
    };
  }
  
  return {
    isValid: true,
    message: ''
  };
}

/**
 * Calculate new end date when start date changes, maintaining the same number of weeks
 */
export function adjustEndDateToMaintainWeeks(
  startDate: string | Date,
  weeks: number
): string {
  const start = parseDateUTC(startDate);
  const end = addWeeks(start, weeks);
  return end.toISOString().slice(0, 10);
}

/**
 * Calculate new start date when end date changes, maintaining the same number of weeks  
 */
export function adjustStartDateToMaintainWeeks(
  endDate: string | Date,
  weeks: number
): string {
  const end = parseDateUTC(endDate);
  const start = addWeeks(end, -weeks);
  return start.toISOString().slice(0, 10);
}

/**
 * Get the most recent Sunday (could be today if today is Sunday, or in the past)
 */
export function getMostRecentSunday(date?: string | Date): string {
  const d = date ? parseDateUTC(date) : parseDateUTC(new Date());
  const dayOfWeek = d.getUTCDay(); // 0 = Sunday
  const daysBack = dayOfWeek; // Sunday=0, Monday=1, etc.
  const sunday = new Date(d);
  sunday.setUTCDate(d.getUTCDate() - daysBack);
  return sunday.toISOString().slice(0, 10);
}

/**
 * Get the next Sunday after the given date (never today, always future)
 */
export function getNextSunday(date?: string | Date): string {
  const d = date ? parseDateUTC(date) : parseDateUTC(new Date());
  const dayOfWeek = d.getUTCDay(); // 0 = Sunday
  const daysToAdd = dayOfWeek === 0 ? 7 : (7 - dayOfWeek); // Always get next Sunday
  const sunday = new Date(d);
  sunday.setUTCDate(d.getUTCDate() + daysToAdd);
  return sunday.toISOString().slice(0, 10);
}

/**
 * Calculate smart start date for "Start Now" functionality
 * Rules:
 * - Sunday-Wednesday: Start on most recent Sunday (could be past)
 * - Thursday-Saturday: Start today
 */
export function calculateSmartStartDate(today?: string | Date): string {
  const d = today ? parseDateUTC(today) : parseDateUTC(new Date());
  const dayOfWeek = d.getUTCDay(); // 0 = Sunday, 6 = Saturday
  
  if (dayOfWeek <= 3) { // Sunday, Monday, Tuesday, Wednesday
    return getMostRecentSunday(d);
  } else { // Thursday, Friday, Saturday
    return d.toISOString().slice(0, 10);
  }
}

/**
 * Calculate the duration of the first week in days for smart start
 * This represents how many days until the next Sunday (end of extended first week)
 */
export function calculateFirstWeekDuration(startDate: string | Date): number {
  const start = parseDateUTC(startDate);
  const nextSunday = parseDateUTC(getNextSunday(startDate));
  
  const diffMs = nextSunday.getTime() - start.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  // For Smart Start Now, the first week extends to the next Sunday
  // So if we start Thursday, we get Thu+Fri+Sat+Sun+Mon+Tue+Wed+Thu+Fri+Sat = 10 days to next Sun
  return diffDays === 0 ? 7 : diffDays; // If start date is Sunday, treat as 7-day week
}

/**
 * Get the text and state for the "start now" button
 */
export function getStartNowButtonText(
  raceDate: string | Date,
  originalWeeks: number,
  today?: string | Date
): StartNowButtonState {
  const todayDate = today ? parseDateUTC(today) : parseDateUTC(new Date());
  const race = parseDateUTC(raceDate);
  
  // Check if race date is today
  if (race.toISOString().slice(0, 10) === todayDate.toISOString().slice(0, 10)) {
    return {
      text: 'Race is today',
      isDisabled: true,
      weeks: 0
    };
  }
  
  // Check if race date is in the past
  if (race < todayDate) {
    return {
      text: 'Race date has passed',
      isDisabled: true,
      weeks: 0
    };
  }
  
  const weeks = calculateStartNowWeeks(raceDate, today);
  
  // Special handling for 0 weeks (race tomorrow) - allow but warn
  if (weeks === 0) {
    return {
      text: `Start now: makes plan ${weeks} week${weeks === 1 ? '' : 's'}`,
      isDisabled: false,
      weeks,
      severity: 'warning',
      message: 'This is a very short plan. Consider a longer training period for better results'
    };
  }
  
  const validation = validatePlanLength(weeks);
  
  return {
    text: `Start now: makes plan ${weeks} week${weeks === 1 ? '' : 's'}`,
    isDisabled: false,
    weeks,
    severity: validation.severity,
    message: validation.message
  };
}