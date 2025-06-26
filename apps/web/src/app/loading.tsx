import { Spinner } from "@components/ui";

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner className="h-8 w-8" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
