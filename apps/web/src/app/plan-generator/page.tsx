import PlanGenerator from "@components/training/PlanGenerator";

const PlanGeneratorPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <PlanGenerator />
      </div>
    </div>
  );
};

export default PlanGeneratorPage;
