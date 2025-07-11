// src/app/profile/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Spinner } from "@components/ui";
import UserForm from "@components/profile/UserProfileForm";
import { User } from "@maratypes/user";
import { getUser } from "@lib/api/user/user";

export default function UserPage() {
  const { data: session, status, update } = useSession();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch full profile after session loads
  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user?.id) {
        try {
          setLoading(true);
          const userProfile = await getUser(session.user.id);
          setProfile(userProfile);
        } catch {
          setError("Failed to load user profile.");
        } finally {
          setLoading(false);
        }
      } else if (status === "authenticated" && !session?.user?.id) {
        setError("Session loaded, but user ID is missing.");
        setLoading(false);
      }
    };
    fetchProfile();
  }, [session, status]);

  // Handle save success (user already updated by useUserForm)
  const handleSave = async (updated: User) => {
    try {
      setLoading(true);
      // Don't call updateUser again - it was already called by useUserForm
      setProfile(updated);
      await update({
        user: {
          ...session!.user,
          name: updated.name,
          email: updated.email,
          avatarUrl: updated.avatarUrl ?? null,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      setError("Failed to update session.");
    } finally {
      setLoading(false);
    }
  };

  // Session loading
  if (status === "loading") {
    return (
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-center py-4">
          <Spinner className="h-4 w-4" />
        </div>
      </main>
    );
  }
  
  // Unauthenticated - redirect to login immediately
  if (status === "unauthenticated") {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return (
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-center py-4">
          <Spinner className="h-4 w-4" />
        </div>
      </main>
    );
  }

  // Profile loading or error
  if (loading) {
    return (
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-center py-4">
          <Spinner className="h-4 w-4" />
        </div>
      </main>
    );
  }
  if (error) {
    return (
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 text-brand-orange-dark">
        {error}
      </main>
    );
  }

  // Render the form
  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex justify-end mb-6">
        {/* <button
          onClick={() => signOut()}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button> */}
      </div>
      {saveSuccess && (
        <div className="mb-4 text-primary">Profile updated!</div>
      )}
      {profile && (
        <UserForm initialUser={profile} onSave={handleSave} />
      )}
    </main>
  );
}
