-- Subscriptions

-- name: GetSubscriptionByUserId :one
SELECT id, user_id, stripe_customer_id, status, price_id, current_period_end, cancel_at_period_end, created_at, updated_at
FROM subscriptions
WHERE user_id = $1
LIMIT 1;

-- name: GetSubscriptionByStripeCustomerId :one
SELECT id, user_id, stripe_customer_id, status, price_id, current_period_end, cancel_at_period_end, created_at, updated_at
FROM subscriptions
WHERE stripe_customer_id = $1
LIMIT 1;

-- name: UpsertSubscription :one
INSERT INTO subscriptions (id, user_id, stripe_customer_id, status, price_id, current_period_end, cancel_at_period_end, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET
    id = EXCLUDED.id,
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    status = EXCLUDED.status,
    price_id = EXCLUDED.price_id,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    updated_at = NOW()
RETURNING *;

-- name: UpdateSubscriptionStatus :one
UPDATE subscriptions
SET status = $2,
    cancel_at_period_end = $3,
    current_period_end = $4,
    updated_at = NOW()
WHERE user_id = $1
RETURNING *;

-- Entity counts per user (for quota enforcement)

-- name: CountStoriesForUser :one
SELECT COUNT(*) AS count FROM stories WHERE "userId" = $1;

-- name: CountCharactersForUser :one
SELECT COUNT(*) AS count FROM characters WHERE "userId" = $1;

-- name: CountLocationsForUser :one
SELECT COUNT(*) AS count FROM locations WHERE "userId" = $1;

-- name: CountTimelinesForUser :one
SELECT COUNT(*) AS count FROM timelines WHERE "userId" = $1;
