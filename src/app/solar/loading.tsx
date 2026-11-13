import "@/components/store/store.css";
import "@/components/community/community.css";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SolarLoading() {
  return (
    <main data-accent="solar" aria-busy="true" aria-label="Loading Solar">
      {/* PageHero */}
      <section className="mx-auto max-w-[1440px] px-6 pb-16 pt-36 sm:pt-44">
        <Skeleton className="h-3.5 w-48 rounded-full" />
        <Skeleton className="mt-5 h-12 w-80 max-w-full sm:h-16" />
        <Skeleton className="mt-5 h-4 w-[540px] max-w-full" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />

        <div className="mt-8 space-y-6">
          <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl" />
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-12 w-44 rounded-full" />
            <Skeleton className="h-12 w-32 rounded-full" />
            <Skeleton className="h-12 w-32 rounded-full" />
            <Skeleton className="h-12 w-32 rounded-full" />
          </div>
        </div>
      </section>

      {/* Divisions Section (.store-rank-grid + .store-rank) */}
      <section className="relative pb-24 sm:pb-32">
        <div className="mx-auto max-w-[1600px] px-6">
          <Skeleton className="h-3.5 w-36 rounded-full" />
          <Skeleton className="mt-3 h-10 w-56 max-w-full" />
          <div className="mt-14 store-rank-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="store-rank-reveal">
                <div className="store-rank h-full">
                  <Skeleton className="store-rank-badge h-6 w-16 rounded-full" />
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="mt-5 h-7 w-40 max-w-full" />
                  <Skeleton className="mt-3 h-3.5 w-full" />
                  <Skeleton className="mt-2 h-3.5 w-4/5" />
                  <div className="store-rank-perks">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3.5 w-4/5" />
                  </div>
                  <Skeleton className="h-12 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Members Section (.community-leader-list + .community-leader-row) */}
      <section className="relative pb-24 sm:pb-32">
        <div className="mx-auto max-w-[960px] px-6">
          <Skeleton className="h-3.5 w-36 rounded-full" />
          <Skeleton className="mt-3 h-10 w-56 max-w-full" />
          <ol className="mt-10 community-leader-list">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i}>
                <div className="community-leader-row">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="community-leader-name">
                    <Skeleton className="h-4 w-36 max-w-[60%]" />
                  </div>
                  <Skeleton className="h-6 w-24 shrink-0 rounded-full" />
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
