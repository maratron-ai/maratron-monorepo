import Image from "next/image";
import React from "react";
import { cn } from "@lib/utils/cn";

export interface DefaultAvatarProps {
  /** Size of the avatar circle */
  size?: number;
  className?: string;
}

export default function DefaultAvatar({ size = 32, className = "" }: DefaultAvatarProps) {
  return (
    <Image
      src="/default_profile.png"
      alt="Default avatar"
      width={size}
      height={size}
      className={cn(
        "rounded-full object-cover border border-brand-to bg-brand-from",
        className,
      )}
    />
  );
}
