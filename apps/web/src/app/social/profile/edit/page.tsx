"use client";
import { useSocialProfile } from "@hooks/useSocialProfile";
import SocialProfileEditForm from "@components/social/SocialProfileEditForm";
import { Spinner, Skeleton } from "@components/ui";

export default function EditSocialProfilePage() {
  const { profile, loading } = useSocialProfile();

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="container mx-auto px-6 py-8 max-w-2xl">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2 bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-5 w-80 bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <Skeleton className="h-96 w-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Edit Profile</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Update your profile information and preferences.</p>
        </div>
        <SocialProfileEditForm profile={profile} />
      </div>
    </div>
  );
}
