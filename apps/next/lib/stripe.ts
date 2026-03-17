import Stripe from 'stripe'

let _instance: Stripe | undefined

function getInstance(): Stripe {
  if (!_instance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        'STRIPE_SECRET_KEY environment variable is required. Add it to your .env file.',
      )
    }
    _instance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  }
  return _instance
}

// Lazy singleton — throws only when first used, not at module load time.
export const stripe = new Proxy<Stripe>({} as Stripe, {
  get(_target, prop: string | symbol) {
    const instance = getInstance()
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value
  },
})
