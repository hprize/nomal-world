export function GatheringGridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-6 lg:gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="aspect-[4/3] w-full bg-muted rounded-xl animate-pulse" />
          <div className="space-y-2 px-1">
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
