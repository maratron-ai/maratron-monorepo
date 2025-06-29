// src/lib/utils/time.ts

/**
 * Returns a string for <input type="datetime-local">
 * reflecting the user's local timezone.
 */
export function getLocalDateTime(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}
