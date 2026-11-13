import { Skeleton } from "@/components/ui/Skeleton";

export default function AccountLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading Account"
      className="min-h-[80dvh] px-6 pb-24 pt-36 sm:pt-44"
    >
      <div className="mx-auto max-w-[960px] space-y-8">
        <div className="flex items-center gap-5">
          <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-7 w-48 max-w-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </main>
  );
}
