"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createSocialProfile } from "@lib/api/social";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Alert, AlertDescription } from "@components/ui";

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
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-zinc-900 dark:text-zinc-100">
          Create Social Profile
        </CardTitle>
        <CardDescription className="text-zinc-600 dark:text-zinc-400">
          Choose a unique username and add a bio to get started
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
                  {success}
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
                placeholder="Choose a unique username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="bio" className="text-zinc-900 dark:text-zinc-100">
                Bio (optional)
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
              className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              Create Profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
