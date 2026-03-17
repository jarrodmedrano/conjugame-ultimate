'use client'
import { useState } from 'react'
import { Check, Zap } from 'lucide-react'

const FREE_FEATURES = [
  '1 story',
  '10 characters',
  '10 locations',
  '1 timeline',
  'Image galleries',
  'Public sharing',
]

const PRO_FEATURES = [
  'Unlimited stories',
  'Unlimited characters',
  'Unlimited locations',
  'Unlimited timelines',
  'Image galleries',
  'Public sharing',
  'Priority support',
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

interface PricingProps {
  onSubscribe?: () => void
}

export const Pricing = ({ onSubscribe }: PricingProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
    if (onSubscribe) {
      onSubscribe()
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
      })
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/signin?redirect=/about/pricing'
          return
        }
        const data = (await response.json().catch(() => ({}))) as {
          error?: string
        }
        throw new Error(data.error ?? 'Failed to create checkout session')
      }
      const data = (await response.json()) as { url: string }
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900">
      <main>
        {/* Header */}
        <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-32 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-base font-semibold leading-7 text-indigo-400">
              Pricing
            </h1>
            <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Start free. Upgrade when you&apos;re ready.
            </p>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-300">
            Build your story bible for free. Subscribe for unlimited worlds,
            characters, and creative freedom.
          </p>

          {/* Pricing cards */}
          <div className="isolate mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            {/* Free tier */}
            <div className="rounded-3xl p-8 ring-1 ring-white/10 xl:p-10">
              <div className="flex items-center justify-between gap-x-4">
                <h2 className="text-lg font-semibold leading-8 text-white">
                  Preview
                </h2>
                <p className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold leading-5 text-white">
                  Free forever
                </p>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-300">
                Explore Story Bible and start building your creative world with
                no commitment.
              </p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-white">
                  $0
                </span>
                <span className="text-sm font-semibold leading-6 text-gray-300">
                  /month
                </span>
              </p>
              <a
                href="/signin"
                className="mt-6 block rounded-md bg-white/10 px-3 py-2 text-center text-sm font-semibold leading-6 text-white hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get started free
              </a>
              <ul
                role="list"
                className="mt-8 space-y-3 text-sm leading-6 text-gray-300 xl:mt-10"
              >
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check
                      className="h-6 w-5 flex-none text-white"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro tier */}
            <div className="rounded-3xl bg-white/5 p-8 ring-2 ring-indigo-500 xl:p-10">
              <div className="flex items-center justify-between gap-x-4">
                <h2 className="text-lg font-semibold leading-8 text-white">
                  Pro
                </h2>
                <p className="rounded-full bg-indigo-500 px-2.5 py-1 text-xs font-semibold leading-5 text-white">
                  Most popular
                </p>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-300">
                Unlock unlimited stories, characters, locations, and timelines.
                Build entire universes.
              </p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-white">
                  $9.99
                </span>
                <span className="text-sm font-semibold leading-6 text-gray-300">
                  /month
                </span>
              </p>
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className={classNames(
                  'mt-6 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500',
                  loading
                    ? 'cursor-not-allowed bg-indigo-400 text-white'
                    : 'shadow-2xs bg-indigo-500 text-white hover:bg-indigo-400',
                )}
              >
                <Zap className="h-4 w-4" aria-hidden="true" />
                {loading ? 'Redirecting…' : 'Subscribe — $9.99/mo'}
              </button>
              {error && (
                <p className="mt-3 text-center text-sm text-red-400">{error}</p>
              )}
              <ul
                role="list"
                className="mt-8 space-y-3 text-sm leading-6 text-gray-300 xl:mt-10"
              >
                {PRO_FEATURES.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check
                      className="h-6 w-5 flex-none text-white"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* FAQ */}
          <div className="mx-auto mt-24 max-w-2xl pb-24">
            <h2 className="text-2xl font-bold leading-10 tracking-tight text-white">
              Frequently asked questions
            </h2>
            <dl className="mt-10 space-y-8">
              <div>
                <dt className="text-base font-semibold leading-7 text-white">
                  Can I cancel anytime?
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-300">
                  Yes. You can cancel at any time from the subscription
                  management page. You retain Pro access until the end of your
                  current billing period.
                </dd>
              </div>
              <div>
                <dt className="text-base font-semibold leading-7 text-white">
                  What happens to my data if I downgrade?
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-300">
                  Your existing stories and characters are never deleted.
                  You&apos;ll just be unable to create new ones beyond the
                  preview limits until you resubscribe.
                </dd>
              </div>
              <div>
                <dt className="text-base font-semibold leading-7 text-white">
                  Is billing monthly or annually?
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-300">
                  Currently monthly only. Annual billing with a discount is
                  coming soon.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  )
}
