"use client";
import { useState, FormEvent, useEffect } from "react";
import { createPost } from "@lib/api/social";
import { listRuns } from "@lib/api/run";
import { useSocialProfile } from "@hooks/useSocialProfile";
import { Card, Button, PhotoUpload, Spinner } from "@components/ui";
import { TextAreaField, SelectField } from "@components/ui/FormField";
import { getRunName } from "@utils/running/getRunName";
import type { Run } from "@maratypes/run";

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
    <Card className="p-4 mb-6">
      <h3 className="text-lg font-semibold mb-2">Share a Run</h3>
      {error && <p className="text-brand-orange-dark mb-2">{error}</p>}
      {success && <p className="text-primary mb-2">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-2">
        {loadingRuns ? (
          <div className="flex justify-center py-2">
            <Spinner className="h-4 w-4" />
          </div>
        ) : runs.length === 0 ? (
          <p>No recent runs found.</p>
        ) : (
          <SelectField
            label="Run"
            name="run"
            options={runs.map((r) => ({
              value: r.id ?? "",
              label: `${r.name || getRunName(r)} - ${r.distance} ${
                r.distanceUnit
              }`,
            }))}
            value={selectedRunId}
            onChange={(_n, v) => setSelectedRunId(String(v))}
            required
          />
        )}
        <TextAreaField
          label="Caption"
          name="caption"
          value={caption}
          onChange={(_n, v) => setCaption(String(v))}
          rows={2}
        />
        <PhotoUpload value={photoUrl} onChange={(url) => setPhotoUrl(url)} />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
          >
            Post
          </Button>
        </div>
      </form>
    </Card>
  );
}
