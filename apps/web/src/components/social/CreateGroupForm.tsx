"use client";
import { useState, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSocialProfile } from "@hooks/useSocialProfile";
import { createGroup } from "@lib/api/social";
import { Card, Button, PhotoUpload, LockToggle, toast } from "@components/ui";
import { TextField, TextAreaField } from "@components/ui/FormField";

export default function CreateGroupForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const { profile } = useSocialProfile();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!session?.user?.id) {
      setError("Login required");
      return;
    }
    if (!profile?.id || !name) {
      setError("Group name required");
      return;
    }
    try {
      const group = await createGroup({
        name,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        private: isPrivate,
        password: isPrivate ? password : undefined,
        ownerId: profile.id,
      });
      router.push(`/social/groups/${group.id}`);
    } catch {
      setError("Failed to create group");
    }
  };

  return (
    <Card className="p-6 w-full max-w-md">
      <h2 className="text-2xl font-semibold mb-4">Create Run Group</h2>
      {error && <p className="text-brand-orange-dark mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Name"
          name="name"
          value={name}
          onChange={(_n, v) => setName(String(v))}
          required
        />
        <TextAreaField
          label="Description"
          name="description"
          value={description}
          onChange={(_n, v) => setDescription(String(v))}
          rows={2}
        />
        <div className="flex items-center gap-2">
          <PhotoUpload
            value={imageUrl}
            onChange={(url) => setImageUrl(url)}
            text="Upload Group Profile Picture"
          />

          <LockToggle
            locked={isPrivate}
            onChange={(v) => {
              setIsPrivate(v);
              toast(v ? "group is private" : "group is public");
            }}
            size="default"
            className="bg-transparent text-foreground hover:bg-transparent hover:text-foreground border-none ring-0 focus:ring-0 focus:outline-none"
          />
          <span className="text-sm">
            {isPrivate ? "Private Group" : "Public Group"}
          </span>
        </div>
        {isPrivate && (
          <TextField
            label="Group Password"
            name="password"
            type="password"
            value={password}
            onChange={(_n, v) => setPassword(String(v))}
            required
          />
        )}
        <div className="flex justify-end">
          <Button
            type="submit"
            className="block mx-auto w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
          >
            Create Group
          </Button>
        </div>
      </form>
    </Card>
  );
}
