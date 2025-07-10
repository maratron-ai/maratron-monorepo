import SocialFeed from "@components/social/SocialFeed";

export default function FeedPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Your Feed</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Latest posts from runners you follow.</p>
        </div>
        <SocialFeed />
      </div>
    </div>
  );
}
