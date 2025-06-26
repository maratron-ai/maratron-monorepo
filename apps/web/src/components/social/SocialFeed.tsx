"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import type { RunPost } from "@maratypes/social";
import { useSession } from "next-auth/react";
import { useSocialProfile } from "@hooks/useSocialProfile";
import CreateSocialPost from "@components/social/CreateSocialPost";
import LikeButton from "@components/social/LikeButton";
import CommentSection from "@components/social/CommentSection";
import { Button, Dialog, DialogContent, Spinner } from "@components/ui";
import Link from "next/link";
import Image from "next/image";

interface Props {
  groupId?: string;
}

export default function SocialFeed({ groupId }: Props) {
  const { data: session } = useSession();
  const { profile, loading: profileLoading } = useSocialProfile();
  const [posts, setPosts] = useState<RunPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchFeed = async () => {
    if (!session?.user?.id) return;
    try {
      const url = groupId
        ? `/api/social/groups/${groupId}/posts?profileId=${profile?.id ?? ""}`
        : `/api/social/feed?userId=${session.user.id}`;
      const { data } = await axios.get<RunPost[]>(url);
      setPosts(data);
      setVisibleCount(10);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, profile?.id, groupId]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (!bottomRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && posts.length > visibleCount && !loadingMore) {
        setLoadingMore(true);
        setTimeout(() => {
          setVisibleCount((c) => c + 10);
          setLoadingMore(false);
        }, 1000);
      }
    });
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [posts.length, visibleCount, loadingMore]);

  if (!session?.user?.id) return <p>Please log in to view your feed.</p>;
  if (profileLoading || loading)
    return (
      <div className="flex justify-center py-4">
        <Spinner className="h-4 w-4" />
      </div>
    );
  if (!profile)
    return (
      <div className="space-y-2">
        <p>You need a social profile to use the feed.</p>
        <Button asChild>
          <a
            href="/social/profile/new"
            className="block mx-auto w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
          >
            Create Social Profile
          </a>
        </Button>
      </div>
    );

  return (
    <div className="space-y-6">
      <CreateSocialPost onCreated={fetchFeed} groupId={groupId} />
      {posts.length === 0 && <p>No posts yet.</p>}
      {posts.slice(0, visibleCount).map((post) => (
        <div key={post.id} className="border rounded-md p-4">
          <div className="flex items-center gap-2 mb-1">
            <Image
              src={
                post.socialProfile?.user?.avatarUrl || "/default_profile.png"
              }
              alt={post.socialProfile?.username || "avatar"}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover border border-brand-to bg-brand-from"
            />
            {post.socialProfile?.username && (
              <Link
                href={`/u/${post.socialProfile.username}`}
                className="font-semibold hover:underline"
              >
                {post.socialProfile.username}
              </Link>
            )}
          </div>
          <div className="text-sm text-foreground opacity-60 mb-2">
            {new Date(post.createdAt).toLocaleString()}
          </div>
          <p className="font-medium">
            {post.distance} mi in {post.time}
          </p>
          {post.caption && <p className="mt-2">{post.caption}</p>}
          {post.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.photoUrl}
              alt="Run photo"
              className="mt-2 rounded-md h-64 w-64 object-cover cursor-pointer"
              onClick={() => setSelectedImage(post.photoUrl!)}
            />
          )}
          <div className="flex items-start gap-2 mt-2">
            <LikeButton
              postId={post.id}
              initialLiked={post.liked ?? false}
              initialCount={post.likeCount ?? post._count?.likes ?? 0}
            />
            <CommentSection
              postId={post.id}
              initialCount={post.commentCount ?? post._count?.comments ?? 0}
            />
          </div>
        </div>
      ))}
      <div ref={bottomRef} className="h-1" />
      {loadingMore && (
        <div className="flex justify-center py-2">
          <Spinner className="h-4 w-4" />
        </div>
      )}
      <Dialog
        open={!!selectedImage}
        onOpenChange={(o) => !o && setSelectedImage(null)}
      >
        <DialogContent className="p-0">
          {selectedImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedImage}
              alt="Run photo"
              className="w-64 h-64 object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
