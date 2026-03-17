/**
 * Loading state for story detail page
 * Displayed while story data is being fetched
 */

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="mb-4 h-8 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-4 flex gap-4">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-10 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-10 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="mb-8 space-y-4">
        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-4/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Toggle button skeleton */}
      <div className="mb-4 h-10 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}
