"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSocialProfile } from "@hooks/useSocialProfile";
import { useUser } from "@hooks/useUser";
import ProfileInfoCard from "@components/social/ProfileInfoCard";
import ProfileSearch from "@components/social/ProfileSearch";
import SocialFeed from "@components/social/SocialFeed";
import { Button, Spinner, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@components/ui";
import { listGroups } from "@lib/api/social";
import type { RunGroup } from "@maratypes/social";
import { isDemoMode, getDemoSocialProfile, getDemoRunGroups, getDemoUserData } from "@lib/utils/demo-mode";
import { Users, Search, Activity } from "lucide-react";

export default function SocialHomePage() {
  const { data: session } = useSession();
  const { profile, loading } = useSocialProfile();
  const { profile: user } = useUser();
  const [groups, setGroups] = useState<RunGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  
  // Demo mode for testing/screenshots
  const demoMode = isDemoMode();
  
  // Override data in demo mode
  const effectiveProfile = demoMode ? getDemoSocialProfile() : profile;
  const effectiveUser = demoMode ? getDemoUserData() : user;
  const effectiveLoading = demoMode ? false : loading;

  useEffect(() => {
    const loadGroups = async () => {
      // In demo mode, use sample data
      if (demoMode) {
        setGroups(getDemoRunGroups());
        setGroupsLoading(false);
        return;
      }
      
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
    if (!loading || demoMode) loadGroups();
  }, [profile?.id, loading, demoMode]);

  if (!session?.user && !demoMode) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
        <Card className="max-w-md mx-4 shadow-lg bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Connect with Runners</CardTitle>
              <p className="text-zinc-600 dark:text-zinc-400">Join the Maratron community to share your runs and connect with fellow athletes</p>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild size="lg" className="w-full">
              <Link href="/login">
                Sign In to Get Started
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (effectiveLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-8">
            <section className="lg:w-2/3 space-y-6">
              <Skeleton className="h-32 w-full bg-zinc-200 dark:bg-zinc-800" />
              <Skeleton className="h-64 w-full bg-zinc-200 dark:bg-zinc-800" />
              <Skeleton className="h-64 w-full bg-zinc-200 dark:bg-zinc-800" />
            </section>
            <aside className="lg:w-1/3 space-y-6">
              <Skeleton className="h-48 w-full bg-zinc-200 dark:bg-zinc-800" />
              <Skeleton className="h-32 w-full bg-zinc-200 dark:bg-zinc-800" />
              <Skeleton className="h-32 w-full bg-zinc-200 dark:bg-zinc-800" />
            </aside>
          </div>
        </div>
      </div>
    );
  }

  if (!effectiveProfile) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
        <Card className="max-w-md mx-4 shadow-lg bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Create Your Profile</CardTitle>
              <p className="text-zinc-600 dark:text-zinc-400">Set up your social profile to connect with other runners and share your journey</p>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild size="lg" className="w-full">
              <Link href="/social/profile/new">
                Create Social Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        
        {/* Header Section - Only show if no profile exists */}
        {!effectiveProfile && (
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Social Feed</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Connect with runners, share your journey, and discover new training partners.</p>
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-8">
          <section className="lg:w-2/3 order-2 lg:order-1 space-y-6">
            <SocialFeed />
          </section>
          <aside className="lg:w-1/3 order-1 lg:order-2 space-y-6">
            <ProfileInfoCard
              profile={effectiveProfile}
              user={effectiveUser ?? undefined}
              isSelf
              disableSelfStats
            />
            
            {/* Find Runners Section */}
            <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Search className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  Find Runners
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileSearch limit={3} />
              </CardContent>
            </Card>
            
            {/* Your Groups Section */}
            <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  Your Groups
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {groupsLoading ? (
                  <div className="flex justify-center py-2">
                    <Spinner className="h-4 w-4" />
                  </div>
                ) : groups.length > 0 ? (
                  <div className="space-y-2">
                    {groups.map((g) => (
                      <div key={g.id} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <Link
                          href={`/social/groups/${g.id}`}
                          className="text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                        >
                          {g.name}
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">You&apos;re not in any groups yet.</p>
                )}
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Link href="/social/groups">Browse &amp; Create Groups</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
