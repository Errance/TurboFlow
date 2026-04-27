function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden ${className}`}
    >
      <div className="h-full w-full animate-pulse bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  )
}

export function SoccerListSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        <aside className="md:w-56 shrink-0 space-y-2">
          <SkeletonBlock className="h-6 w-24" />
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-10" />
          ))}
        </aside>
        <main className="flex-1 min-w-0 space-y-6">
          {Array.from({ length: 2 }).map((_, group) => (
            <section key={group} className="space-y-3">
              <SkeletonBlock className="h-5 w-44" />
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                {Array.from({ length: 5 }).map((_, row) => (
                  <SkeletonBlock key={row} className="h-[58px] rounded-none border-0 border-b border-[var(--border)]" />
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  )
}

export function SoccerMatchSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <SkeletonBlock className="h-5 w-64 mb-4" />
      <div className="flex flex-row gap-6">
        <main className="flex-1 min-w-0 space-y-3">
          <SkeletonBlock className="h-28" />
          <SkeletonBlock className="h-10" />
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-28" />
          ))}
        </main>
        <aside className="w-[380px] shrink-0 space-y-4 hidden lg:block">
          <SkeletonBlock className="h-56" />
          <SkeletonBlock className="h-72" />
        </aside>
      </div>
    </div>
  )
}
