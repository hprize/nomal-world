export default function HomeLoading() {
  return (
    <main className="min-h-screen">
      {/* Header skeleton */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted rounded animate-pulse mt-1" />
        </div>
      </header>

      {/* Category filter skeleton */}
      <section className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-16 bg-muted rounded-full animate-pulse" />
          ))}
        </div>
      </section>

      {/* Card grid skeleton */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-6 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
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
      </section>
    </main>
  );
}
