"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { listRuns } from "@lib/api/run";
import { getRunName } from "@utils/running/getRunName";
import type { Run } from "@maratypes/run";
import RunModal from "@components/runs/RunModal";
import { Spinner } from "@components/ui";

export default function RecentRuns() {
  const { data: session } = useSession();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);

  useEffect(() => {
    const fetchRuns = async () => {
      const userId = session?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const allRuns: Run[] = await listRuns(userId);
        allRuns.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setRuns(allRuns.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();
    const handle = () => fetchRuns();
    window.addEventListener("runsUpdated", handle);
    return () => window.removeEventListener("runsUpdated", handle);
  }, [session?.user?.id]);

  if (loading)
    return (
      <div className="flex justify-center py-4">
        <Spinner className="h-4 w-4" />
      </div>
    );
  if (runs.length === 0)
    return <p className="text-foreground opacity-60">No runs recorded yet.</p>;

  return (
    <>
      <ul className="space-y-2">
        {runs.map((run) => (
          <li
            key={run.id}
            className="border p-2 rounded cursor-pointer p-4 flex items-center gap-2 text-foreground hover:bg-primary hover:text-background transition-colors hover:border-muted-foreground"
            onClick={() => setSelectedRun(run)}
          >
            <span className="font-semibold">{run.name || getRunName(run)}</span>
            {`: ${run.distance} ${run.distanceUnit}`}
          </li>
        ))}
      </ul>
      {selectedRun && (
        <RunModal run={selectedRun} onClose={() => setSelectedRun(null)} />
      )}
    </>
  );
}
