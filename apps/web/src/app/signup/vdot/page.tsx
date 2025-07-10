"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { useSignupFlow } from "@lib/contexts/SignupFlowContext";
import VDOTEstimator from "@components/profile/VDOTEstimator";

export default function SignupVDOTPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canAccessStep, completeStep } = useSignupFlow();

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/signup");
      return;
    }

    // Check if user can access this step
    if (!canAccessStep("vdot")) {
      router.replace("/signup/profile");
      return;
    }
  }, [session, status, router, canAccessStep]);

  if (status === "loading" || !session?.user) {
    return null;
  }

  const handleComplete = () => {
    // Mark VDOT step as complete
    completeStep("vdot");
    router.push("/signup/coach");
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-white dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl text-center text-zinc-900 dark:text-zinc-100">
              Estimate Your VDOT
            </CardTitle>
            <CardDescription className="text-center text-zinc-600 dark:text-zinc-400">
              This should be your fastest time for the given distance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VDOTEstimator
              userId={session.user.id!}
              onComplete={handleComplete}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
