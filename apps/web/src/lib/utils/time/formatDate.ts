/**
 * Utility functions for consistent date formatting across server and client
 */

/**
 * Format a date for display with consistent timezone handling
 * Uses UTC for server-side rendering to prevent hydration mismatches
 */
export function formatDateSafe(date: string | Date, isServer = typeof window === 'undefined'): string {
  const d = new Date(date);
  
  if (isServer) {
    // Use UTC formatting for server-side rendering to ensure consistency
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric", 
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC"
    }) + " UTC";
  }
  
  // Use local timezone for client-side
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit", 
    minute: "2-digit",
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 * Safe for SSR as it doesn't depend on timezone
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // For older dates, fall back to short format
  return then.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: diffDays > 365 ? "numeric" : undefined
  });
}