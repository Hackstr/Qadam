export function SkeletonCard() {
  return (
    <div className="border border-black/[0.06] rounded-2xl overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="flex justify-between mt-4">
          <div className="h-3 bg-gray-100 rounded w-20" />
          <div className="h-3 bg-gray-100 rounded w-16" />
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
