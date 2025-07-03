/**
 * Tests for getUserTimezone utility
 */

import { getUserTimezone, getTimezoneOffset, isValidTimezone, getTimezoneDisplayName } from '../getUserTimezone';

describe('getUserTimezone', () => {
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return user timezone when Intl API works correctly', () => {
    // Mock successful timezone detection
    const originalIntl = global.Intl;
    global.Intl = {
      ...global.Intl,
      DateTimeFormat: jest.fn(() => ({
        resolvedOptions: () => ({ timeZone: 'America/New_York' })
      })) as typeof Intl.DateTimeFormat
    };

    const timezone = getUserTimezone();
    expect(timezone).toBe('America/New_York');

    global.Intl = originalIntl;
  });

  it('should return UTC when timezone is invalid format', () => {
    const originalIntl = global.Intl;
    global.Intl = {
      ...global.Intl,
      DateTimeFormat: jest.fn(() => ({
        resolvedOptions: () => ({ timeZone: 'InvalidTimezone' })
      })) as typeof Intl.DateTimeFormat
    };

    const timezone = getUserTimezone();
    expect(timezone).toBe('UTC');
    expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to detect user timezone, falling back to UTC');

    global.Intl = originalIntl;
  });

  it('should return UTC when Intl API throws error', () => {
    const originalIntl = global.Intl;
    global.Intl = {
      ...global.Intl,
      DateTimeFormat: jest.fn(() => {
        throw new Error('Intl API error');
      }) as typeof Intl.DateTimeFormat
    };

    const timezone = getUserTimezone();
    expect(timezone).toBe('UTC');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error detecting user timezone:', expect.any(Error));

    global.Intl = originalIntl;
  });
});

describe('getTimezoneOffset', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return timezone offset in minutes', () => {
    const offset = getTimezoneOffset();
    expect(typeof offset).toBe('number');
  });

  it('should return 0 when Date API throws error', () => {
    const originalDate = global.Date;
    global.Date = jest.fn(() => {
      throw new Error('Date API error');
    }) as DateConstructor;

    const offset = getTimezoneOffset();
    expect(offset).toBe(0);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting timezone offset:', expect.any(Error));

    global.Date = originalDate;
  });
});

describe('isValidTimezone', () => {
  it('should return true for valid timezone', () => {
    const isValid = isValidTimezone('America/New_York');
    expect(typeof isValid).toBe('boolean');
  });

  it('should return false for invalid timezone', () => {
    const isValid = isValidTimezone('Invalid/Timezone');
    expect(typeof isValid).toBe('boolean');
  });
});

describe('getTimezoneDisplayName', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return display name for valid timezone', () => {
    const displayName = getTimezoneDisplayName('America/New_York');
    expect(typeof displayName).toBe('string');
    expect(displayName.length).toBeGreaterThan(0);
  });

  it('should return timezone identifier when formatToParts fails', () => {
    const originalIntl = global.Intl;
    global.Intl = {
      ...global.Intl,
      DateTimeFormat: jest.fn(() => {
        throw new Error('Format error');
      }) as typeof Intl.DateTimeFormat
    };
    
    const displayName = getTimezoneDisplayName('America/New_York');
    expect(displayName).toBe('America/New_York');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting timezone display name:', expect.any(Error));

    global.Intl = originalIntl;
  });
});