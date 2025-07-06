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
    // Use manual formatting for server-side rendering to ensure consistency
    const utcDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    const month = utcDate.toLocaleString("en-US", { month: "short" });
    const day = utcDate.getDate();
    const year = utcDate.getFullYear();
    const hours = utcDate.getHours();
    const minutes = utcDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${month} ${day}, ${year}, ${displayHours}:${displayMinutes} ${ampm} UTC`;
  }
  
  // Use local timezone for client-side with consistent format
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const year = d.getFullYear();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  return `${month} ${day}, ${year}, ${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 * Returns static format for server-side rendering to prevent hydration issues
 */
export function formatRelativeTime(date: string | Date, isServer = typeof window === 'undefined'): string {
  const then = new Date(date);
  
  // For server-side rendering, always show static date format to prevent hydration mismatch
  if (isServer) {
    return then.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }
  
  // Client-side relative time calculation
  const now = new Date();
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