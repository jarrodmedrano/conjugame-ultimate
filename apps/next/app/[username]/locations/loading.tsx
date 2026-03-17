/**
 * Loading state for locations list page
 * Displayed while locations are being fetched
 */

export default function Loading() {
  return (
    <div className="p-6">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="mb-4 h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-6 flex items-center justify-between">
          <div className="h-10 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-10 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
          >
            <div className="mb-3 h-6 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
