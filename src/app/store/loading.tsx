import "@/components/store/store.css";
import { Skeleton } from "@/components/ui/Skeleton";

export default function StoreLoading() {
  return (
    <main data-accent="store" aria-busy="true" aria-label="Loading Store">
      {/* PageHero */}
      <section className="mx-auto max-w-[1440px] px-6 pb-16 pt-36 sm:pt-44">
        <Skeleton className="h-3.5 w-40 rounded-full" />
        <Skeleton className="mt-5 h-12 w-72 max-w-full sm:h-16" />
        <Skeleton className="mt-5 h-4 w-[500px] max-w-full" />
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <Skeleton className="h-12 w-40 rounded-full" />
          <Skeleton className="h-12 w-36 rounded-full" />
        </div>
      </section>

      {/* 3 Store Feature Cards */}
      <section className="mx-auto grid max-w-[1180px] gap-4 px-6 pb-16 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <Skeleton className="mt-1 h-6 w-6 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
            </div>
          </div>
        ))}
      </section>

      {/* Store Ranks Grid (.store-rank-grid + .store-rank) */}
      <section className="mx-auto max-w-[1600px] px-6 pb-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-3.5 w-28 rounded-full" />
            <Skeleton className="h-10 w-56 max-w-full" />
          </div>
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>

        <div className="store-rank-grid">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="store-rank-reveal">
              <div className="store-rank h-full">
                <Skeleton className="store-rank-badge h-6 w-16 rounded-full" />
                <div className="store-rank-top">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-24 w-24 rounded-2xl" />
                </div>
                <Skeleton className="h-9 w-36 max-w-full" />
                <Skeleton className="mt-6 h-7 w-24" />
                <div className="store-rank-perks">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-5/6" />
                  <Skeleton className="h-3.5 w-4/5" />
                  <Skeleton className="h-3.5 w-2/3" />
                </div>
                <div className="store-rank-actions">
                  <Skeleton className="h-12 flex-1 rounded-full" />
                  <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
