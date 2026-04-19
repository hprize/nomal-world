export default function GatheringDetailLoading() {
  return (
    <div className="pb-8">
      {/* 모바일 이미지 skeleton */}
      <div className="lg:hidden aspect-[16/9] w-full bg-muted animate-pulse" />

      {/* 모바일 기본 정보 skeleton */}
      <div className="lg:hidden max-w-3xl mx-auto px-4">
        <section className="py-6 border-b space-y-3">
          <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
          <div className="h-7 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
        </section>

        <section className="py-6 border-b grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted animate-pulse shrink-0" />
              <div className="space-y-1">
                <div className="h-3 w-8 bg-muted rounded animate-pulse" />
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* 데스크탑 2열 skeleton */}
      <div className="max-w-6xl mx-auto lg:px-6">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-12 lg:items-start lg:pt-8">
          {/* 왼쪽 */}
          <div>
            <div className="hidden lg:block aspect-[16/9] w-full bg-muted rounded-sm mb-8 animate-pulse" />
            <section className="max-w-3xl mx-auto px-4 lg:px-0 py-8 border-t space-y-3">
              <div className="h-5 w-12 bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
              <div className="h-4 w-4/5 bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
            </section>
          </div>

          {/* 오른쪽 사이드바 skeleton */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 bg-white border rounded-xl p-6 space-y-4">
              <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
              <div className="h-6 w-4/5 bg-muted rounded animate-pulse" />
              <div className="h-4 w-3/5 bg-muted rounded animate-pulse" />
              <div className="border-t pt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted animate-pulse shrink-0" />
                    <div className="space-y-1">
                      <div className="h-3 w-8 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <div className="h-12 w-full bg-muted rounded-xl animate-pulse" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
