# User API Key Management — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to store their own Anthropic or OpenAI API keys (encrypted at rest) so they can use AI generation without a subscription.

**Architecture:** Keys are encrypted with AES-256-GCM using a server-side master key from env. The generate route checks for a user key first; if none exists it returns a `api_key_required` error that the UI converts into a paywall gate. The profile page (`/[userId]`) gets a new "AI Generation" section.

**Tech Stack:** Node.js `crypto` (built-in), PostgreSQL, Next.js App Router, Zod, React hooks, Tailwind CSS, Lucide icons.

---

## Task 1: DB Migration — create `user_api_keys` table

**Files:**

- Create: `apps/database/migration/000018_user_api_keys.up.sql`
- Create: `apps/database/migration/000018_user_api_keys.down.sql`

**Step 1: Write the up migration**

```sql
-- apps/database/migration/000018_user_api_keys.up.sql
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

CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);
```

**Step 2: Write the down migration**

```sql
-- apps/database/migration/000018_user_api_keys.down.sql
DROP TABLE IF EXISTS user_api_keys;
```

**Step 3: Run the migration**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate
# Check how migrations are run in this project:
cat apps/database/Makefile 2>/dev/null || cat apps/next/package.json | grep -A5 migrate
```

Find and run the migration command. It will likely be something like:

```bash
pnpm --filter database migrate
# or
make migrate
```

**Step 4: Verify the table exists**

Connect to the DB and confirm: `\d user_api_keys` shows all columns.

**Step 5: Commit**

```bash
git add apps/database/migration/000018_user_api_keys.up.sql apps/database/migration/000018_user_api_keys.down.sql
git commit -m "feat: add user_api_keys migration for encrypted API key storage"
```

---

## Task 2: Encryption Utility

**Files:**

- Create: `apps/next/lib/api-key-encryption.ts`

**Step 1: Add env var to `.env.example`**

Open `apps/next/.env.example` and add after the AI section:

```
# API Key Encryption (required for user API key storage)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
API_KEY_ENCRYPTION_KEY=
```

**Step 2: Write the encryption utility**

```typescript
// apps/next/lib/api-key-encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96 bits — recommended for GCM
const AUTH_TAG_LENGTH = 16

export interface EncryptedApiKey {
  encryptedKey: Buffer
  iv: Buffer
  authTag: Buffer
  maskedKey: string
}

function getMasterKey(): Buffer {
  const raw = process.env.API_KEY_ENCRYPTION_KEY
  if (!raw)
    throw new Error('API_KEY_ENCRYPTION_KEY environment variable is required')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32)
    throw new Error('API_KEY_ENCRYPTION_KEY must be 32 bytes (base64-encoded)')
  return key
}

function buildMaskedKey(apiKey: string): string {
  if (apiKey.length <= 12) return '••••' + apiKey.slice(-4)
  return apiKey.slice(0, 8) + '••••' + apiKey.slice(-4)
}

