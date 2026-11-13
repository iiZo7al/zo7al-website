import "@/components/account/account.css";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProfileLoading() {
  return (
    <main
      className="public-member-profile"
      aria-busy="true"
      aria-label="Loading Profile"
    >
      <div className="member-profile-cover skeleton-shimmer" />
      <div className="member-profile-inner">
        <header className="member-profile-header">
          <div className="member-profile-avatar">
            <Skeleton className="h-full w-full rounded-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-8 w-48 max-w-full" />
            <Skeleton className="h-4 w-28" />
          </div>
        </header>

        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-96 max-w-full" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>

        <div className="hub-actions member-profile-socials">
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>

        <section className="mt-12">
          <Skeleton className="mb-6 h-7 w-40" />
          <div className="member-submissions-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <article key={i} className="account-card space-y-3">
                <Skeleton className="h-44 w-full rounded-2xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3.5 w-full" />
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
