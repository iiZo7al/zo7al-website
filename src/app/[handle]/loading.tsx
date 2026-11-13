import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function ProfileLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading Profile"
      className="min-h-[80dvh] px-6 pb-24 pt-36 sm:pt-44"
    >
      <div className="mx-auto max-w-[920px] space-y-8">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 flex flex-wrap items-center gap-6">
          <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-8 w-52 max-w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </main>
  );
}
