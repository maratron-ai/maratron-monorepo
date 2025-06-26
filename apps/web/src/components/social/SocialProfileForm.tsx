"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createSocialProfile } from "@lib/api/social";
import { Card, Button } from "@components/ui";
import { TextField, TextAreaField } from "@components/ui/FormField";

interface Props {
  onCreated?: () => void;
}

export default function SocialProfileForm({ onCreated }: Props) {
  const { data: session } = useSession();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!session?.user?.id || !username) {
      setError("Username required");
      return;
    }

    try {
      await createSocialProfile({
        userId: session.user.id,
        username,
        bio: bio || undefined,
      });
      setSuccess("Profile created!");
      setUsername("");
      setBio("");
      onCreated?.();
      
      router.push("/social");
    } catch {
      setError("Failed to create profile");
    }
  };

  return (
    <Card className="p-6 w-full max-w-md">
      <h2 className="text-2xl font-semibold mb-4">Create Social Profile</h2>
      {error && <p className="text-brand-orange-dark mb-2">{error}</p>}
      {success && <p className="text-primary mb-2">{success}</p>}
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
            className="block mx-auto w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from">
            Create Profile
          </Button>
        </div>
      </form>
    </Card>
  );
}
