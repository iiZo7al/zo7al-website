import { SkeletonPageShell } from "@/components/ui/Skeleton";

export default function StoreLoading() {
  return (
    <div data-accent="store">
      <SkeletonPageShell cards={6} columns="sm:grid-cols-2 lg:grid-cols-3" />
    </div>
  );
}
