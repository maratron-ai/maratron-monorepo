"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSocialProfile } from "@hooks/useSocialProfile";
import { followUser, unfollowUser, isFollowing } from "@lib/api/social";
import { Button } from "@components/ui";

interface Props {
  profileId: string;
}

export default function FollowUserButton({ profileId }: Props) {
  const { data: session } = useSession();
  const { profile } = useSocialProfile();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (profile) {
        try {
          const res = await isFollowing(profile.id, profileId);
          setFollowing(res);
        } catch {
          setFollowing(false);
        }
      }
      setLoading(false);
    };
    check();
  }, [profile, profileId]);

  if (!session?.user || !profile || profile.id === profileId || loading) return null;

  const onToggle = async () => {
    setProcessing(true);
    try {
      if (following) {
        await unfollowUser(profile.id, profileId);
        setFollowing(false);
      } else {
        await followUser(profile.id, profileId);
        setFollowing(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Button
      onClick={onToggle}
      size="sm"
      disabled={processing}
      className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from"
    >
      {following ? "Unfollow" : "Follow"}
    </Button>
  );
}
