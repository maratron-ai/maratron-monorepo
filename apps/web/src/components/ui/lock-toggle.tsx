import { Lock, Unlock } from "lucide-react";
import { Button } from "./button";

interface LockToggleProps {
  locked: boolean;
  onChange?: (locked: boolean) => void;
  className?: string;
  size?: "icon" | "sm" | "default" | "lg";
}

export default function LockToggle({ locked, onChange, className, size }: LockToggleProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size={size || "icon"}
      className={className}
      aria-label={locked ? "group is private" : "group is public"}
      onClick={() => onChange?.(!locked)}
    >
      {locked ? <Lock className="h-10 w-10" /> : <Unlock className="h-10 w-10" />}
    </Button>
  );
}
