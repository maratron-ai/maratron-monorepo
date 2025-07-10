"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Alert, AlertDescription } from "@components/ui/alert";
import { CoachSelector } from "@components/coaches";
import { useSignupFlow } from "@lib/contexts/SignupFlowContext";
import type { CoachPersona } from "@prisma/client";

export default function SignupCoachPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canAccessStep, completeStep } = useSignupFlow();
  const [coaches, setCoaches] = useState<CoachPersona[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/signup");
      return;
    }

    // Check if user can access this step
    if (!canAccessStep("coach")) {
      router.replace("/signup/vdot");
      return;
    }

    // Load coaches and current selection
    loadCoaches();
  }, [session, status, router, canAccessStep]);

  const loadCoaches = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch available coaches
      const coachesRes = await fetch("/api/coaches");
      if (!coachesRes.ok) {
        throw new Error("Failed to load coaches");
      }
      const coachesData = await coachesRes.json();
      setCoaches(coachesData.coaches || []);

      // Fetch current user's coach selection
      const userCoachRes = await fetch("/api/user/coach");
      if (userCoachRes.ok) {
        const userData = await userCoachRes.json();
        setSelectedCoachId(userData.user?.selectedCoachId || null);
      }
    } catch (error) {
      console.error("Error loading coaches:", error);
      setError("Failed to load coaches. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCoachSelect = (coachId: string | null) => {
    setSelectedCoachId(coachId);
  };

  const handleSkip = () => {
    // Mark coach step as complete (even if skipped)
    completeStep("coach");
    // Complete onboarding without selecting a coach
    router.push("/home");
  };

  const handleFinish = async () => {
    if (!selectedCoachId) {
      handleSkip();
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch("/api/user/coach", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ coachId: selectedCoachId }),
      });

      if (!response.ok) {
        throw new Error("Failed to save coach selection");
      }

      // Mark coach step as complete
      completeStep("coach");
      
      // Successfully saved, redirect to home
      router.push("/home");
    } catch (error) {
      console.error("Error saving coach selection:", error);
      setError("Failed to save your coach selection. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || !session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Card */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-zinc-900 dark:text-zinc-100">
              Choose Your AI Running Coach
            </CardTitle>
            <CardDescription className="text-lg max-w-2xl mx-auto text-zinc-600 dark:text-zinc-400">
              Your AI coach will provide personalized training advice, motivation, and support 
              tailored to your running style. You can always change your coach later in settings.
            </CardDescription>
          </CardHeader>
          {error && (
            <CardContent className="pt-0">
              <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <AlertDescription className="text-red-600 dark:text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>

        {/* Coach Selection */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-8">
            <CoachSelector
              coaches={coaches}
              selectedCoachId={selectedCoachId}
              onCoachSelect={handleCoachSelect}
              loading={loading}
              error={error}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={saving}
                className="w-full sm:w-auto border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Skip for Now
              </Button>
              <Button
                onClick={handleFinish}
                disabled={saving || loading}
                className="w-full sm:w-auto bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
              >
                {saving ? "Saving..." : selectedCoachId ? "Complete Setup" : "Finish Setup"}
              </Button>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {selectedCoachId 
                ? "Ready to start training with your selected coach!"
                : "You can always select a coach later in your settings."
              }
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}