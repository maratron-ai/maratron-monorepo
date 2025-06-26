"use client";
import { useState, useRef, useEffect } from "react";
import type { RunPost } from "@maratypes/social";
import LikeButton from "@components/social/LikeButton";
import CommentSection from "@components/social/CommentSection";
import { Card, Dialog, DialogContent, Spinner } from "@components/ui";

interface Props {
  posts: RunPost[];
}

export default function PostList({ posts }: Props) {
  const [visibleCount, setVisibleCount] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(10);
  }, [posts]);

  useEffect(() => {
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

  return (
    <div className="space-y-6">
      {posts.slice(0, visibleCount).map((post) => (
        <Card key={post.id} className="space-y-2 p-4">
          <p className="text-base font-semibold">
            {post.distance} mi in {post.time}
          </p>
          <div className="text-sm text-foreground opacity-60">
            {new Date(post.createdAt).toLocaleString()}
          </div>
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
          <div className="flex gap-2 mt-2 items-start">
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
        </Card>
      ))}
      <div ref={bottomRef} className="h-1" />
      {loadingMore && (
        <div className="flex justify-center py-2">
          <Spinner className="h-4 w-4" />
        </div>
      )}
      <Dialog open={!!selectedImage} onOpenChange={(o) => !o && setSelectedImage(null)}>
        <DialogContent className="p-0 max-w-3xl">
          {selectedImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedImage} alt="Run photo" className="w-full h-full object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
