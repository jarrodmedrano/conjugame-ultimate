import { useState, useEffect } from 'react'

export interface SubscriptionStatus {
  subscribed: boolean
  status: string
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
  previewLimits: {
    stories: number
    characters: number
    locations: number
    timelines: number
  }
}

interface UseSubscriptionStatusResult {
  subscription: SubscriptionStatus | null
  isLoading: boolean
}

const DEFAULT_LIMITS = {
  stories: 1,
  characters: 10,
  locations: 10,
  timelines: 1,
}

export function useSubscriptionStatus(): UseSubscriptionStatusResult {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/subscription/status')
        if (!response.ok) {
          throw new Error('Failed to fetch subscription status')
        }
        const data = (await response.json()) as SubscriptionStatus
        if (!cancelled) {
          setSubscription(data)
        }
      } catch {
        if (!cancelled) {
          // Default to preview mode limits on error
          setSubscription({
            subscribed: false,
            status: 'inactive',
            cancelAtPeriodEnd: false,
            currentPeriodEnd: null,
            previewLimits: DEFAULT_LIMITS,
          })
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchStatus()

    return () => {
      cancelled = true
    }
  }, [])

  return { subscription, isLoading }
}
