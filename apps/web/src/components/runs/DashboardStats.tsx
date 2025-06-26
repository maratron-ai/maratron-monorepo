"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { listRuns } from "@lib/api/run";
import { Card } from "@components/ui";
import { useUser } from "@hooks/useUser";

export default function DashboardStats() {
  const { data: session } = useSession();
  const { profile } = useUser();
  const [runCount, setRunCount] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [unit, setUnit] = useState<"miles" | "kilometers">("miles");

  useEffect(() => {
    async function fetchRuns() {
      const userId = session?.user?.id;
      if (!userId) {
        return;
      }

      try {
        const runs = await listRuns(userId);
        setRunCount(runs.length);

        const defaultUnit = profile?.defaultDistanceUnit || "miles";
        setUnit(defaultUnit);

        const total = runs.reduce((sum, r) => {
          if (r.distanceUnit === defaultUnit) return sum + r.distance;
          if (r.distanceUnit === "miles" && defaultUnit === "kilometers") {
            return sum + r.distance * 1.60934;
          }
          if (r.distanceUnit === "kilometers" && defaultUnit === "miles") {
            return sum + r.distance * 0.621371;
          }
          return sum;
        }, 0);
        setTotalDistance(total);
      } catch (err) {
        console.error(err);
      }
    }
    fetchRuns();
    const handle = () => fetchRuns();
    window.addEventListener("runsUpdated", handle);
    return () => window.removeEventListener("runsUpdated", handle);
  }, [session?.user, profile?.defaultDistanceUnit]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Link href="/runs" style={{ textDecoration: "none" }}>
        <Card className="p-4 text-center cursor-pointer text-foreground hover:bg-primary hover:text-background transition-colors">
          <div className="text-2xl font-bold hover:no-underline">
            {runCount}
          </div>
          <div className="text-sm">Total Runs</div>
        </Card>
      </Link>
      <Card className="p-4 text-center">
        <div className="text-2xl font-bold flex items-baseline justify-center gap-1">
          {totalDistance.toFixed(1)}
          <span className="text-base text-muted-foreground">
            {unit === "miles" ? "mi" : "km"}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">Total Distance</div>
      </Card>
    </div>
  );
}
