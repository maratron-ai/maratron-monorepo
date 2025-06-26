"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@components/ui";
import VDOTEstimator from "@components/profile/VDOTEstimator";

export default function SignupVDOTPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/signup");
    }
  }, [session, status, router]);

  if (status === "loading" || !session?.user) {
    return null;
  }

  const handleComplete = () => {
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-20 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-background backdrop-blur-sm" />
        <div className="relative w-full px-4 sm:px-6 lg:px-8 flex justify-center">
          <Card className="w-full max-w-md p-8 bg-background border border-muted shadow-xl space-y-6">
            <h1 className="text-3xl font-bold text-center">
              Estimate Your VDOT
            </h1>
            <p className="text-center text-sm text-muted-foreground">
              This should be your fastest time for the given distance.
            </p>
            <VDOTEstimator
              userId={session.user.id!}
              onComplete={handleComplete}
            />
          </Card>
        </div>
      </section>
    </div>
  );
}
