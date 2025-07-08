"use client";
import { useState } from "react";
import Image from "next/image";
import DefaultAvatar from "@components/DefaultAvatar";

interface SocialAvatarProps {
  avatarUrl?: string | null;
  username?: string;
  size?: number;
  className?: string;
}

export default function SocialAvatar({ 
  avatarUrl, 
  username = "avatar", 
  size = 32,
  className = ""
}: SocialAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  const isDefaultAvatar = !avatarUrl || 
    avatarUrl === "/default_profile.png" || 
    avatarUrl === "" || 
    avatarUrl?.includes("default_profile") || 
    imageError;

  if (isDefaultAvatar) {
    return <DefaultAvatar size={size} className={className} />;
  }

  return (
    <Image
      src={avatarUrl}
      alt={username}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      onError={() => setImageError(true)}
    />
  );
}