import { calculateWeeksBetweenDates } from '@utils/running/smartDates';

describe('PlanGenerator Start Now functionality', () => {
  describe('Week calculation', () => {
    it('should calculate correct weeks from today to race date', () => {
      const today = '2024-03-01';
      const raceDate = '2024-06-01';
      
      const weeks = calculateWeeksBetweenDates(today, raceDate);
      
      // From March 1 to June 1 is approximately 13 weeks
      expect(weeks).toBe(13);
    });
    
    it('should handle race date very close to today', () => {
      const today = '2024-03-01';
      const raceDate = '2024-03-08'; // 1 week later
      
      const weeks = calculateWeeksBetweenDates(today, raceDate);
      
      expect(weeks).toBe(1);
    });
    
    it('should handle race date same as today', () => {
      const today = '2024-03-01';
      const raceDate = '2024-03-01';
      
      const weeks = calculateWeeksBetweenDates(today, raceDate);
      
      expect(weeks).toBe(0);
    });
    
    it('should handle race date in past', () => {
      const today = '2024-03-01';
      const raceDate = '2024-02-01'; // Past date
      
      const weeks = calculateWeeksBetweenDates(today, raceDate);
      
      expect(weeks).toBe(0);
    });
    
    it('should calculate weeks for longer plans', () => {
      const today = '2024-01-01';
      const raceDate = '2024-07-01'; // 6 months later
      
      const weeks = calculateWeeksBetweenDates(today, raceDate);
      
      // From Jan 1 to July 1 is approximately 26 weeks
      expect(weeks).toBe(26);
    });
  });
  
  describe('Start Now validation scenarios', () => {
    it('should provide appropriate feedback for very short plans', () => {
      const today = '2024-03-01';
      const raceDateTomorrow = '2024-03-02';
      
      const weeks = calculateWeeksBetweenDates(today, raceDateTomorrow);
      
      // Should be 0 weeks, which would trigger validation warning
      expect(weeks).toBe(0);
    });
    
    it('should handle typical marathon training scenarios', () => {
      const today = '2024-01-15';
      const marathonDate = '2024-05-15'; // ~17 weeks later
      
      const weeks = calculateWeeksBetweenDates(today, marathonDate);
      
      // Should be adequate time for marathon training
      expect(weeks).toBeGreaterThan(12);
      expect(weeks).toBeLessThan(20);
    });
  });
});