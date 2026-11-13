import type { HTMLAttributes } from "react";

export function Skeleton({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer rounded-xl ${className}`}
      {...props}
    />
  );
}

export function SkeletonRow({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 ${className}`}
    >
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-40 max-w-[60%]" />
        <Skeleton className="h-3 w-24 max-w-[40%]" />
      </div>
      <Skeleton className="h-7 w-20 shrink-0 rounded-full" />
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 ${className}`}
    >
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="space-y-2.5">
        <Skeleton className="h-3.5 w-24 rounded-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonPageShell({
  cards = 6,
  columns = "sm:grid-cols-2 lg:grid-cols-3",
}: {
  cards?: number;
  columns?: string;
}) {
  return (
    <main
      aria-busy="true"
      aria-label="Loading"
      className="min-h-[75dvh] px-6 pb-24 pt-36 sm:pt-44"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="space-y-4">
          <Skeleton className="h-3.5 w-44 rounded-full" />
          <Skeleton className="h-12 w-72 max-w-full sm:h-16" />
          <Skeleton className="h-4 w-[520px] max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>

        <div className={`mt-14 grid gap-6 ${columns}`}>
          {Array.from({ length: cards }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
