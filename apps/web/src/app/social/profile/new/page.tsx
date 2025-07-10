import SocialProfileForm from "@components/social/SocialProfileForm";

export default function NewSocialProfilePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Create Your Profile</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Set up your social profile to connect with other runners.</p>
        </div>
        <SocialProfileForm />
      </div>
    </div>
  );
}
