import { Skeleton, SkeletonCard, SkeletonRow } from "@/components/ui/Skeleton";

export default function SolarLoading() {
  return (
    <main
      data-accent="solar"
      aria-busy="true"
      aria-label="Loading Solar"
      className="min-h-[80dvh] px-6 pb-24 pt-36 sm:pt-44"
    >
      <div className="mx-auto max-w-[1600px] space-y-20">
        <div className="space-y-5">
          <Skeleton className="h-3.5 w-48 rounded-full" />
          <Skeleton className="h-14 w-80 max-w-full" />
          <Skeleton className="h-4 w-[520px] max-w-full" />
          <Skeleton className="h-24 w-24 rounded-2xl" />
          <div className="flex flex-wrap gap-3 pt-2">
            <Skeleton className="h-11 w-40 rounded-full" />
            <Skeleton className="h-11 w-32 rounded-full" />
            <Skeleton className="h-11 w-32 rounded-full" />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        <div className="mx-auto max-w-[960px] space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
