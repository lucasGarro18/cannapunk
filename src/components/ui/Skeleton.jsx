export function ProductCardSkeleton() {
  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="skeleton aspect-square rounded-none" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-2.5 w-14 rounded-full" />
        <div className="skeleton h-3.5 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton h-4 w-1/2 rounded mt-1" />
      </div>
    </div>
  )
}

export function VideoCardSkeleton() {
  return <div className="skeleton rounded-2xl" style={{ aspectRatio: '9/16' }} />
}

export function ListItemSkeleton() {
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className="skeleton w-16 h-16 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-1/4 rounded-full" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
      <div className="skeleton w-20 h-8 rounded-xl flex-shrink-0" />
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Hero — centered avatar */}
      <div
        className="relative flex flex-col items-center pt-14 pb-8 gap-5 overflow-hidden"
        style={{ minHeight: 300, background: 'linear-gradient(175deg, #0a0a0c 0%, #101410 100%)' }}
      >
        <div className="skeleton rounded-full flex-shrink-0" style={{ width: 104, height: 104 }} />
        <div className="space-y-2 text-center">
          <div className="skeleton h-7 w-40 rounded-xl mx-auto" />
          <div className="skeleton h-3 w-28 rounded-full mx-auto" />
        </div>
      </div>
      {/* Bio + role badges */}
      <div className="px-5 pt-5 space-y-3">
        <div className="skeleton h-3 w-56 rounded mx-auto" />
        <div className="flex gap-2 justify-center">
          <div className="skeleton h-10 w-28 rounded-2xl" />
          <div className="skeleton h-10 w-24 rounded-2xl" />
        </div>
      </div>
      {/* Stats bento */}
      <div className="px-5 pt-5 space-y-2">
        <div className="skeleton h-28 rounded-3xl" />
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-3xl" />)}
        </div>
      </div>
      {/* Actions */}
      <div className="px-5 pt-4">
        <div className="skeleton h-12 rounded-2xl" />
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return <div className="skeleton h-20 rounded-2xl" />
}
