import { Loader2 } from "lucide-react";
import { cn } from "@lib/utils/cn";
import * as React from "react";

export type SpinnerProps = React.ComponentPropsWithoutRef<typeof Loader2>;

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, ...props }, ref) => (
    <Loader2
      ref={ref}
      {...props}
      className={cn("h-5 w-5 animate-spin text-muted-foreground", className)}
    />
  )
);
Spinner.displayName = "Spinner";

export { Spinner };
