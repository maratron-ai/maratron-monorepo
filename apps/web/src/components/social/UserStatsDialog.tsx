"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui";

interface UserStatsDialogProps {
  title: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
}

export default function UserStatsDialog({
  title,
  trigger,
  children,
}: UserStatsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="mb-2">{title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-60 overflow-y-auto text-sm space-y-1">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
