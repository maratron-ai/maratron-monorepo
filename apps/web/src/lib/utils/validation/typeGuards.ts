/**
 * Type guards and validation utilities for defensive programming
 */

/**
 * Check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Check if a value is a valid array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Check if a value is a valid date string or Date object
 */
export function isValidDate(value: unknown): value is string | Date {
  if (!value) return false;
  const date = new Date(value as string | Date);
  return !isNaN(date.getTime());
}

/**
 * Check if an object has a specific property that is not null/undefined
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  prop: K
): obj is T & Record<K, NonNullable<unknown>> {
  return obj != null && prop in obj && (obj as Record<PropertyKey, unknown>)[prop] != null;
}

/**
 * Safe string methods that handle null/undefined gracefully
 */
export const safeString = {
  toLowerCase: (str: unknown): string => {
    return isNonEmptyString(str) ? str.toLowerCase() : '';
  },
  
  toUpperCase: (str: unknown): string => {
    return isNonEmptyString(str) ? str.toUpperCase() : '';
  },
  
  split: (str: unknown, separator: string): string[] => {
    return isNonEmptyString(str) ? str.split(separator) : [];
  },
  
  slice: (str: unknown, start: number, end?: number): string => {
    return isNonEmptyString(str) ? str.slice(start, end) : '';
  }
};

/**
 * Safe array methods that handle null/undefined gracefully
 */
export const safeArray = {
  filter: <T>(arr: unknown, predicate: (item: T) => boolean): T[] => {
    return isArray(arr) ? (arr as T[]).filter(predicate) : [];
  },
  
  map: <T, U>(arr: unknown, mapper: (item: T) => U): U[] => {
    return isArray(arr) ? (arr as T[]).map(mapper) : [];
  },
  
  find: <T>(arr: unknown, predicate: (item: T) => boolean): T | undefined => {
    return isArray(arr) ? (arr as T[]).find(predicate) : undefined;
  },
  
  length: (arr: unknown): number => {
    return isArray(arr) ? arr.length : 0;
  }
};

/**
 * Get user initials safely from a name string
 */
export function getUserInitials(name: unknown): string {
  if (!isNonEmptyString(name)) return '';
  
  return name
    .split(' ')
    .filter(n => n.length > 0)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Safe number parsing with default values
 */
export function safeParseInt(value: unknown, defaultValue = 0): number {
  if (typeof value === 'number') return Math.floor(value);
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Safe number parsing for floats with default values
 */
export function safeParseFloat(value: unknown, defaultValue = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}