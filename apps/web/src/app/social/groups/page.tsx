"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSocialProfile } from "@hooks/useSocialProfile";
import { listGroups } from "@lib/api/social";
import type { RunGroup } from "@maratypes/social";
import { Button, Spinner } from "@components/ui";
import GroupCard from "@components/social/GroupCard";

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
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 max-w-screen-lg py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Run Groups</h1>
          <Button asChild>
            <Link
              href="/social/groups/new"
              className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from"
            >
              Create Group
            </Link>
          </Button>
        </div>
        {loading ? (
          <div className="flex justify-center py-4">
            <Spinner className="h-4 w-4" />
          </div>
        ) : (
          <div className="space-y-8">
            {yourGroups.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Your Groups</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {yourGroups.map((g) => (
                    <GroupCard key={g.id} group={g} />
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">All Groups</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {otherGroups.map((g) => (
                  <GroupCard key={g.id} group={g} />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
