/**
 * Browser timezone detection utility
 * Gets the user's actual timezone using the Intl API
 */

/**
 * Get the user's timezone using browser APIs
 * @returns IANA timezone identifier (e.g., "America/New_York")
 */
export function getUserTimezone(): string {
  try {
    // Use Intl.DateTimeFormat to get the user's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Validate that we got a reasonable timezone
    if (timezone && timezone.includes('/')) {
      return timezone;
    }
    
    // Fallback to UTC if timezone detection fails
    console.warn('Failed to detect user timezone, falling back to UTC');
    return 'UTC';
  } catch (error) {
    console.error('Error detecting user timezone:', error);
    return 'UTC';
  }
}

/**
 * Get timezone offset in minutes (for compatibility)
 * @returns Timezone offset in minutes from UTC
 */
export function getTimezoneOffset(): number {
  try {
    return new Date().getTimezoneOffset();
  } catch (error) {
    console.error('Error getting timezone offset:', error);
    return 0; // UTC
  }
}

/**
 * Get user-friendly timezone display name
 * @param timezone IANA timezone identifier
 * @returns Human-readable timezone name
 */
export function getTimezoneDisplayName(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'long'
    });
    
    const parts = formatter.formatToParts(now);
    const timeZoneName = parts.find(part => part.type === 'timeZoneName');
    
    return timeZoneName?.value || timezone;
  } catch (error) {
    console.error('Error getting timezone display name:', error);
    return timezone;
  }
}

/**
 * Validate if a timezone is valid
 * @param timezone IANA timezone identifier to validate
 * @returns true if timezone is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}