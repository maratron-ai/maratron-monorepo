"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSocialProfile } from "@hooks/useSocialProfile";
import axios from "axios";
import SocialFeed from "@components/social/SocialFeed";
import GroupMembers from "@components/social/GroupMembers";
import { SocialLeaderboard } from "@components/leaderboards/SocialLeaderboard";
import { Button, Spinner, Card, toast } from "@components/ui";
import type { RunGroup } from "@maratypes/social";

export default function GroupPage() {
  const { data: session } = useSession();
  const { profile, loading: profileLoading } = useSocialProfile();
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [group, setGroup] = useState<RunGroup | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGroup = async () => {
    try {
      const { data } = await axios.get<RunGroup>(
        `/api/social/groups/${id}?profileId=${profile?.id ?? ""}`
      );
      setGroup(data);
    } catch {
      setGroup(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profileLoading) {
      fetchGroup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, profileLoading]);

  const handleJoin = async () => {
    if (!session?.user?.id) {
      router.push("/login");
      return;
    }
    if (!profile?.id) return;
    let password: string | undefined = undefined;
    if (group?.private) {
      password = window.prompt("Group password") || undefined;
      if (password === undefined) return;
    }
    try {
      await axios.post(`/api/social/groups/${id}/join`, {
        profileId: profile.id,
        password,
      });
      fetchGroup();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        toast.error("Invalid password");
      } else {
        toast.error("Failed to join group");
      }
    }
  };

  const handleLeave = async () => {
    if (!profile?.id) return;
    await axios.delete(`/api/social/groups/${id}/join`, {
      data: { profileId: profile.id },
    });
    fetchGroup();
  };

  if (loading)
    return (
      <div className="w-full px-4 py-6 flex justify-center">
        <Spinner className="h-4 w-4" />
      </div>
    );
  if (!group) return <p className="w-full px-4 py-6">Group not found.</p>;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 max-w-screen-lg py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{group.name}</h1>
          {group.isMember ? (
            <Button
              onClick={handleLeave}
              variant="secondary"
              className="block w-auto text-foreground border-none bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0 border-none"
            >
              Leave Group
            </Button>
          ) : (
            <Button
              onClick={handleJoin}
              className="block w-auto text-foreground border-none bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0 border-none"
            >
              Join Group
            </Button>
          )}
        </div>
        {group.description && (
          <p className="text-foreground opacity-70">{group.description}</p>
        )}
        {group.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={group.imageUrl}
            alt={group.name}
            className="w-32 h-32 object-cover rounded-md"
          />
        )}
        <Card className="p-4 space-y-2">
          <p className="text-sm text-foreground opacity-60">
            Created {new Date(group.createdAt).toLocaleDateString()}
          </p>
          <p className="text-sm">Members: {group.memberCount}</p>
          <p className="text-sm">Posts: {group.postCount}</p>
          {group.totalDistance !== undefined && (
            <p className="text-sm">
              Total Distance: {group.totalDistance.toFixed(2)} mi
            </p>
          )}
        </Card>
        {group.isMember && (
          <SocialLeaderboard
            groupId={group.id}
            title="Group Leaderboard"
            className="mt-6"
          />
        )}
        {group.members && <GroupMembers members={group.members} />}
        {group.private && !group.isMember ? (
          <p>This group is private. Join to view posts.</p>
        ) : (
          <SocialFeed groupId={group.id} />
        )}
      </main>
    </div>
  );
}
