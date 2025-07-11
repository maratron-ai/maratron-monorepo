"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import type { RunPost } from "@maratypes/social";
import { useSession } from "next-auth/react";
import { useSocialProfile } from "@hooks/useSocialProfile";
import CreateSocialPost from "@components/social/CreateSocialPost";
import LikeButton from "@components/social/LikeButton";
import CommentSection from "@components/social/CommentSection";
import { Button, Dialog, DialogContent, DialogTrigger, Spinner, Card, CardContent, Skeleton } from "@components/ui";
import Link from "next/link";
import Image from "next/image";
import DefaultAvatar from "@components/DefaultAvatar";
import SocialAvatar from "@components/social/SocialAvatar";
import { Clock, MapPin } from "lucide-react";

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

  if (!session?.user?.id) {
    return (
      <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardContent className="p-6 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">Please log in to view your feed.</p>
        </CardContent>
      </Card>
    );
  }

  if (profileLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-64 w-full bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-64 w-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardContent className="p-6 text-center space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">You need a social profile to use the feed.</p>
          <Button asChild>
            <Link href="/social/profile/new">
              Create Social Profile
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <CreateSocialPost onCreated={fetchFeed} groupId={groupId} />
      
      {posts.length === 0 && (
        <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">No posts yet. Be the first to share a run!</p>
          </CardContent>
        </Card>
      )}
      
      {posts.slice(0, visibleCount).map((post) => {
        const avatarUrl = post.socialProfile?.user?.avatarUrl || post.socialProfile?.profilePhoto;
        const isDefaultAvatar = !avatarUrl || avatarUrl === "/default_profile.png" || avatarUrl === "" || avatarUrl?.includes("default_profile");
        
        // Debug logging to understand the avatar issue
        if (process.env.NODE_ENV === 'development') {
          console.log('SocialFeed Avatar Debug:', {
            postId: post.id,
            username: post.socialProfile?.username,
            userAvatarUrl: post.socialProfile?.user?.avatarUrl,
            profilePhoto: post.socialProfile?.profilePhoto,
            finalAvatarUrl: avatarUrl,
            isDefaultAvatar: isDefaultAvatar
          });
        }
        
        return (
          <Card key={post.id} className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              
              {/* Header with Avatar and Username */}
              <div className="flex items-center gap-3 mb-4">
                <SocialAvatar
                  avatarUrl={avatarUrl}
                  username={post.socialProfile?.username || "avatar"}
                  size={40}
                  className="w-10 h-10"
                />
                <div className="flex-1">
                  {post.socialProfile?.username && (
                    <Link
                      href={`/u/${post.socialProfile.username}`}
                      className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {post.socialProfile.username}
                    </Link>
                  )}
                  <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <Clock className="w-3 h-3" />
                    {new Date(post.createdAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
              
              {/* Run Stats */}
              <div className="mb-4">
                <div className="inline-flex items-center gap-3 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{post.distance}</span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">mi</span>
                  </div>
                  <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600"></div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{post.time}</span>
                  </div>
                </div>
              </div>
              
              {/* Caption */}
              {post.caption && (
                <p className="text-zinc-700 dark:text-zinc-300 mb-4 leading-relaxed">{post.caption}</p>
              )}
              
              {/* Photo */}
              {post.photoUrl && (
                <div className="mb-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.photoUrl}
                        alt="Run photo"
                        className="rounded-lg w-full max-h-80 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                      />
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.photoUrl}
                        alt="Run photo"
                        className="w-full h-auto object-contain"
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              )}
              
              {/* Actions */}
              <div>
                {/* Action Buttons - Fixed Position */}
                <div className="flex items-center gap-4 mb-3">
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
              
            </CardContent>
          </Card>
        );
      })}
      
      <div ref={bottomRef} className="h-1" />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Spinner className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}
