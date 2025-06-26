"use client";
import { useSocialProfile } from "@hooks/useSocialProfile";
import SocialProfileEditForm from "@components/social/SocialProfileEditForm";
import { Spinner } from "@components/ui";

export default function EditSocialProfilePage() {
  const { profile, loading } = useSocialProfile();

  if (loading)
    return (
      <div className="w-full px-4 py-6 flex justify-center">
        <Spinner className="h-4 w-4" />
      </div>
    );
  if (!profile) return <p className="w-full px-4 py-6">Profile not found.</p>;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-center">
          <SocialProfileEditForm profile={profile} />
        </div>
      </main>
    </div>
  );
}
