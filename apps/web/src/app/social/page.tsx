"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSocialProfile } from "@hooks/useSocialProfile";
import { useUser } from "@hooks/useUser";
import ProfileInfoCard from "@components/social/ProfileInfoCard";
import ProfileSearch from "@components/social/ProfileSearch";
import SocialFeed from "@components/social/SocialFeed";
import { Button, Spinner } from "@components/ui";
import { listGroups } from "@lib/api/social";
import type { RunGroup } from "@maratypes/social";

export default function SocialHomePage() {
  const { data: session } = useSession();
  const { profile, loading } = useSocialProfile();
  const { profile: user } = useUser();
  const [groups, setGroups] = useState<RunGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);

  useEffect(() => {
    const loadGroups = async () => {
      if (!profile?.id) {
        setGroups([]);
        setGroupsLoading(false);
        return;
      }
      try {
        const data = await listGroups(profile.id);
        setGroups(data.filter((g) => g.isMember));
      } finally {
        setGroupsLoading(false);
      }
    };
    if (!loading) loadGroups();
  }, [profile?.id, loading]);

  if (!session?.user) {
    return (
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <p>Please log in to access social features.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-center py-4">
          <Spinner className="h-4 w-4" />
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-2">
        <div className="flex flex-col items-center text-center pt-8 space-y-4">
          {/* eslint-disable-next-line react/no-unescaped-entities */}
          <h3>You don't have a social profile yet!</h3>
          <Button
            asChild
            className="text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from"
          >
            <Link href="/social/profile/new">Create Social Profile</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 max-w-screen-lg py-8 flex flex-col lg:flex-row gap-8">
        <section className="lg:w-2/3 order-2 lg:order-1 space-y-6">
          <SocialFeed />
        </section>
        <aside className="lg:w-1/3 order-1 lg:order-2 space-y-6">
          <ProfileInfoCard
            profile={profile}
            user={user ?? undefined}
            isSelf
            disableSelfStats
          />
          <div>
            <h2 className="text-lg font-semibold mb-2">Find Runners</h2>
            <ProfileSearch limit={3} />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Your Groups</h2>
            {groupsLoading ? (
              <div className="flex justify-center py-2">
                <Spinner className="h-4 w-4" />
              </div>
            ) : groups.length > 0 ? (
              <ul className="list-none ml-0 space-y-1">
                {groups.map((g) => (
                  <li key={g.id}>
                    <Link
                      href={`/social/groups/${g.id}`}
                      className="hover:underline"
                    >
                      {g.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">You&apos;re not in any groups yet.</p>
            )}
            <div className="mt-2">
              <Button
                asChild
                className="block text-center w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from"
              >
                <Link href="/social/groups">Browse &amp; Create Groups</Link>
              </Button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
