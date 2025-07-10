"use client";
import { useState, FormEvent, useEffect } from "react";
import { createPost } from "@lib/api/social";
import { listRuns } from "@lib/api/run";
import { useSocialProfile } from "@hooks/useSocialProfile";
import { Card, CardContent, CardHeader, CardTitle, Button, PhotoUpload, Spinner, Skeleton } from "@components/ui";
import { TextAreaField, SelectField } from "@components/ui/FormField";
import { getRunName } from "@utils/running/getRunName";
import type { Run } from "@maratypes/run";
import { PlusCircle } from "lucide-react";

interface Props {
  onCreated?: () => void;
  groupId?: string;
}

export default function CreateSocialPost({ onCreated, groupId }: Props) {
  const { profile } = useSocialProfile();
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [caption, setCaption] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingRuns, setLoadingRuns] = useState(true);

  useEffect(() => {
    const fetchRuns = async () => {
      if (!profile?.userId) return;
      try {
        const allRuns = await listRuns(profile.userId);
        const userRuns = allRuns
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        setRuns(userRuns);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRuns(false);
      }
    };
    fetchRuns();
  }, [profile?.userId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const run = runs.find((r) => r.id === selectedRunId);
    if (!run) {
      setError("Please select a run");
      return;
    }
    try {
      await createPost({
        socialProfileId: profile!.id,
        distance: run.distance,
        time: run.duration,
        caption: caption || undefined,
        photoUrl: photoUrl || undefined,
        groupId,
      });
      setSuccess("Posted!");
      setSelectedRunId("");
      setCaption("");
      setPhotoUrl("");
      onCreated?.();
    } catch {
      setError("Failed to create post");
    }
  };

  if (!profile) return null;

  return (
    <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          Share a Run
        </CardTitle>
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-950 px-3 py-2 rounded-md border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-600 dark:text-green-400 text-sm font-medium bg-green-50 dark:bg-green-950 px-3 py-2 rounded-md border border-green-200 dark:border-green-800">
            {success}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingRuns ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800" />
              <Skeleton className="h-10 w-full bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-zinc-600 dark:text-zinc-400">No recent runs found.</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
                Log a run first to share it with the community
              </p>
            </div>
          ) : (
            <SelectField
              label="Select Run"
              name="run"
              options={runs.map((r) => ({
                value: r.id ?? "",
                label: `${r.name || getRunName(r)} - ${r.distance} ${r.distanceUnit}`,
              }))}
              value={selectedRunId}
              onChange={(_n, v) => setSelectedRunId(String(v))}
              required
            />
          )}
          
          <TextAreaField
            label="Caption (optional)"
            name="caption"
            value={caption}
            onChange={(_n, v) => setCaption(String(v))}
            rows={3}
            placeholder="Share your thoughts about this run..."
          />
          
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Photo (optional)
            </label>
            <PhotoUpload value={photoUrl} onChange={(url) => setPhotoUrl(url)} />
          </div>
          
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={!selectedRunId || loadingRuns}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              Share Run
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
