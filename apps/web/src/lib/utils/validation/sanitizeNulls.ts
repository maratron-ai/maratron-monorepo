// @util/validation/sanitizeNulls.ts

export function sanitizeNulls<T>(obj: T): T | undefined {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeNulls) as unknown as T;
  }
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, sanitizeNulls(v)])
    ) as T;
  }
  return obj === null ? undefined : obj;
}
