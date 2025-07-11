"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSocialProfile } from "@hooks/useSocialProfile";
import { listGroups } from "@lib/api/social";
import type { RunGroup } from "@maratypes/social";
import { Button, Spinner, Skeleton } from "@components/ui";
import GroupCard from "@components/social/GroupCard";
import { Plus } from "lucide-react";

export default function GroupsPage() {
  const { profile, loading: profileLoading } = useSocialProfile();
  const [groups, setGroups] = useState<RunGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listGroups(profile?.id);
        setGroups(data);
      } finally {
        setLoading(false);
      }
    };
    if (!profileLoading) load();
  }, [profile?.id, profileLoading]);

  const yourGroups = groups.filter((g) => g.isMember);
  const otherGroups = groups.filter((g) => !g.isMember);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Run Groups</h1>
              <p className="text-zinc-600 dark:text-zinc-400">Discover and join running communities in your area.</p>
            </div>
            <Button asChild className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200">
              <Link href="/social/groups/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Link>
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800" />
              <div className="grid md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full bg-zinc-200 dark:bg-zinc-800" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {yourGroups.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Your Groups</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {yourGroups.map((g) => (
                    <GroupCard key={g.id} group={g} />
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">All Groups</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {otherGroups.map((g) => (
                  <GroupCard key={g.id} group={g} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
