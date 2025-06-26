"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getRunningPlan, updateRunningPlan } from "@lib/api/plan";
import { assignDatesToPlan } from "@utils/running/planDates";
import type { RunningPlan } from "@maratypes/runningPlan";
import RunningPlanDisplay from "@components/training/RunningPlanDisplay";
import { Spinner } from "@components/ui";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PlanPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const [plan, setPlan] = useState<RunningPlan | null>(null);
  const [planData, setPlanData] = useState<RunningPlan["planData"] | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const fetched: RunningPlan = await getRunningPlan(id);
        if (fetched.planData) {
          fetched.planData = assignDatesToPlan(fetched.planData, {
            startDate: fetched.startDate?.toString(),
            endDate: fetched.endDate?.toString(),
          });
        }
        if (session?.user && fetched.userId !== session.user.id) {
          router.push("/home");
          return;
        }
        setPlan(fetched);
        setPlanData(fetched.planData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [id, session?.user, router]);

  if (status === "loading" || loading) {
    return (
      <main className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-center py-4">
          <Spinner className="h-5 w-5" />
        </div>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="w-full px-4 sm:px-6 lg:px-8 py-4">
        Plan not found.
      </main>
    );
  }

  const handleSave = async (updated: RunningPlan["planData"]) => {
    if (!plan?.id) return;
    try {
      await updateRunningPlan(plan.id, { planData: updated });
      setPlan((p) => (p ? { ...p, planData: updated } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartNow = async (updated: RunningPlan["planData"]) => {
    if (!plan?.id) return;
    try {
      const result: RunningPlan = await updateRunningPlan(plan.id, {
        planData: updated,
        startDate: updated.startDate ? new Date(updated.startDate) : undefined,
        endDate: updated.endDate ? new Date(updated.endDate) : undefined,
        active: true,
      });
      setPlan(result);
      setPlanData(updated);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("activePlanChanged"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">{plan.name}</h1>
      {planData && (
        <RunningPlanDisplay
          planData={planData}
          planName={plan.name}
          allowEditable
          onPlanChange={setPlanData}
          onSave={handleSave}
          onStartNow={handleStartNow}
        />
      )}
    </main>
  );
}
