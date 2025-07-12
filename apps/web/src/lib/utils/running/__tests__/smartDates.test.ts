import {
  calculateWeeksBetweenDates,
  calculateStartNowWeeks,
  validatePlanLength,
  adjustEndDateToMaintainWeeks,
  adjustStartDateToMaintainWeeks,
  getStartNowButtonText
} from '../smartDates';

describe('smartDates utilities', () => {
  describe('calculateWeeksBetweenDates', () => {
    it('calculates weeks between dates correctly', () => {
      // Exactly 1 week
      expect(calculateWeeksBetweenDates('2024-03-01', '2024-03-08')).toBe(1);
      
      // Exactly 2 weeks  
      expect(calculateWeeksBetweenDates('2024-03-01', '2024-03-15')).toBe(2);
      
      // Partial weeks round down
      expect(calculateWeeksBetweenDates('2024-03-01', '2024-03-10')).toBe(1);
      
      // Longer periods
      expect(calculateWeeksBetweenDates('2024-01-01', '2024-04-01')).toBe(13);
      
      // Same date
      expect(calculateWeeksBetweenDates('2024-03-01', '2024-03-01')).toBe(0);
    });

    it('handles end date before start date', () => {
      expect(calculateWeeksBetweenDates('2024-03-08', '2024-03-01')).toBe(0);
    });

    it('handles leap year correctly', () => {
      expect(calculateWeeksBetweenDates('2024-02-01', '2024-03-01')).toBe(4);
    });

    it('works with Date objects', () => {
      const start = new Date('2024-03-01');
      const end = new Date('2024-03-08');
      expect(calculateWeeksBetweenDates(start, end)).toBe(1);
    });
  });

  describe('calculateStartNowWeeks', () => {
    const mockToday = '2024-03-15';

    it('calculates weeks when starting today', () => {
      // Race date 2 weeks from today
      expect(calculateStartNowWeeks('2024-03-29', mockToday)).toBe(2);
      
      // Race date 8 weeks from today
      expect(calculateStartNowWeeks('2024-05-10', mockToday)).toBe(8);
      
      // Race date tomorrow (less than 1 week)
      expect(calculateStartNowWeeks('2024-03-16', mockToday)).toBe(0);
    });

    it('returns 0 for race dates in the past', () => {
      expect(calculateStartNowWeeks('2024-03-10', mockToday)).toBe(0);
      expect(calculateStartNowWeeks('2024-02-01', mockToday)).toBe(0);
    });

    it('uses current date when today not provided', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14); // 2 weeks from now
      const futureDateStr = futureDate.toISOString().slice(0, 10);
      
      expect(calculateStartNowWeeks(futureDateStr)).toBe(2);
    });
  });

  describe('validatePlanLength', () => {
    it('validates normal plan lengths', () => {
      const result = validatePlanLength(12);
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('');
    });

    it('warns about very short plans', () => {
      const result = validatePlanLength(2);
      expect(result.isValid).toBe(true);
      expect(result.severity).toBe('warning');
      expect(result.message).toContain('very short');
    });

    it('warns about very long plans', () => {
      const result = validatePlanLength(40);
      expect(result.isValid).toBe(true);
      expect(result.severity).toBe('warning');
      expect(result.message).toContain('long plan');
    });

    it('marks single week plans as valid with warning', () => {
      const result = validatePlanLength(1);
      expect(result.isValid).toBe(true);
      expect(result.severity).toBe('warning');
      expect(result.message).toContain('minimum recommended');
    });

    it('marks zero or negative weeks as invalid', () => {
      expect(validatePlanLength(0).isValid).toBe(false);
      expect(validatePlanLength(-1).isValid).toBe(false);
    });

    it('marks extremely long plans as invalid', () => {
      const result = validatePlanLength(55);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('maximum');
    });
  });

  describe('adjustEndDateToMaintainWeeks', () => {
    it('calculates new end date when start date changes', () => {
      const result = adjustEndDateToMaintainWeeks('2024-03-15', 12);
      expect(result).toBe('2024-06-07');
    });

    it('handles different week counts', () => {
      expect(adjustEndDateToMaintainWeeks('2024-01-01', 8)).toBe('2024-02-26');
      expect(adjustEndDateToMaintainWeeks('2024-01-01', 16)).toBe('2024-04-22');
    });

    it('works across year boundaries', () => {
      const result = adjustEndDateToMaintainWeeks('2024-12-01', 8);
      expect(result).toBe('2025-01-26');
    });

    it('handles leap year correctly', () => {
      const result = adjustEndDateToMaintainWeeks('2024-02-01', 4);
      expect(result).toBe('2024-02-29');
    });
  });

  describe('adjustStartDateToMaintainWeeks', () => {
    it('calculates new start date when end date changes', () => {
      const result = adjustStartDateToMaintainWeeks('2024-06-07', 12);
      expect(result).toBe('2024-03-15');
    });

    it('handles different week counts', () => {
      expect(adjustStartDateToMaintainWeeks('2024-02-26', 8)).toBe('2024-01-01');
      expect(adjustStartDateToMaintainWeeks('2024-04-22', 16)).toBe('2024-01-01');
    });

    it('works across year boundaries', () => {
      const result = adjustStartDateToMaintainWeeks('2025-01-26', 8);
      expect(result).toBe('2024-12-01');
    });
  });

  describe('getStartNowButtonText', () => {
    const mockToday = '2024-03-15';

    it('shows correct text for normal cases', () => {
      const result = getStartNowButtonText('2024-05-10', 12, mockToday);
      expect(result.text).toBe('Start now: makes plan 8 weeks');
      expect(result.isDisabled).toBe(false);
      expect(result.weeks).toBe(8);
    });

    it('shows warning for very short plans', () => {
      const result = getStartNowButtonText('2024-03-22', 12, mockToday);
      expect(result.text).toBe('Start now: makes plan 1 week');
      expect(result.isDisabled).toBe(false);
      expect(result.severity).toBe('warning');
      expect(result.message).toContain('very short');
    });

    it('disables button for past race dates', () => {
      const result = getStartNowButtonText('2024-03-10', 12, mockToday);
      expect(result.text).toBe('Race date has passed');
      expect(result.isDisabled).toBe(true);
      expect(result.weeks).toBe(0);
    });

    it('handles same day race', () => {
      const result = getStartNowButtonText(mockToday, 12, mockToday);
      expect(result.text).toBe('Race is today');
      expect(result.isDisabled).toBe(true);
    });

    it('shows appropriate text for tomorrow race', () => {
      const result = getStartNowButtonText('2024-03-16', 12, mockToday);
      expect(result.text).toBe('Start now: makes plan 0 weeks');
      expect(result.isDisabled).toBe(false);
      expect(result.severity).toBe('warning');
    });
  });

  describe('edge cases', () => {
    it('handles month boundaries correctly', () => {
      // January 31 + 4 weeks should be February 28 (not Feb 31)
      expect(adjustEndDateToMaintainWeeks('2024-01-31', 4)).toBe('2024-02-28');
    });

    it('handles daylight saving time transitions', () => {
      // Test around DST transition dates
      const result = calculateWeeksBetweenDates('2024-03-08', '2024-03-15');
      expect(result).toBe(1);
    });

    it('handles invalid date strings gracefully', () => {
      expect(() => calculateWeeksBetweenDates('invalid', '2024-03-01')).toThrow();
      expect(() => calculateWeeksBetweenDates('2024-03-01', 'invalid')).toThrow();
    });

    it('handles very large week numbers', () => {
      const result = validatePlanLength(100);
      expect(result.isValid).toBe(false);
    });

    it('handles decimal week numbers', () => {
      const result = validatePlanLength(12.5);
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('');
    });
  });

  describe('consistency with existing planDates utilities', () => {
    it('produces dates compatible with assignDatesToPlan', () => {
      // Test that our new utilities work with existing date assignment logic
      const startDate = '2024-03-01';
      const weeks = 12;
      const endDate = adjustEndDateToMaintainWeeks(startDate, weeks);
      
      // Verify the calculation is consistent
      const calculatedWeeks = calculateWeeksBetweenDates(startDate, endDate);
      expect(calculatedWeeks).toBe(weeks);
    });

    it('maintains UTC consistency', () => {
      // Ensure all date calculations use UTC to avoid timezone issues
      const result = adjustEndDateToMaintainWeeks('2024-03-01', 1);
      expect(result).toBe('2024-03-08');
    });
  });
});