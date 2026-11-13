import { Skeleton, SkeletonRow } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading Dashboard"
      className="min-h-[80dvh] px-6 pb-24 pt-32 sm:pt-40"
    >
      <div className="mx-auto max-w-[1280px] space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-40 rounded-full" />
          <Skeleton className="h-10 w-64 max-w-full" />
        </div>

        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-full" />
          ))}
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
