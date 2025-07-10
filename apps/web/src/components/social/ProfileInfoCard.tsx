"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
// import { usePathname } from "next/navigation";
import type { SocialProfile } from "@maratypes/social";
import type { User } from "@maratypes/user";
import type { Run } from "@maratypes/run";
import DefaultAvatar from "@components/DefaultAvatar";
import { Card, CardContent, Button } from "@components/ui";
import UserStatsDialog from "@components/social/UserStatsDialog";
import FollowUserButton from "@components/social/FollowUserButton";
import { PROFILE_STATS_LIMIT } from "@lib/socialLimits";
import { Edit, Calendar, Users, MapPin } from "lucide-react";

interface Props {
  profile: SocialProfile;
  user?: Pick<User, "avatarUrl" | "createdAt">;
  isSelf?: boolean;
  disableSelfStats?: boolean;
  followers?: SocialProfile[];
  following?: SocialProfile[];
  runs?: Run[];
}

export default function ProfileInfoCard({
  profile,
  user,
  isSelf,
  disableSelfStats,
  followers,
  following,
  runs,
}: Props) {
  const [imageError, setImageError] = useState(false);
  const avatar = user?.avatarUrl || profile.profilePhoto;
  const isDefaultAvatar = !avatar || avatar === "/default_profile.png" || avatar === "" || avatar?.includes("default_profile") || imageError;
  const joined = user?.createdAt ?? profile.createdAt;
  const joinedText = new Date(joined).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });

  const runsList = runs?.slice(0, PROFILE_STATS_LIMIT) ?? [];
  const followersList = followers?.slice(0, PROFILE_STATS_LIMIT) ?? [];
  const followingList = following?.slice(0, PROFILE_STATS_LIMIT) ?? [];


  // const pathname = usePathname();

  return (
    <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
      <CardContent className="p-6">
        
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0">
            {isDefaultAvatar ? (
              <DefaultAvatar size={64} />
            ) : (
              <Image
                src={avatar}
                alt={profile.username}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
                onError={() => setImageError(true)}
              />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <Link 
                  href={`/u/${profile.username}`} 
                  className="text-xl font-bold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  @{profile.username}
                </Link>
                <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>Since {joinedText}</span>
                </div>
              </div>
              
              {/* Action Button */}
              <div>
                {isSelf ? (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Link href="/social/profile/edit">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                ) : (
                  <FollowUserButton profileId={profile.id} />
                )}
              </div>
            </div>
            
            {/* Bio */}
            {profile.bio && (
              <p className="text-zinc-700 dark:text-zinc-300 mt-3 text-sm leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Runs Stat */}
          {isSelf && disableSelfStats ? (
            <div className="flex items-baseline justify-center p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mr-1">{profile.runCount ?? 0}</span>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">runs</span>
            </div>
          ) : (
            <UserStatsDialog
              title="Runs"
              trigger={
                <div className="flex items-baseline justify-center p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mr-1">{profile.runCount ?? 0}</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">runs</span>
                </div>
              }
            >
              {runsList.length > 0 ? (
                <ul className="list-disc ml-4 space-y-1 text-left">
                  {runsList.map((r) => (
                    <li key={r.id}>
                      {r.name || new Date(r.date).toLocaleDateString()} - {r.distance}{" "}
                      {r.distanceUnit}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No runs found.</p>
              )}
            </UserStatsDialog>
          )}

          {/* Distance Stat */}
          {isSelf && disableSelfStats ? (
            <div className="flex items-baseline justify-center p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mr-1">{profile.totalDistance ?? 0}</span>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">miles</span>
            </div>
          ) : (
            <UserStatsDialog
              title="Distance"
              trigger={
                <div className="flex items-baseline justify-center p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mr-1">{profile.totalDistance ?? 0}</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">miles</span>
                </div>
              }
            >
              {runsList.length > 0 ? (
                <ul className="list-disc ml-4 space-y-1 text-left">
                  {runsList.map((r) => (
                    <li key={r.id}>
                      {r.name || new Date(r.date).toLocaleDateString()} - {r.distance}{" "}
                      {r.distanceUnit}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No runs found.</p>
              )}
            </UserStatsDialog>
          )}

          {/* Followers Stat */}
          {isSelf && disableSelfStats ? (
            <div className="flex items-baseline justify-center p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mr-1">{profile.followerCount ?? 0}</span>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">followers</span>
            </div>
          ) : (
            <UserStatsDialog
              title="Followers"
              trigger={
                <div className="flex items-baseline justify-center p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mr-1">{profile.followerCount ?? 0}</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">followers</span>
                </div>
              }
            >
              {followersList.length > 0 ? (
                <ul className="space-y-1">
                  {followersList.map((f) => (
                    <li key={f.id}>
                      <Link href={`/u/${f.username}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        @{f.username}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No followers yet.</p>
              )}
            </UserStatsDialog>
          )}

          {/* Following Stat */}
          {isSelf && disableSelfStats ? (
            <div className="flex items-baseline justify-center p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mr-1">{profile.followingCount ?? 0}</span>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">following</span>
            </div>
          ) : (
            <UserStatsDialog
              title="Following"
              trigger={
                <div className="flex items-baseline justify-center p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mr-1">{profile.followingCount ?? 0}</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">following</span>
                </div>
              }
            >
              {followingList.length > 0 ? (
                <ul className="space-y-1">
                  {followingList.map((f) => (
                    <li key={f.id}>
                      <Link href={`/u/${f.username}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        @{f.username}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Not following anyone.</p>
              )}
            </UserStatsDialog>
          )}
        </div>
        
      </CardContent>
    </Card>
  );
}
