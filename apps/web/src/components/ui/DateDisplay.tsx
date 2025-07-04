"use client";

import { formatDateSafe, formatRelativeTime } from "@lib/utils/time/formatDate";
import { ClientOnly } from "./ClientOnly";

interface DateDisplayProps {
  date: string | Date;
  format?: "full" | "relative";
  className?: string;
}

/**
 * Hydration-safe date display component
 * Prevents server/client mismatch by using ClientOnly wrapper
 */
export function DateDisplay({ date, format = "full", className }: DateDisplayProps) {
  // Server-side fallback - use the same format as server-side rendering
  const serverFallback = (
    <span className={className}>
      {format === "relative" 
        ? formatRelativeTime(date, true) // Pass true for server-side
        : formatDateSafe(date, true) // Pass true for server-side
      }
    </span>
  );

  // Client-side rendering with proper timezone
  const clientContent = (
    <span className={className}>
      {format === "relative" 
        ? formatRelativeTime(date, false) // Pass false for client-side
        : formatDateSafe(date, false)
      }
    </span>
  );

  return (
    <ClientOnly fallback={serverFallback}>
      {clientContent}
    </ClientOnly>
  );
}