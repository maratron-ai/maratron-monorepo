"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@components/ui";
import { Button } from "@components/ui";
import { CoachSelector } from "@components/coaches";
import type { CoachPersona } from "@prisma/client";

export default function SignupCoachPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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

    // Load coaches and current selection
    loadCoaches();
  }, [session, status, router]);

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
    <div className="min-h-screen bg-background">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-background backdrop-blur-sm" />
        <div className="relative w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header Card */}
            <Card className="p-8 bg-background border border-muted shadow-xl">
              <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold">
                  Choose Your AI Running Coach
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Your AI coach will provide personalized training advice, motivation, and support 
                  tailored to your running style. You can always change your coach later in settings.
                </p>
                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}
              </div>
            </Card>

            {/* Coach Selection */}
            <Card className="p-8 bg-background border border-muted shadow-xl">
              <CoachSelector
                coaches={coaches}
                selectedCoachId={selectedCoachId}
                onCoachSelect={handleCoachSelect}
                loading={loading}
                error={error}
              />
            </Card>

            {/* Action Buttons */}
            <Card className="p-8 bg-background border border-muted shadow-xl">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={saving || loading}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? "Saving..." : selectedCoachId ? "Complete Setup" : "Finish Setup"}
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                {selectedCoachId 
                  ? "Ready to start training with your selected coach!"
                  : "You can always select a coach later in your settings."
                }
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}