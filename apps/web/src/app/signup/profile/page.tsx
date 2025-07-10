"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { updateUser } from "@lib/api/user/user";
import UserForm from "@components/profile/UserProfileForm";
import { User } from "@maratypes/user";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { useSignupFlow } from "@lib/contexts/SignupFlowContext";

export default function OnboardingProfile() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { canAccessStep, completeStep } = useSignupFlow();

  // If not authenticated, redirect to signup
  useEffect(() => {
    if (status === "loading") return; // Wait for loading
    if (!session?.user) {
      router.replace("/signup");
      return;
    }

    // Check if user can access this step
    if (!canAccessStep("profile")) {
      router.replace("/signup");
      return;
    }
  }, [session, status, router, canAccessStep]);

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
    // Mark profile step as complete
    completeStep("profile");
    router.push("/signup/vdot");
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-white dark:bg-zinc-950">
      <div className="w-full max-w-2xl">
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl text-center text-zinc-900 dark:text-zinc-100">
              Almost done—tell us about your running!
            </CardTitle>
            <CardDescription className="text-center text-zinc-600 dark:text-zinc-400">
              Complete your profile to get personalized training recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserForm
              initialUser={initialUser}
              onSave={onSave}
              alwaysEdit
              submitLabel="Continue to VDOT Setup"
              showVDOTField={false}
              showCoachSection={false}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
