import "@/components/community/community.css";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Loading">
      <section className="mx-auto max-w-[1440px] px-6 pb-16 pt-36 sm:pt-44">
        <Skeleton className="h-3.5 w-40 rounded-full" />
        <Skeleton className="mt-5 h-12 w-72 max-w-full sm:h-16" />
        <Skeleton className="mt-5 h-4 w-[500px] max-w-full" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-24">
        <div className="community-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <article key={i} className="community-card">
              <div className="community-card-header">
                <Skeleton className="community-symbol" />
                <Skeleton className="h-5 w-40 max-w-full" />
              </div>
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="mt-auto h-10 w-28 rounded-full" />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
