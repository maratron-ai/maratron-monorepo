import { formatDateSafe, formatRelativeTime } from '../time/formatDate';

describe('formatDate utilities', () => {
  describe('formatDateSafe', () => {
    it('should format date consistently for server (UTC)', () => {
      const date = '2025-01-15T10:30:00Z';
      const result = formatDateSafe(date, true);
      expect(result).toContain('UTC');
      expect(result).toMatch(/\w+ \d+, \d+, \d+:\d+ [AP]M UTC/);
    });

    it('should format date for client (local timezone)', () => {
      const date = '2025-01-15T10:30:00Z';
      const result = formatDateSafe(date, false);
      expect(result).not.toContain('UTC');
      expect(result).toMatch(/\w+ \d+, \d+, \d+:\d+ [AP]M/);
    });

    it('should handle Date objects', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      const result = formatDateSafe(date, true);
      expect(result).toContain('UTC');
    });

    it('should handle invalid dates gracefully', () => {
      const result = formatDateSafe('invalid-date', true);
      expect(result).toBe('Invalid Date UTC');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      // Set a fixed time for testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return "Just now" for very recent dates', () => {
      const recent = new Date('2025-01-15T11:59:30Z');
      expect(formatRelativeTime(recent)).toBe('Just now');
    });

    it('should return minutes for recent dates', () => {
      const fiveMinutesAgo = new Date('2025-01-15T11:55:00Z');
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
    });

    it('should return hours for same day', () => {
      const twoHoursAgo = new Date('2025-01-15T10:00:00Z');
      expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
    });

    it('should return days for recent days', () => {
      const threeDaysAgo = new Date('2025-01-12T12:00:00Z');
      expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
    });

    it('should return formatted date for old dates', () => {
      const oldDate = new Date('2024-01-15T12:00:00Z');
      const result = formatRelativeTime(oldDate);
      expect(result).toMatch(/Jan 15, 2024/);
    });
  });
});