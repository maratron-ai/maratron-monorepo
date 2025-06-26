"use client";

import { useState, FormEvent } from "react";
import type { SocialProfile } from "@maratypes/social";
import { updateSocialProfile } from "@lib/api/social";
import { Card, Button } from "@components/ui";
import { TextField, TextAreaField } from "@components/ui/FormField";

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
    <Card className="p-6 w-full max-w-md">
      <h2 className="text-2xl font-semibold mb-4">Edit Social Profile</h2>
      {error && <p className="text-brand-orange-dark mb-2">{error}</p>}
      {success && <p className="text-primary mb-2">Profile updated!</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Username"
          name="username"
          value={username}
          onChange={(_n, v) => setUsername(String(v))}
          required
        />
        <TextAreaField
          label="Bio"
          name="bio"
          value={bio}
          onChange={(_n, v) => setBio(String(v))}
          rows={2}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="block mx-auto w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