export function encryptApiKey(rawKey: string): EncryptedApiKey {
  const masterKey = getMasterKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, masterKey, iv)

  const encrypted = Buffer.concat([
    cipher.update(rawKey, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return {
    encryptedKey: encrypted,
    iv,
    authTag,
    maskedKey: buildMaskedKey(rawKey),
  }
}

export function decryptApiKey(encrypted: EncryptedApiKey): string {
  const masterKey = getMasterKey()
  const decipher = createDecipheriv(ALGORITHM, masterKey, encrypted.iv)
  decipher.setAuthTag(encrypted.authTag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted.encryptedKey),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}
```

**Step 3: Generate and add your local encryption key**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and add it to `apps/next/.env.local`:

```
API_KEY_ENCRYPTION_KEY=<output from above>
```

**Step 4: Commit**

```bash
git add apps/next/lib/api-key-encryption.ts apps/next/.env.example
git commit -m "feat: add AES-256-GCM encryption utility for user API keys"
```

---

## Task 3: Validation Schema

**Files:**

- Create: `apps/next/lib/validations/api-key.ts`

**Step 1: Write the schema**

```typescript
// apps/next/lib/validations/api-key.ts
import { z } from 'zod'

export const SaveApiKeySchema = z.object({
  provider: z.enum(['anthropic', 'openai']),
  apiKey: z
    .string()
    .min(20, 'API key is too short')
    .max(300, 'API key is too long')
    .trim()
    .refine((key) => key.startsWith('sk-'), 'API key must start with sk-'),
})

export type SaveApiKeyInput = z.infer<typeof SaveApiKeySchema>

export const DeleteApiKeySchema = z.object({
  provider: z.enum(['anthropic', 'openai']),
})

export type DeleteApiKeyInput = z.infer<typeof DeleteApiKeySchema>
```

**Step 2: Commit**

```bash
git add apps/next/lib/validations/api-key.ts
git commit -m "feat: add Zod validation schemas for user API key endpoints"
```

---

## Task 4: GET + DELETE API Routes

**Files:**

- Create: `apps/next/app/api/user/api-keys/route.ts`
- Create: `apps/next/app/api/user/api-keys/[provider]/route.ts`

**Step 1: Write GET route (list configured providers)**

```typescript
// apps/next/app/api/user/api-keys/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RateLimitConfigs } from '../../../../lib/rate-limit'
import { requireAuth } from '../../../../lib/auth-middleware'
import { encryptApiKey } from '../../../../lib/api-key-encryption'
import { SaveApiKeySchema } from '../../../../lib/validations/api-key'
import pool from '../../../utils/open-pool'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const client = await pool.connect()
  try {
    const result = await client.query<{
      provider: string
      masked_key: string
      created_at: string
    }>(
      `SELECT provider, masked_key, created_at FROM user_api_keys WHERE user_id = $1 ORDER BY provider`,
      [user.id],
    )

    return NextResponse.json(result.rows)
  } finally {
    client.release()
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const client = await pool.connect()
  try {
    const body = await request.json()
    const validated = SaveApiKeySchema.parse(body)

    const { encryptedKey, iv, authTag, maskedKey } = encryptApiKey(
      validated.apiKey,
    )

    await client.query(
      `INSERT INTO user_api_keys (user_id, provider, encrypted_key, iv, auth_tag, masked_key, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, provider) DO UPDATE SET
         encrypted_key = EXCLUDED.encrypted_key,
         iv = EXCLUDED.iv,
         auth_tag = EXCLUDED.auth_tag,
         masked_key = EXCLUDED.masked_key,
         updated_at = NOW()`,
      [user.id, validated.provider, encryptedKey, iv, authTag, maskedKey],
    )

    return NextResponse.json({ provider: validated.provider, maskedKey })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }
    console.error(
      'Error saving API key:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to save API key' },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
```

**Step 2: Write DELETE route**

```typescript
// apps/next/app/api/user/api-keys/[provider]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RateLimitConfigs } from '../../../../../lib/rate-limit'
import { requireAuth } from '../../../../../lib/auth-middleware'
import { DeleteApiKeySchema } from '../../../../../lib/validations/api-key'
import pool from '../../../../utils/open-pool'
import { z } from 'zod'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const client = await pool.connect()
  try {
    const { provider } = await params
    const validated = DeleteApiKeySchema.parse({ provider })

    await client.query(
      `DELETE FROM user_api_keys WHERE user_id = $1 AND provider = $2`,
      [user.id, validated.provider],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }
    console.error(
      'Error deleting API key:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
```

**Step 3: Commit**

```bash
git add apps/next/app/api/user/api-keys/
git commit -m "feat: add GET/POST/DELETE API routes for user API key management"
```

---

## Task 5: Modify Generate Route to Use User's API Key

**Files:**

- Modify: `apps/next/lib/ai/provider.ts`
- Modify: `apps/next/app/api/generate/[entityType]/route.ts`

**Step 1: Update `getAIProvider` to accept an optional key override**

Replace the contents of `apps/next/lib/ai/provider.ts`:

```typescript
// apps/next/lib/ai/provider.ts
import type { AIProvider } from './types'
import { AnthropicProvider } from './providers/anthropic'
import { OpenAIProvider } from './providers/openai'

export type SupportedProvider = 'anthropic' | 'openai'

export function getAIProvider(override?: {
  provider: SupportedProvider
  apiKey: string
}): AIProvider {
  if (override) {
    const model = process.env.AI_MODEL
    if (override.provider === 'openai') {
      return new OpenAIProvider(override.apiKey, model || 'gpt-4o')
    }
    return new AnthropicProvider(override.apiKey, model || 'claude-sonnet-4-6')
  }

  // Fall back to env-configured provider (server key)
  const providerName = process.env.AI_PROVIDER || 'anthropic'
  const model = process.env.AI_MODEL

  if (providerName === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey)
      throw new Error('OPENAI_API_KEY environment variable is required')
    return new OpenAIProvider(apiKey, model || 'gpt-4o')
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey)
    throw new Error('ANTHROPIC_API_KEY environment variable is required')
  return new AnthropicProvider(apiKey, model || 'claude-sonnet-4-6')
}
```

**Step 2: Update the generate route to use user's key**

Replace the contents of `apps/next/app/api/generate/[entityType]/route.ts`:

```typescript
// apps/next/app/api/generate/[entityType]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RateLimitConfigs } from '../../../../lib/rate-limit'
import { requireAuth } from '../../../../lib/auth-middleware'
import { GenerateEntitySchema } from '../../../../lib/validations/generate'
import {
  getAIProvider,
  type SupportedProvider,
} from '../../../../lib/ai/provider'
import { buildStoryContext } from '../../../../lib/ai/context-builder'
import { decryptApiKey } from '../../../../lib/api-key-encryption'
import pool from '../../../utils/open-pool'
import { z } from 'zod'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entityType: string }> },
) {
  // 1. Rate limiting
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.expensive)
  if (rateLimitResult) return rateLimitResult

  // 2. Authentication
  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const client = await pool.connect()
  try {
    // 3. Look up user's API key (prefer anthropic, fall back to openai)
    const keyResult = await client.query<{
      provider: string
      encrypted_key: Buffer
      iv: Buffer
      auth_tag: Buffer
    }>(
      `SELECT provider, encrypted_key, iv, auth_tag
       FROM user_api_keys
       WHERE user_id = $1
       ORDER BY CASE provider WHEN 'anthropic' THEN 1 ELSE 2 END
       LIMIT 1`,
      [user.id],
    )

    if (keyResult.rows.length === 0) {
      return NextResponse.json({ error: 'api_key_required' }, { status: 403 })
    }

    const row = keyResult.rows[0]
    const rawApiKey = decryptApiKey({
      encryptedKey: row.encrypted_key,
      iv: row.iv,
      authTag: row.auth_tag,
      maskedKey: '', // not needed for decryption
    })

    // 4. Validate input
    const body = await request.json()
    const { entityType } = await params
    const validated = GenerateEntitySchema.parse({ ...body, entityType })

    // 5. Build story context
    const context = await buildStoryContext(client, validated.storyId)

    // 6. Generate with user's API key
    const provider = getAIProvider({
      provider: row.provider as SupportedProvider,
      apiKey: rawApiKey,
    })
    const result = await provider.generate(
      {
        entityType: validated.entityType,
        prompt: validated.prompt,
        storyId: validated.storyId,
      },
      context,
    )

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }
    console.error(
      'AI generation failed:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
```

**Step 3: Commit**

```bash
git add apps/next/lib/ai/provider.ts apps/next/app/api/generate/
git commit -m "feat: use user's decrypted API key for AI generation, gate on api_key_required"
```

---

## Task 6: `useApiKeys` Hook

**Files:**

- Create: `packages/app/features/user/hooks/useApiKeys.ts`

**Step 1: Write the hook**

```typescript
// packages/app/features/user/hooks/useApiKeys.ts
import { useState, useEffect, useCallback } from 'react'

export type Provider = 'anthropic' | 'openai'

export interface ApiKeyEntry {
  provider: Provider
  maskedKey: string
  createdAt: string
}

interface UseApiKeysResult {
  keys: ApiKeyEntry[]
  isLoading: boolean
  isSaving: boolean
  saveKey: (provider: Provider, apiKey: string) => Promise<void>
  removeKey: (provider: Provider) => Promise<void>
  error: string | null
}

export function useApiKeys(): UseApiKeysResult {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchKeys = useCallback(async () => {
    try {
      const response = await fetch('/api/user/api-keys')
      if (!response.ok) throw new Error('Failed to load API keys')
      const data = (await response.json()) as ApiKeyEntry[]
      setKeys(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const saveKey = useCallback(async (provider: Provider, apiKey: string) => {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save API key')
      }
      const saved = (await response.json()) as {
        provider: Provider
        maskedKey: string
      }
      setKeys((prev) => {
        const filtered = prev.filter((k) => k.provider !== saved.provider)
        return [
          ...filtered,
          {
            provider: saved.provider,
            maskedKey: saved.maskedKey,
            createdAt: new Date().toISOString(),
          },
        ]
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key')
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [])

  const removeKey = useCallback(async (provider: Provider) => {
    setError(null)
    try {
      const response = await fetch(`/api/user/api-keys/${provider}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to remove API key')
      setKeys((prev) => prev.filter((k) => k.provider !== provider))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove API key')
      throw err
    }
  }, [])

  return { keys, isLoading, isSaving, saveKey, removeKey, error }
}
```

**Step 2: Commit**

```bash
git add packages/app/features/user/hooks/useApiKeys.ts
git commit -m "feat: add useApiKeys hook for managing user API key state"
```

---

## Task 7: `ApiKeysSection` Component

**Files:**

- Create: `packages/app/features/user/components/ApiKeysSection.tsx`

**Step 1: Write the component**

```typescript
// packages/app/features/user/components/ApiKeysSection.tsx
'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Label } from '@repo/ui/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select'
import { Check, Trash2, Key, Loader2 } from 'lucide-react'
import { useApiKeys, type Provider } from '../hooks/useApiKeys'

const PROVIDER_LABELS: Record<Provider, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (GPT)',
}

const ALL_PROVIDERS: Provider[] = ['anthropic', 'openai']

export function ApiKeysSection() {
  const { keys, isLoading, isSaving, saveKey, removeKey, error } = useApiKeys()
  const [selectedProvider, setSelectedProvider] = useState<Provider>('anthropic')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!apiKeyInput.trim()) return
    setFormError(null)
    try {
      await saveKey(selectedProvider, apiKeyInput.trim())
      setApiKeyInput('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save key')
    }
  }

  const handleRemove = async (provider: Provider) => {
    try {
      await removeKey(provider)
    } catch {
      // error shown via hook
    }
  }

  const configuredProviders = keys.map((k) => k.provider)

  return (
    <section className="mt-8 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">AI Generation</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Add your own API key to unlock AI content generation. Your key is encrypted and never shared.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : (
        <>
          {ALL_PROVIDERS.map((provider) => {
            const entry = keys.find((k) => k.provider === provider)
            return (
              <div key={provider} className="flex items-center justify-between rounded-md border px-4 py-3">
                <div className="flex items-center gap-3">
                  {entry ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Key className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{PROVIDER_LABELS[provider]}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry ? entry.maskedKey : 'Not configured'}
                    </p>
                  </div>
                </div>
                {entry && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRemove(provider)}
                    aria-label={`Remove ${PROVIDER_LABELS[provider]} key`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )
          })}
        </>
      )}

      <div id="ai-keys" className="rounded-md border p-4 space-y-3">
        <p className="text-sm font-medium">
          {configuredProviders.length > 0 ? 'Update a key' : 'Add your API key'}
        </p>
        <div className="flex gap-2">
          <Select
            value={selectedProvider}
            onValueChange={(v) => setSelectedProvider(v as Provider)}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_PROVIDERS.map((p) => (
                <SelectItem key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="password"
            placeholder="sk-..."
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            className="flex-1"
            aria-label="API key"
          />
          <Button
            onClick={handleSave}
            disabled={!apiKeyInput.trim() || isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
        {(formError ?? error) && (
          <p className="text-destructive text-xs">{formError ?? error}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Your key is encrypted with AES-256-GCM and stored securely. We never log or expose it.
        </p>
      </div>
    </section>
  )
}
```

**Step 2: Export from components index**

Open `packages/app/features/user/components/index.ts` and add:

```typescript
export { ApiKeysSection } from './ApiKeysSection'
```

**Step 3: Commit**

```bash
git add packages/app/features/user/components/ApiKeysSection.tsx packages/app/features/user/components/index.ts
git commit -m "feat: add ApiKeysSection component for profile page"
```

---

## Task 8: Add `ApiKeysSection` to Profile Screen

**Files:**

- Modify: `packages/app/features/user/detail-screen.tsx`

**Step 1: Import and render the section**

In `detail-screen.tsx`, add the import at the top (with existing imports):

```typescript
import { ApiKeysSection } from './components/ApiKeysSection'
```

Then in the JSX, add it after `<UserInfoHeader>` and before `<ResizablePanelGroup>`:

```typescript
<UserInfoHeader user={profileUser} theme={resolvedTheme} />

<ApiKeysSection />

<ResizablePanelGroup ...>
```

**Step 2: Verify it renders**

Run the dev server and navigate to `/[userId]`. Confirm the "AI Generation" section appears below the user header.

**Step 3: Commit**

```bash
git add packages/app/features/user/detail-screen.tsx
git commit -m "feat: add AI Generation section to user profile page"
```

---

## Task 9: Update Generate Form Paywall Gate

**Files:**

- Modify: `packages/app/features/shared/components/GenerateEntityForm/GenerateEntityForm.tsx`
- Modify: `packages/app/features/shared/components/GenerateEntityForm/GenerateEntityForm.types.ts`

**Step 1: Update the types file**

Open `GenerateEntityForm.types.ts`. Replace `isSubscribed` with `hasApiKey`:

```typescript
// Find the existing prop and rename:
// isSubscribed?: boolean
// Replace with:
hasApiKey?: boolean
userId?: string
```

**Step 2: Update the form component**

The current component shows a simple text note when `!isSubscribed`. Replace that block with a proper gate that shows when `!hasApiKey` and the user clicks Generate:

Key changes to `GenerateEntityForm.tsx`:

1. Rename `isSubscribed` prop to `hasApiKey`
2. Replace the inline note with a gate card shown when API key is missing
3. The gate shows two CTAs: "Add API Key" (links to profile `#ai-keys`) and "Upgrade to Pro"
4. Handle the `api_key_required` error code from the server specially

```typescript
// In GenerateEntityForm.tsx, update the handleGenerate error handling:
if (!response.ok) {
  const data = await response.json()
  if (data.error === 'api_key_required') {
    setShowApiKeyGate(true)
    return
  }
  throw new Error(data.error || 'Generation failed')
}
```

Add `showApiKeyGate` state and gate UI:

```typescript
const [showApiKeyGate, setShowApiKeyGate] = useState(false)

// In JSX, before the Generate button:
{showApiKeyGate && (
  <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 space-y-3">
    <p className="text-sm font-medium">AI Generation Unavailable</p>
    <p className="text-sm text-muted-foreground">
      Add your own Anthropic or OpenAI API key to generate content, or upgrade to Pro where AI is included.
    </p>
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        asChild
      >
        <a href={`/${userId}#ai-keys`}>Add API Key</a>
      </Button>
      <Button size="sm" asChild>
        <a href="/about/pricing">Upgrade to Pro</a>
      </Button>
    </div>
  </div>
)}
```

Also update the Generate button — remove `!isSubscribed` from disabled condition:

```typescript
disabled={!prompt.trim() || isGenerating}
```

**Step 3: Update callers of `GenerateEntityForm`**

Search for all usages of `isSubscribed` prop on `GenerateEntityForm`:

```bash
grep -r "isSubscribed" packages/app/features/ --include="*.tsx" -l
```

For each file found, rename the prop from `isSubscribed` to `hasApiKey` and pass `userId` if available.

**Step 4: Commit**

```bash
git add packages/app/features/shared/components/GenerateEntityForm/
git commit -m "feat: update generate form to show api_key_required paywall gate"
```

---

## Task 10: Final Verification

**Step 1: TypeScript check**

```bash
cd apps/next && pnpm tsc --noEmit
```

Fix any type errors before continuing.

**Step 2: Manual test — happy path**

1. Go to `/[userId]` profile page
2. Add an Anthropic key in the AI Generation section
3. See it appear as configured with masked display
4. Go to `/create/[entityType]` and enable AI Generate mode
5. Enter a prompt and click Generate
6. Confirm content is generated successfully

**Step 3: Manual test — no key gate**

1. Remove the key from the profile page
2. Go to create and try to generate
3. Confirm the gate appears with "Add API Key" and "Upgrade to Pro" buttons
4. Click "Add API Key" — confirm it deep-links to profile `#ai-keys`

**Step 4: Manual test — key removal**

1. Add a key, confirm it shows masked
2. Click the trash icon to remove it
3. Confirm it shows "Not configured"

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup and verification for user API key feature"
```
