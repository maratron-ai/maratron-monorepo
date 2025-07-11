import { HelpCircle } from "lucide-react";
import { cn } from "@lib/utils/cn";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@components/ui";
import React from "react";

interface InfoTooltipProps {
  content: React.ReactNode;
  className?: string;
  iconClassName?: string;
}

export default function InfoTooltip({
  content,
  className,
  iconClassName,
}: InfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle
            className={cn("ml-1 h-4 w-4 text-muted-foreground", iconClassName)}
          />
        </TooltipTrigger>
        <TooltipContent className={cn("bg-zinc-800 dark:bg-zinc-200 text-zinc-100 dark:text-zinc-800 border border-zinc-700 dark:border-zinc-300", className)}>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
