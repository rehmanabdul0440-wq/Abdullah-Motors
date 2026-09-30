import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-surface/60",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent",
        className,
      )}
    />
  );
}

export function CarCardSkeleton() {
  return (
    <div className="glass-surface overflow-hidden rounded-2xl">
      <Shimmer className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Shimmer className="h-4 w-1/3" />
        <Shimmer className="h-6 w-3/4" />
        <div className="flex gap-2 pt-2">
          <Shimmer className="h-5 w-16 rounded-full" />
          <Shimmer className="h-5 w-16 rounded-full" />
          <Shimmer className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-3">
          <Shimmer className="h-7 w-24" />
          <Shimmer className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function CarGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CarCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CarDetailsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Shimmer className="h-4 w-64" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Shimmer className="aspect-[16/10] w-full rounded-2xl" />
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Shimmer key={i} className="aspect-[16/10] rounded-xl" />
            ))}
          </div>
          <div className="space-y-3 pt-6">
            <Shimmer className="h-5 w-24" />
            <Shimmer className="h-10 w-2/3" />
            <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Shimmer key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <Shimmer className="h-64 rounded-2xl" />
          <Shimmer className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
