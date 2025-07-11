"use client";
import { useEffect, useState, FormEvent, useCallback } from "react";
import { useSocialProfile } from "@hooks/useSocialProfile";
import { listComments, addComment } from "@lib/api/social";
import type { Comment } from "@maratypes/social";
import { Button, Input, Spinner } from "@components/ui";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import DefaultAvatar from "@components/DefaultAvatar";

interface Props {
  postId: string;
  initialCount?: number;
  onCommentAdded?: () => void;
}

export default function CommentSection({
  postId,
  initialCount = 0,
  onCommentAdded,
}: Props) {
  const { profile } = useSocialProfile();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listComments(postId);
      setComments(data);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (open) {
      fetchComments();
    }
  }, [open, fetchComments]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile || !text.trim()) return;
    setSubmitting(true);
    try {
      const comment = await addComment(postId, profile.id, text.trim());
      setComments((c) => [...c, { ...comment, socialProfile: profile }]);
      setCount((c) => c + 1);
      onCommentAdded?.();
      setText("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant={open ? "secondary" : "outline"}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300 bg-transparent transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:ring-0 border border-zinc-300 dark:border-zinc-700"
      >
        <MessageCircle className="w-4 h-4" />
        {count}
      </Button>
      {open && (
        <div className="mt-3 space-y-3">
          {loading ? (
            <div className="flex justify-center py-2">
              <Spinner className="h-3 w-3" />
            </div>
          ) : (
            comments.map((c) => {
              const avatarUrl = c.socialProfile?.user?.avatarUrl || c.socialProfile?.profilePhoto;
              const isDefaultAvatar = !avatarUrl || avatarUrl === "/default_profile.png" || avatarUrl === "" || avatarUrl?.includes("default_profile");
              
              return (
                <div key={c.id} className="flex items-start gap-2 text-sm text-zinc-900 dark:text-zinc-100">
                  {isDefaultAvatar ? (
                    <DefaultAvatar size={24} />
                  ) : (
                    <Image
                      src={avatarUrl}
                      alt={c.socialProfile?.username || "avatar"}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                <p>
                  {c.socialProfile?.username ? (
                    <Link
                      href={`/u/${c.socialProfile.username}`}
                      className="font-semibold hover:underline text-zinc-900 dark:text-zinc-100"
                    >
                      {c.socialProfile.username}
                    </Link>
                  ) : (
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{c.socialProfile?.username}</span>
                  )}{" "}
                  {c.text}
                  </p>
                </div>
              );
            })
          )}
          {profile && (
            <form onSubmit={onSubmit} className="flex gap-2">
              <Input
                value={text}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setText(e.target.value)
                }
                placeholder="Add a comment"
                className="h-8 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !text.trim()}
                className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
              >
                Post
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
