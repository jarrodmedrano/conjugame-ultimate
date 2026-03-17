'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Zap, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'

interface SubscriptionStatus {
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

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active' || status === 'trialing') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-sm font-medium text-green-400">
        <CheckCircle className="h-4 w-4" aria-hidden="true" />
        {status === 'trialing' ? 'Trialing' : 'Active'}
      </span>
    )
  }
  if (status === 'past_due') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-sm font-medium text-amber-400">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        Past due
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-500/20 px-3 py-1 text-sm font-medium text-gray-400">
      <XCircle className="h-4 w-4" aria-hidden="true" />
      {status === 'canceled' ? 'Canceled' : 'Inactive'}
    </span>
  )
}

export default function SubscriptionPage() {
  const params = useParams<{ username: string }>()
  const searchParams = useSearchParams()
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const showSuccess = searchParams.get('success') === 'true'

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/subscription/status')
        if (res.ok) {
          const data = (await res.json()) as SubscriptionStatus
          setSubscription(data)
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchStatus()
  }, [])

  const handleManage = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/subscription/portal', { method: 'POST' })
      if (res.ok) {
        const data = (await res.json()) as { url: string }
        if (data.url) window.location.href = data.url
      }
    } finally {
      setPortalLoading(false)
    }
  }

  const handleSubscribe = async () => {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/subscription/checkout', { method: 'POST' })
      if (res.ok) {
        const data = (await res.json()) as { url: string }
        if (data.url) window.location.href = data.url
      }
    } finally {
      setCheckoutLoading(false)
    }
  }

  const isSubscribed =
    subscription?.status === 'active' || subscription?.status === 'trialing'

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      {showSuccess && (
        <div className="mb-8 flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          <CheckCircle
            className="h-5 w-5 flex-shrink-0 text-green-400"
            aria-hidden="true"
          />
          Subscription activated! You now have unlimited access.
        </div>
      )}

      <h1 className="text-2xl font-bold text-white">Subscription</h1>
      <p className="mt-2 text-gray-400">
        Manage your Conjugame Pro subscription.
      </p>

      {isLoading ? (
        <div className="mt-8 h-32 animate-pulse rounded-lg bg-white/5" />
      ) : (
        <>
          {/* Status card */}
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Current plan</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {isSubscribed ? 'Conjugame Pro' : 'Preview (Free)'}
                </p>
              </div>
              {subscription && <StatusBadge status={subscription.status} />}
            </div>

            {isSubscribed && subscription?.currentPeriodEnd && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-sm text-gray-400">
                  {subscription.cancelAtPeriodEnd
                    ? 'Access until'
                    : 'Renews on'}
                  :{' '}
                  <span className="text-white">
                    {formatDate(subscription.currentPeriodEnd)}
                  </span>
                </p>
                {subscription.cancelAtPeriodEnd && (
                  <p className="mt-1 text-sm text-amber-400">
                    Your subscription is set to cancel at the end of this
                    period.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action */}
          {isSubscribed ? (
            <div className="mt-6">
              <Button
                onClick={handleManage}
                disabled={portalLoading}
                variant="outline"
                className="w-full"
              >
                {portalLoading ? 'Opening portal…' : 'Manage subscription'}
              </Button>
              <p className="mt-2 text-center text-xs text-gray-500">
                Cancel, update payment method, or view invoices via Stripe.
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <button
                onClick={handleSubscribe}
                disabled={checkoutLoading}
                className="shadow-xs flex w-full items-center justify-center gap-2 rounded-md bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Zap className="h-4 w-4" aria-hidden="true" />
                {checkoutLoading ? 'Redirecting…' : 'Upgrade to Pro — $9.99/mo'}
              </button>
              <p className="mt-2 text-center text-xs text-gray-500">
                Cancel anytime. Your data is never deleted.
              </p>

              {/* Preview limits summary */}
              <div className="mt-8 rounded-lg border border-white/10 p-4">
                <p className="text-sm font-medium text-gray-300">
                  Preview mode limits
                </p>
                <ul className="mt-3 space-y-1 text-sm text-gray-400">
                  <li>• {subscription?.previewLimits.stories ?? 1} story</li>
                  <li>
                    • {subscription?.previewLimits.characters ?? 10} characters
                  </li>
                  <li>
                    • {subscription?.previewLimits.locations ?? 10} locations
                  </li>
                  <li>
                    • {subscription?.previewLimits.timelines ?? 1} timeline
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div className="mt-8">
            <a
              href={`/${params.username}`}
              className="text-sm text-gray-500 hover:text-gray-300"
            >
              ← Back to dashboard
            </a>
          </div>
        </>
      )}
    </main>
  )
}
