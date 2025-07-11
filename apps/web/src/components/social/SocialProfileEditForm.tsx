"use client";

import { useState, FormEvent } from "react";
import type { SocialProfile } from "@maratypes/social";
import { updateSocialProfile } from "@lib/api/social";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Alert, AlertDescription } from "@components/ui";

interface Props {
  profile: SocialProfile;
  onUpdated?: (p: SocialProfile) => void;
}

export default function SocialProfileEditForm({ profile, onUpdated }: Props) {
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await updateSocialProfile(profile.id, {
        username,
        bio,
      });
      setSuccess(true);
      onUpdated?.(updated);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-zinc-900 dark:text-zinc-100">
          Edit Social Profile
        </CardTitle>
        <CardDescription className="text-zinc-600 dark:text-zinc-400">
          Update your username and bio information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            {error && (
              <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <AlertDescription className="text-red-600 dark:text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                <AlertDescription className="text-green-600 dark:text-green-400">
                  Profile updated!
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="username" className="text-zinc-900 dark:text-zinc-100">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="bio" className="text-zinc-900 dark:text-zinc-100">
                Bio
              </Label>
              <textarea
                id="bio"
                placeholder="Tell other runners about yourself"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="min-h-[60px] w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-300 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
              />
            </div>
            
            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

