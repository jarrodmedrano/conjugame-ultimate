-- Migration: Create subscriptions table
-- Created: 2026-02-19

CREATE TABLE subscriptions (
    id TEXT PRIMARY KEY,                          -- Stripe subscription ID
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'inactive'
        CHECK (status IN ('active', 'inactive', 'canceled', 'past_due', 'trialing')),
    price_id TEXT,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One subscription record per user
CREATE UNIQUE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- Index for webhook lookups by Stripe customer ID
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

COMMENT ON TABLE subscriptions IS 'Stores Stripe subscription state per user';
COMMENT ON COLUMN subscriptions.id IS 'Stripe subscription ID (sub_...)';
COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'Stripe customer ID (cus_...)';
COMMENT ON COLUMN subscriptions.status IS 'Stripe subscription status';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'True when user cancels but period has not ended yet';
