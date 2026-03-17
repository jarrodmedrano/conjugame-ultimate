# User API Key Management — Design

**Date:** 2026-03-13
**Status:** Approved

## Overview

Allow users to enter their own Anthropic or OpenAI API keys to unlock AI content generation. Keys are encrypted at rest using AES-256-GCM. Users without a configured key see a paywall gate offering to add their key or upgrade to Pro (future: Pro plan includes AI).

---

## 1. Secure Storage

**Encryption: AES-256-GCM (industry standard)**

- Master encryption key: `API_KEY_ENCRYPTION_KEY` env var (32 random bytes, base64-encoded)
- Each stored key gets a unique random 12-byte IV
- AES-256-GCM produces a 16-byte auth tag for integrity verification
- Stored fields: `encrypted_key`, `iv`, `auth_tag`, `provider`
- Raw key never touches the DB or logs
- Last 4 characters stored separately as `masked_key` for display only

**New migration: `user_api_keys` table**

```sql
CREATE TABLE user_api_keys (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai')),
  encrypted_key BYTEA NOT NULL,
  iv            BYTEA NOT NULL,
  auth_tag      BYTEA NOT NULL,
  masked_key    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
```

---

## 2. Encryption Utility

New file: `apps/next/lib/api-key-encryption.ts`

- `encryptApiKey(rawKey: string): EncryptedKey` — encrypts, returns `{ encryptedKey, iv, authTag, maskedKey }`
- `decryptApiKey(encrypted: EncryptedKey): string` — decrypts, returns raw key
- Uses Node.js built-in `crypto` module (no extra dependencies)
- `maskedKey` format: first 8 chars + `••••` + last 4 chars (e.g. `sk-ant-ap••••abcd`)

---

## 3. API Routes

All endpoints: rate-limited (`RateLimitConfigs.api`), authenticated (`requireAuth`), ownership-verified.

### `POST /api/user/api-keys`

- Body: `{ provider: 'anthropic' | 'openai', apiKey: string }`
- Validates key format: Anthropic (`sk-ant-`), OpenAI (`sk-`)
- Encrypts key, upserts to `user_api_keys`
- Returns `{ provider, maskedKey }`

### `GET /api/user/api-keys`

- Returns list of configured providers with masked keys
- Example: `[{ provider: 'anthropic', maskedKey: 'sk-ant-ap••••abcd', createdAt }]`
- No decryption — reads `masked_key` column only

### `DELETE /api/user/api-keys/[provider]`

- Deletes the row for that provider
- Returns `{ success: true }`

### Modified: `POST /api/generate/[entityType]`

- Replace subscription gate with: check `user_api_keys` for any configured provider
- If no key → return `{ error: 'api_key_required' }` with status 403
- If key found → decrypt, use for request, discard from memory immediately after
- Provider selection: use whichever key the user has (Anthropic preferred; fall back to OpenAI)

---

## 4. Validation Schema

New file: `apps/next/lib/validations/api-key.ts`

```typescript
const SaveApiKeySchema = z.object({
  provider: z.enum(['anthropic', 'openai']),
  apiKey: z.string().min(20).max(200).trim(),
})
```

---

## 5. Database Queries

New file: `apps/database/queries/user_api_keys.sql`

- `GetApiKeysByUserId` — fetch all rows for a user (for GET endpoint)
- `GetApiKeyByUserIdAndProvider` — fetch single row (for generate route)
- `UpsertApiKey` — insert or update on conflict (user_id, provider)
- `DeleteApiKey` — delete by user_id + provider

---

## 6. UI — Profile Page (`/[userId]`)

New "AI Generation" section added to the profile screen.

**State A — No keys configured:**

- Heading + description text
- Provider dropdown (Anthropic / OpenAI) + API key input + Save button
- Note: "Your key is encrypted and never shared."

**State B — Key(s) configured:**

- Row per provider: checkmark, provider name, masked key, Remove button
- Form below to add/update additional provider

**AI generation paywall gate** (shown in generate form when no key exists):

- Message: add your key or upgrade to Pro
- Two CTAs: `[Add API Key]` (links to profile page `#ai-keys`) and `[Upgrade to Pro]`

---

## 7. Files to Create/Modify

| Action | File                                                    |
| ------ | ------------------------------------------------------- |
| Create | `apps/database/migration/000012_user_api_keys.up.sql`   |
| Create | `apps/database/migration/000012_user_api_keys.down.sql` |
| Create | `apps/database/queries/user_api_keys.sql`               |
| Create | `apps/next/lib/api-key-encryption.ts`                   |
| Create | `apps/next/lib/validations/api-key.ts`                  |
| Create | `apps/next/app/api/user/api-keys/route.ts`              |
| Create | `apps/next/app/api/user/api-keys/[provider]/route.ts`   |
| Modify | `apps/next/app/api/generate/[entityType]/route.ts`      |
| Modify | `apps/next/lib/ai/provider.ts`                          |
| Modify | Profile screen to add AI Keys section                   |

---

## 8. Environment Variables

Add to `.env.example`:

```
API_KEY_ENCRYPTION_KEY=   # 32 random bytes, base64-encoded. Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
