import SocialFeed from "@components/social/SocialFeed";

export default function FeedPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold mb-4">Your Feed</h1>
        <SocialFeed />
      </main>
    </div>
  );
}
