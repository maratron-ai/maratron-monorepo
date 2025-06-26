import CreateGroupForm from "@components/social/CreateGroupForm";

export default function NewGroupPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 max-w-screen-lg py-8 flex justify-center">
        <CreateGroupForm />
      </main>
    </div>
  );
}
