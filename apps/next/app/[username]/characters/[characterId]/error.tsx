'use client'

import { useEffect } from 'react'
import { Button } from '@repo/ui/components/ui/button'

/**
 * Error boundary for character detail page
 */

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Character detail error:', error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Something went wrong!
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          We encountered an error while loading this character. This could be
          due to a network issue or the character may no longer exist.
        </p>

        {error.message && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-200">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex justify-center gap-4">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button onClick={() => window.history.back()} variant="outline">
            Go back
          </Button>
        </div>
      </div>
    </div>
  )
}
