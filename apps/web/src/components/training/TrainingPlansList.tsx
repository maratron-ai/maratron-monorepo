"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { listRunningPlans, updateRunningPlan, deleteRunningPlan } from "@lib/api/plan";
import type { RunningPlan } from "@maratypes/runningPlan";
import { Card, Button, Spinner } from "@components/ui";

export default function TrainingPlansList() {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<RunningPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const allPlans: RunningPlan[] = await listRunningPlans();
        const userId = session?.user?.id;
        let filtered = allPlans;
        if (userId) {
          filtered = allPlans.filter((p) => p.userId === userId);
        }
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt ?? "").getTime() -
            new Date(a.createdAt ?? "").getTime()
        );
        setPlans(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [session?.user?.id]);

  const setActive = async (id: string) => {
    try {
      await Promise.all(
        plans.map((p) => {
          if (!p.id) return Promise.resolve();
          const data: Record<string, unknown> = { active: p.id === id };
          if (p.id === id && !p.startDate) {
            data.startDate = new Date().toISOString();
          }
          return updateRunningPlan(p.id, data);
        })
      );
      setPlans((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, active: true, startDate: p.startDate || new Date() }
            : { ...p, active: false }
        )
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("activePlanChanged"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    try {
      await deleteRunningPlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-4">
        <Spinner className="h-4 w-4" />
      </div>
    );
  if (plans.length === 0)
    return <p className="text-foreground opacity-60">No plans saved.</p>;

  return (
    <div className="space-y-4">
      {plans.map((plan) => (
        <Card key={plan.id} className="p-6 flex justify-between items-start">
          <div className="space-y-1">
            <Link
              href={`/plans/${plan.id ?? ""}`}
              className="font-semibold underline"
            >
              {plan.name}
            </Link>
            <div className="text-sm space-y-1">
              {plan.planData?.weeks && <span>{plan.planData.weeks} weeks</span>}
              {plan.startDate && (
                <span className="ml-2">
                  {new Date(plan.startDate).toLocaleDateString()} -{" "}
                  {plan.endDate
                    ? new Date(plan.endDate).toLocaleDateString()
                    : ""}
                </span>
              )}
              {plan.active && (
                <span className="ml-2 text-primary font-medium">active</span>
              )}
            </div>
          </div>
          <div className="flex gap-2 space-x-4">
            {!plan.active && plan.id && (
              <Button
                onClick={() => setActive(plan.id!)}
                className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from"
              >
                Set Active
              </Button>
            )}
            {plan.id && (
              <Button
                onClick={() => deletePlan(plan.id!)}
                className="text-sm px-2 py-1 bg-brand-orange-dark hover:bg-brand-orange"
              >
                Delete
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
