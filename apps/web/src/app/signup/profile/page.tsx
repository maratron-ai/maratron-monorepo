"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { updateUser } from "@lib/api/user/user";
import UserForm from "@components/profile/UserProfileForm";
import { User } from "@maratypes/user";
import { useEffect } from "react";
import { Card } from "@components/ui";

export default function OnboardingProfile() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // If not authenticated, redirect to signup
  useEffect(() => {
    if (status === "loading") return; // Wait for loading
    if (!session?.user) {
      router.replace("/signup");
    }
  }, [session, status, router]);

  // Don't render until loaded & logged in
  if (status === "loading" || !session?.user) {
    return null;
  }

  // Prefill the form using session.user
  // You'll need to load any additional fields from your database if needed
  const initialUser: User = {
    id: session.user.id!,
    name: session.user.name ?? "",
    email: session.user.email ?? "",

  // ...other fields (may need to fetch from API if your User is more than name/email)
  };

  const onSave = async (updated: User) => {
    await updateUser(initialUser.id, updated);
    // Refresh session so avatar updates in navbar
    await update({ user: { avatarUrl: updated.avatarUrl ?? null } });
    router.push("/signup/vdot");
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-20 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-background opacity-80 backdrop-blur-sm" />
        <div className="relative w-full px-4 sm:px-6 lg:px-8 flex justify-center">
          <Card className="w-full max-w-2xl p-8 bg-background border border-muted shadow-xl space-y-6">
            <h1 className="text-3xl font-bold text-center">
              Almost done—tell us about your running!
            </h1>
            <UserForm
              initialUser={initialUser}
              onSave={onSave}
              alwaysEdit
              submitLabel="Finish Setup"
              showVDOTField={false}
            />
          </Card>
        </div>
      </section>
    </div>
  );
}
