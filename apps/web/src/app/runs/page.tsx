import RunsList from "@components/runs/RunsList";

export default function RunsPage() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 p-4">
      <h1 className="text-2xl font-bold mb-4">All Runs</h1>
      <RunsList />
    </div>
  );
}
