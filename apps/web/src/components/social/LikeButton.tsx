"use client";
import { useState, useEffect } from "react";
import { useSocialProfile } from "@hooks/useSocialProfile";
import { likePost, unlikePost } from "@lib/api/social";
import { Button } from "@components/ui";
import { Heart } from "lucide-react";

interface Props {
  postId: string;
  initialLiked?: boolean;
  initialCount?: number;
}

export default function LikeButton({ postId, initialLiked = false, initialCount = 0 }: Props) {
  const { profile } = useSocialProfile();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
  }, [initialLiked, initialCount]);

  const toggleLike = async () => {
    if (!profile) return;
    setProcessing(true);
    try {
      if (liked) {
        await unlikePost(postId, profile.id);
        setLiked(false);
        setCount((c) => c - 1);
      } else {
        await likePost(postId, profile.id);
        setLiked(true);
        setCount((c) => c + 1);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (!profile) return null;

  return (
    <Button
      size="sm"
      variant={liked ? "secondary" : "outline"}
      onClick={toggleLike}
      disabled={processing}
      className="flex items-center gap-1 text-foreground bg-transparent transition-colors hover:bg-transparent hover:ring-0 border-none"
      aria-label={liked ? "Unlike" : "Like"}
    >
      <Heart
        className={`w-4 h-4 ${liked ? "fill-current text-primary" : ""}`}
      />
      {count}
    </Button>
  );
}
