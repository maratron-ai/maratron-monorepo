import { HelpCircle } from "lucide-react";
import { cn } from "@lib/utils/cn";
import {
  TooltipProvider,
  TooltipRoot,
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
      <TooltipRoot>
        <TooltipTrigger asChild>
          <HelpCircle
            className={cn("ml-1 h-4 w-4 text-muted-foreground", iconClassName)}
          />
        </TooltipTrigger>
        <TooltipContent className={cn(className)}>{content}</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}
