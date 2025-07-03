/**
 * Tests for getUserTimezone utility
 */

import { getUserTimezone, getTimezoneOffset, isValidTimezone, getTimezoneDisplayName } from '../getUserTimezone';

// Mock Intl.DateTimeFormat for consistent testing
const mockDateTimeFormat = {
  resolvedOptions: jest.fn(),
  formatToParts: jest.fn()
};

global.Intl = {
  ...global.Intl,
  DateTimeFormat: jest.fn(() => mockDateTimeFormat) as typeof Intl.DateTimeFormat
};

describe('getUserTimezone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console methods
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return user timezone when Intl API works correctly', () => {
    mockDateTimeFormat.resolvedOptions.mockReturnValue({
      timeZone: 'America/New_York'
    });

    const timezone = getUserTimezone();
    expect(timezone).toBe('America/New_York');
  });

  it('should return UTC when timezone detection fails', () => {
    mockDateTimeFormat.resolvedOptions.mockReturnValue({
      timeZone: 'UTC'
    });

    const timezone = getUserTimezone();
    expect(timezone).toBe('UTC');
  });

  it('should return UTC when timezone is invalid format', () => {
    mockDateTimeFormat.resolvedOptions.mockReturnValue({
      timeZone: 'InvalidTimezone'
    });

    const timezone = getUserTimezone();
    expect(timezone).toBe('UTC');
    expect(console.warn).toHaveBeenCalledWith('Failed to detect user timezone, falling back to UTC');
  });

  it('should return UTC when Intl API throws error', () => {
    mockDateTimeFormat.resolvedOptions.mockImplementation(() => {
      throw new Error('Intl API error');
    });

    const timezone = getUserTimezone();
    expect(timezone).toBe('UTC');
    expect(console.error).toHaveBeenCalledWith('Error detecting user timezone:', expect.any(Error));
  });
});

describe('getTimezoneOffset', () => {
  it('should return timezone offset in minutes', () => {
    const mockDate = new Date('2024-01-15T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as Date);
    mockDate.getTimezoneOffset = jest.fn().mockReturnValue(-300); // EST offset

    const offset = getTimezoneOffset();
    expect(offset).toBe(-300);
  });

  it('should return 0 when Date API throws error', () => {
    jest.spyOn(global, 'Date').mockImplementation(() => {
      throw new Error('Date API error');
    });

    const offset = getTimezoneOffset();
    expect(offset).toBe(0);
    expect(console.error).toHaveBeenCalledWith('Error getting timezone offset:', expect.any(Error));
  });
});

describe('isValidTimezone', () => {
  it('should return true for valid timezone', () => {
    (global.Intl.DateTimeFormat as jest.Mock).mockImplementation(() => ({}));
    
    const isValid = isValidTimezone('America/New_York');
    expect(isValid).toBe(true);
  });

  it('should return false for invalid timezone', () => {
    (global.Intl.DateTimeFormat as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid timezone');
    });
    
    const isValid = isValidTimezone('Invalid/Timezone');
    expect(isValid).toBe(false);
  });
});

describe('getTimezoneDisplayName', () => {
  it('should return display name for valid timezone', () => {
    mockDateTimeFormat.formatToParts.mockReturnValue([
      { type: 'timeZoneName', value: 'Eastern Standard Time' }
    ]);
    
    const displayName = getTimezoneDisplayName('America/New_York');
    expect(displayName).toBe('Eastern Standard Time');
  });

  it('should return timezone identifier when formatToParts fails', () => {
    mockDateTimeFormat.formatToParts.mockImplementation(() => {
      throw new Error('Format error');
    });
    
    const displayName = getTimezoneDisplayName('America/New_York');
    expect(displayName).toBe('America/New_York');
    expect(console.error).toHaveBeenCalledWith('Error getting timezone display name:', expect.any(Error));
  });
});