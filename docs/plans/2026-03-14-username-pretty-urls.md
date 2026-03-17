# Username Pretty URLs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the UUID-based profile URL (`/e7f10cda-.../stories/foo`) with a user-chosen username (`/johndoe/stories/foo`).

**Architecture:** Add a `username` column to the `users` table with a unique constraint. Wire it through Better Auth's `additionalFields` so it's available on the session. Collect it at registration. Rename the Next.js `[userId]` catch-all route to `[username]` and resolve username → actual UUID in a shared cached helper used by the layout and every entity page. Add a redirect for legacy UUID-based paths.

**Tech Stack:** PostgreSQL, SQLC, Better Auth, Next.js App Router (Server Components + `cache()`), Zod

---

## Context & Key Files

| What                  | Where                                                      |
| --------------------- | ---------------------------------------------------------- |
| DB schema             | `apps/database/schemas/schema.sql`                         |
| SQL queries           | `apps/database/queries/account.sql`                        |
| Generated TS types    | `apps/database/sqlc/account_sql.ts`                        |
| DB exports            | `apps/database/index.ts`                                   |
| Better Auth config    | `apps/next/auth.ts`                                        |
| Registration schema   | `packages/schema/register.ts`                              |
| Registration action   | `apps/next/actions/user/registerUser.ts`                   |
| Registration UI       | `packages/ui/components/pages/register.tsx`                |
| Route layout          | `apps/next/app/[userId]/layout.tsx`                        |
| User profile page     | `apps/next/app/[userId]/page.tsx`                          |
| Story detail page     | `apps/next/app/[userId]/stories/[storyId]/page.tsx`        |
| Character detail page | `apps/next/app/[userId]/characters/[characterId]/page.tsx` |
| Location detail page  | `apps/next/app/[userId]/locations/[locationId]/page.tsx`   |
| Timeline detail page  | `apps/next/app/[userId]/timelines/[timelineId]/page.tsx`   |
| Subscription page     | `apps/next/app/[userId]/subscription/page.tsx`             |
| Middleware            | `apps/next/middleware.ts`                                  |
| User API route        | `apps/next/app/api/user/[slug]/route.ts`                   |
| User actions dir      | `apps/next/actions/user/`                                  |
| Slug utility          | `apps/next/utils/slug.ts`                                  |

---

## Task 1: DB Migration — Add `username` Column

**Files:**

- Create: `apps/database/migration/000008_add_username.up.sql`
- Create: `apps/database/migration/000008_add_username.down.sql`

### Step 1: Write the up migration

```sql
-- apps/database/migration/000008_add_username.up.sql

-- Add username column (user-chosen, short, clean)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(30);

-- Unique constraint (case-insensitive via lowercase enforcement at app layer)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique
  ON users(username)
  WHERE username IS NOT NULL;

-- Backfill from existing slug: strip the appended "-xxxxxxxx" suffix that was
-- added during the slug migration, keep only the name portion, truncate to 30.
UPDATE users
SET username = SUBSTRING(
  LOWER(REGEXP_REPLACE(slug, '-[a-f0-9]{8}$', '')),
  1, 30
)
WHERE username IS NULL AND slug IS NOT NULL;

-- For any users still missing (no slug), fall back to first 8 chars of id
UPDATE users
SET username = 'user-' || SUBSTRING(id, 1, 8)
WHERE username IS NULL;
```

### Step 2: Write the down migration

```sql
-- apps/database/migration/000008_add_username.down.sql
ALTER TABLE users DROP COLUMN IF EXISTS username;
DROP INDEX IF EXISTS idx_users_username_unique;
```

### Step 3: Apply the migration

```bash
# From repo root — adjust the connect string to match your local setup
psql $DATABASE_URL -f apps/database/migration/000008_add_username.up.sql
```

Expected: no errors, rows updated.

### Step 4: Verify

```bash
psql $DATABASE_URL -c "SELECT id, name, slug, username FROM users LIMIT 5;"
```

Expected: `username` column populated with clean values like `john-doe`, `alice`.

### Step 5: Commit

```bash
git add apps/database/migration/000008_add_username.up.sql \
        apps/database/migration/000008_add_username.down.sql
git commit -m "feat: add username column to users table"
```

---

## Task 2: SQL Queries + TypeScript Types

**Files:**

- Modify: `apps/database/queries/account.sql`
- Modify: `apps/database/sqlc/account_sql.ts` (manual addition — see note)
- Modify: `apps/database/index.ts`

> **Note on SQLC:** The project uses SQLC to generate `account_sql.ts`. If `sqlc generate` is available and working, run it after updating the SQL. If not, manually add the TypeScript below — it follows the exact pattern of the existing generated functions.

### Step 1: Add SQL queries

Open `apps/database/queries/account.sql` and add after the existing `GetUserBySlug` query (after line 11):

```sql
-- name: GetUserByUsername :one
SELECT * FROM users WHERE username = $1 LIMIT 1;

-- name: CheckUsernameExists :one
SELECT EXISTS(SELECT 1 FROM users WHERE username = $1) AS exists;
```

Also update the `UpdateUser` query to include `username` (find the existing UpdateUser and add the column):

The current UpdateUser sets: `name, email, emailVerified, image, slug, role, isTwoFactorEnabled, locale`.

Add `username = COALESCE($10, username)` and update the parameter count accordingly. The updated query:

```sql
-- name: UpdateUser :one
UPDATE users SET
  name = COALESCE($2, name),
  email = COALESCE($3, email),
  "emailVerified" = COALESCE($4, "emailVerified"),
  image = COALESCE($5, image),
  slug = COALESCE($6, slug),
  "role" = COALESCE($7, "role"),
  "isTwoFactorEnabled" = COALESCE($8, "isTwoFactorEnabled"),
  "locale" = COALESCE($9, 'en'),
  username = COALESCE($10, username),
  "updatedAt" = NOW()
WHERE id = $1
RETURNING *;
```

### Step 2: Add TypeScript types to `apps/database/sqlc/account_sql.ts`

Add at the end of the file (or run `sqlc generate` if available):

```typescript
// GetUserByUsername
export interface GetUserByUsernameArgs {
  username: string | null
}

export interface GetUserByUsernameRow {
  id: string
  name: string | null
  email: string
  emailverified: boolean | null
  image: string | null
  slug: string | null
  username: string | null
  createdat: Date
  updatedat: Date
  role: string | null
  locale: string | null
  istwofactorenabled: boolean | null
}

export async function getUserByUsername(
  client: Client,
  args: GetUserByUsernameArgs,
): Promise<GetUserByUsernameRow | null> {
  const result = await client.query(
    `SELECT * FROM users WHERE username = $1 LIMIT 1`,
    [args.username],
  )
  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    emailverified: row.emailVerified,
    image: row.image,
    slug: row.slug,
    username: row.username,
    createdat: row.createdAt,
    updatedat: row.updatedAt,
    role: row.role,
    locale: row.locale,
    istwofactorenabled: row.isTwoFactorEnabled,
  }
}

// CheckUsernameExists
export interface CheckUsernameExistsArgs {
  username: string
}

export interface CheckUsernameExistsRow {
  exists: boolean
}

export async function checkUsernameExists(
  client: Client,
  args: CheckUsernameExistsArgs,
): Promise<boolean> {
  const result = await client.query(
    `SELECT EXISTS(SELECT 1 FROM users WHERE username = $1) AS exists`,
    [args.username],
  )
  return result.rows[0]?.exists ?? false
}
```

Also update `GetUserRow` and `UpdateUserArgs` interfaces to include `username: string | null`.

### Step 3: Export from `apps/database/index.ts`

Add the new exports:

```typescript
export { getUserByUsername, checkUsernameExists } from './sqlc/account_sql'
export type {
  GetUserByUsernameArgs,
  GetUserByUsernameRow,
  CheckUsernameExistsArgs,
} from './sqlc/account_sql'
```

### Step 4: Verify TypeScript compiles

```bash
cd apps/database && pnpm tsc --noEmit
```

Expected: no errors.

### Step 5: Commit

```bash
git add apps/database/queries/account.sql \
        apps/database/sqlc/account_sql.ts \
        apps/database/index.ts
git commit -m "feat: add getUserByUsername and checkUsernameExists queries"
```

---

## Task 3: Username Validation Schema

**Files:**

- Modify: `packages/schema/register.ts`
- Create: `packages/schema/username.ts`

### Step 1: Write the failing test

```typescript
// packages/schema/__tests__/username.test.ts
import { describe, it, expect } from 'vitest'
import { UsernameSchema } from '../username'

describe('UsernameSchema', () => {
  it('accepts valid usernames', () => {
    expect(UsernameSchema.parse('johndoe')).toBe('johndoe')
    expect(UsernameSchema.parse('john_doe')).toBe('john_doe')
    expect(UsernameSchema.parse('john-doe')).toBe('john-doe')
    expect(UsernameSchema.parse('abc')).toBe('abc')
    expect(UsernameSchema.parse('a'.repeat(30))).toHaveLength(30)
  })

  it('rejects too short', () => {
    expect(() => UsernameSchema.parse('ab')).toThrow()
  })

  it('rejects too long', () => {
    expect(() => UsernameSchema.parse('a'.repeat(31))).toThrow()
  })

  it('rejects special characters', () => {
    expect(() => UsernameSchema.parse('john doe')).toThrow()
    expect(() => UsernameSchema.parse('john@doe')).toThrow()
    expect(() => UsernameSchema.parse('john!doe')).toThrow()
  })

  it('lowercases the value', () => {
    expect(UsernameSchema.parse('JohnDoe')).toBe('johndoe')
  })
})
```

### Step 2: Run test to verify it fails

```bash
cd packages/schema && pnpm vitest run __tests__/username.test.ts
```

Expected: FAIL — `UsernameSchema` not found.

### Step 3: Create the schema

```typescript
// packages/schema/username.ts
import { z } from 'zod'

export const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be 30 characters or less')
  .regex(
    /^[a-z0-9_-]+$/,
    'Username can only contain lowercase letters, numbers, hyphens, and underscores',
  )
  .transform((val) => val.toLowerCase())

export type Username = z.infer<typeof UsernameSchema>
```

### Step 4: Update RegisterSchema to include username

In `packages/schema/register.ts`:

```typescript
import { z } from 'zod'
import { UsernameSchema } from './username'

export const RegisterSchema = z.object({
  email: z.string().email({
    message: 'Email is required',
  }),
  password: z.string().min(6, {
    message: 'Minimum 6 characters required',
  }),
  name: z.string().min(1, {
    message: 'Name is required',
  }),
  username: UsernameSchema,
})

export type registerSchema = z.infer<typeof RegisterSchema>
```

### Step 5: Run tests to verify they pass

```bash
cd packages/schema && pnpm vitest run __tests__/username.test.ts
```

Expected: PASS.

### Step 6: Commit

```bash
git add packages/schema/username.ts packages/schema/register.ts \
        packages/schema/__tests__/username.test.ts
git commit -m "feat: add username validation schema"
```

---

## Task 4: Better Auth — Register `username` as Additional Field

**Files:**

- Modify: `apps/next/auth.ts`

### Step 1: Add `username` to `additionalFields`

In `apps/next/auth.ts`, inside the `user.additionalFields` object (after `isTwoFactorEnabled`):

```typescript
username: {
  type: 'string',
  required: false,
  defaultValue: null,
},
```

This makes `username` available on the session user object: `session.user.username`.

### Step 2: Verify TypeScript compiles

```bash
cd apps/next && pnpm tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

### Step 3: Commit

```bash
git add apps/next/auth.ts
git commit -m "feat: add username to Better Auth additional fields"
```

---

## Task 5: Server Actions — Username Lookup

**Files:**

- Create: `apps/next/actions/user/getUserByUsername.ts`
- Create: `apps/next/actions/user/checkUsernameAvailable.ts`

### Step 1: Create `getUserByUsername.ts`

```typescript
// apps/next/actions/user/getUserByUsername.ts
'use server'

import { getUserByUsername } from '@repo/database'
import pool from '../../utils/open-pool'

export default async function fetchUserByUsername(args: { username: string }) {
  const client = await pool.connect()
  try {
    return await getUserByUsername(client, { username: args.username })
  } catch (error) {
    console.error(
      'Error fetching user by username:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return null
  } finally {
    client.release()
  }
}
```

### Step 2: Create `checkUsernameAvailable.ts`

```typescript
// apps/next/actions/user/checkUsernameAvailable.ts
'use server'

import { checkUsernameExists } from '@repo/database'
import { UsernameSchema } from '@repo/schema/username'
import pool from '../../utils/open-pool'
import { z } from 'zod'

export default async function checkUsernameAvailable(args: {
  username: string
  excludeUserId?: string
}): Promise<{ available: boolean; error?: string }> {
  const result = UsernameSchema.safeParse(args.username)
  if (!result.success) {
    return { available: false, error: result.error.issues[0]?.message }
  }

  const client = await pool.connect()
  try {
    const exists = await checkUsernameExists(client, {
      username: result.data,
    })
    return { available: !exists }
  } catch (error) {
    console.error(
      'Error checking username:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return { available: false, error: 'Could not check username availability' }
  } finally {
    client.release()
  }
}
```

### Step 3: Verify TypeScript compiles

```bash
cd apps/next && pnpm tsc --noEmit 2>&1 | head -20
```

### Step 4: Commit

```bash
git add apps/next/actions/user/getUserByUsername.ts \
        apps/next/actions/user/checkUsernameAvailable.ts
git commit -m "feat: add getUserByUsername and checkUsernameAvailable actions"
```

---

## Task 6: Registration — Collect Username

**Files:**

- Modify: `packages/ui/components/pages/register.tsx`
- Modify: `apps/next/actions/user/registerUser.ts`

### Step 1: Update the registration form UI

In `packages/ui/components/pages/register.tsx`, the form currently reads `formData.get('name')` and labels it "Name" with placeholder "choose a unique username". We need to split this into two separate fields: `username` (URL handle) and `name` (display name — optional).

Replace the current single "Name" field with:

```tsx
{
  /* Username field */
}
;<div>
  <label
    htmlFor="username"
    className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
  >
    Username
  </label>
  <div className="mt-2">
    <Input
      id="username"
      name="username"
      type="text"
      autoComplete="username"
      placeholder="johndoe"
      required
    />
  </div>
  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
    Letters, numbers, hyphens, underscores. 3-30 chars.
  </p>
</div>
```

Update the `onSubmit` handler to read `username` instead of `name`:

```typescript
const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  const formData = new FormData(e.currentTarget)
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  // ...

  credentialsRegister({
    signInType: 'credentials',
    values: {
      email,
      password,
      name: username,   // Better Auth needs `name`; we reuse username as display name
      username,
    },
    callbackUrl,
  })
```

Also update the `credentialsRegister` prop type to include `username` in `values`:

```typescript
values: {
  name: string
  username: string
  code?: string | undefined
  email: string
  password: string
}
```

### Step 2: Update the `registerUser` server action

In `apps/next/actions/user/registerUser.ts`:

```typescript
'use server'

import { auth } from '../../auth'
import { RegisterSchema, registerSchema } from '@repo/schema/register'
import checkUsernameAvailable from './checkUsernameAvailable'
import updateUser from './updateUser'

export const registerUser = async ({
  values,
  callbackUrl,
}: {
  values: registerSchema
  callbackUrl?: string | null
}) => {
  const validatedFields = RegisterSchema.safeParse(values)

  if (!validatedFields.success) {
    return { error: 'Invalid fields!' }
  }

  const { email, password, name, username } = validatedFields.data

  // Check username availability before creating account
  const availability = await checkUsernameAvailable({ username })
  if (!availability.available) {
    return { error: availability.error ?? 'Username already taken' }
  }

  try {
    const response = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        username,
        callbackURL: callbackUrl || undefined,
      },
    })

    if (!response) {
      return { error: 'Failed to create account!' }
    }

    return {
      headline: 'Account created!',
      success:
        'Your account has been created successfully! You can now sign in.',
    }
  } catch (error: unknown) {
    console.error(
      'Registration error:',
      error instanceof Error ? error.message : 'Unknown error',
    )

    if (
      error instanceof Error &&
      (error.message?.includes('already exists') ||
        error.message?.includes('duplicate') ||
        error.message?.includes('unique'))
    ) {
      return { error: 'Email already in use!' }
    }

    return {
      error: error instanceof Error ? error.message : 'Something went wrong!',
    }
  }
}
```

### Step 3: Verify TypeScript compiles

```bash
pnpm turbo run build --filter=@repo/ui --filter=next-app 2>&1 | grep -E "error TS|Type error" | head -20
```

Expected: no type errors.

### Step 4: Commit

```bash
git add packages/ui/components/pages/register.tsx \
        apps/next/actions/user/registerUser.ts
git commit -m "feat: collect username at registration"
```

---

## Task 7: Shared Username Resolver (Cache Helper)

Multiple server components (layout + 5 entity pages) all need to resolve a username to a `userId`. Use React's `cache()` so the DB call is deduplicated within a single request.

**Files:**

- Create: `apps/next/lib/resolve-username.ts`

### Step 1: Create the resolver

```typescript
// apps/next/lib/resolve-username.ts
import { cache } from 'react'
import { getUserByUsername } from '@repo/database'
import pool from '../utils/open-pool'
import { notFound } from 'next/navigation'

/**
 * Resolves a username to a user object.
 * Cached per-request — safe to call from layout + page without double DB hit.
 */
export const resolveUsername = cache(async (username: string) => {
  const client = await pool.connect()
  try {
    const user = await getUserByUsername(client, { username })
    if (!user) notFound()
    return user
  } finally {
    client.release()
  }
})
```

### Step 2: Verify TypeScript

```bash
cd apps/next && pnpm tsc --noEmit 2>&1 | head -20
```

### Step 3: Commit

```bash
git add apps/next/lib/resolve-username.ts
git commit -m "feat: add cached username resolver"
```

---

## Task 8: Rename Route `[userId]` → `[username]`

Next.js routes are defined by directory names. Rename the directory and update all files inside it.

**Files:**

- Rename: `apps/next/app/[userId]/` → `apps/next/app/[username]/`
- Modify: `apps/next/app/[username]/layout.tsx`
- Modify: `apps/next/app/[username]/page.tsx`
- Modify: `apps/next/app/[username]/stories/[storyId]/page.tsx`
- Modify: `apps/next/app/[username]/characters/[characterId]/page.tsx`
- Modify: `apps/next/app/[username]/locations/[locationId]/page.tsx`
- Modify: `apps/next/app/[username]/timelines/[timelineId]/page.tsx`
- Modify: `apps/next/app/[username]/subscription/page.tsx` (if exists)

### Step 1: Rename the directory

```bash
cd apps/next/app
git mv '[userId]' '[username]'
```

### Step 2: Update `layout.tsx`

Replace all occurrences of `userId` with `username` in the params destructuring, and use `resolveUsername` to get the actual user ID for entity list queries:

```typescript
// apps/next/app/[username]/layout.tsx
import { headers } from 'next/headers'
import { auth } from '../../auth'
import { DashboardLayout } from '../../components/DashboardLayout'
import { resolveUsername } from '../../lib/resolve-username'
import listStoriesForUser from '../../actions/user/listStoriesForUser'
import listCharactersForUser from '../../actions/user/listCharactersForUser'
import listLocationsForUser from '../../actions/user/listLocationsForUser'
import listTimelinesForUser from '../../actions/user/listTimelinesForUser'
import type { SidebarSection } from '@repo/ui/components/dashboard/sidebar-nav'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ username: string }>
}

export default async function UserLayout({ children, params }: LayoutProps) {
  const { username } = await params
  const headersList = await headers()

  // Resolve username → actual user (404s if not found)
  const profileUser = await resolveUsername(username)
  const userId = profileUser.id

  let session
  try {
    session = await auth.api.getSession({ headers: headersList })
  } catch {
    session = null
  }

  const viewerid = session?.user?.id

  const [stories, characters, locations, timelines] = await Promise.all([
    listStoriesForUser({ userid: userId, viewerid }),
    listCharactersForUser({ userid: userId, viewerid }),
    listLocationsForUser({ userid: userId, viewerid }),
    listTimelinesForUser({ userid: userId, viewerid }),
  ])

  const sections: SidebarSection[] = [
    {
      title: 'Stories',
      icon: 'BookOpen',
      items: stories.map((story) => ({
        id: String(story.id),
        name: story.title || 'Untitled',
        slug: story.slug || String(story.id),
        href: `/${username}/stories/${story.slug || story.id}`,
      })),
      createHref: '/create/stories',
      moreHref: `/${username}/stories`,
    },
    {
      title: 'Characters',
      icon: 'Users',
      items: characters.map((character) => ({
        id: String(character.id),
        name: character.name || 'Unnamed',
        slug: character.slug || String(character.id),
        href: `/${username}/characters/${character.slug || character.id}`,
      })),
      createHref: '/create/characters',
      moreHref: `/${username}/characters`,
    },
    {
      title: 'Locations',
      icon: 'MapPin',
      items: locations.map((location) => ({
        id: String(location.id),
        name: location.name || 'Unnamed',
        slug: location.slug || String(location.id),
        href: `/${username}/locations/${location.slug || location.id}`,
      })),
      createHref: '/create/locations',
      moreHref: `/${username}/locations`,
    },
    {
      title: 'Timelines',
      icon: 'Clock',
      items: timelines.map((timeline) => ({
        id: String(timeline.id),
        name: timeline.name || 'Unnamed',
        slug: timeline.slug || String(timeline.id),
        href: `/${username}/timelines/${timeline.slug || timeline.id}`,
      })),
      createHref: '/create/timelines',
      moreHref: `/${username}/timelines`,
    },
  ]

  return <DashboardLayout sections={sections}>{children}</DashboardLayout>
}
```

### Step 3: Update `page.tsx` (user profile)

Change `params: { userId }` → `params: { username }`, resolve to get userId:

```typescript
// apps/next/app/[username]/page.tsx
import { resolveUsername } from '../../lib/resolve-username'
import { UserDetailScreen } from '@repo/features/user/detail-screen'  // adjust import path

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params
  const user = await resolveUsername(username)

  return <UserDetailScreen userId={user.id} username={username} />
}
```

> **Note:** Read the current `page.tsx` first to see exactly what it renders before making changes.

### Step 4: Update each entity detail page

**Pattern for all entity pages** — replace `params: { userId }` with `params: { username }` and call `resolveUsername`:

For `apps/next/app/[username]/stories/[storyId]/page.tsx`:

```typescript
// At the top of the page component:
const { username, storyId } = await params
const profileUser = await resolveUsername(username) // cached — no extra DB hit if layout already called it
const userId = profileUser.id
// ... rest of page uses `userId` for all queries, `username` only for href generation
```

Apply the same pattern to:

- `characters/[characterId]/page.tsx` — replace `userId` with resolved id
- `locations/[locationId]/page.tsx`
- `timelines/[timelineId]/page.tsx`

Read each file before modifying so you understand the full context.

### Step 5: Verify build compiles

```bash
pnpm turbo run build --filter=next-app 2>&1 | grep -E "error|Error" | grep -v "warn" | head -30
```

Expected: build succeeds.

### Step 6: Commit

```bash
git add 'apps/next/app/[username]/'
git commit -m "feat: rename [userId] route to [username] with resolver"
```

---

## Task 9: Redirect Legacy UUID URLs

Users who bookmarked old UUID-based URLs (e.g. `/e7f10cda-4cd7-4717-88b3-59c6d9ef1db5/stories/foo`) should be redirected to their username URL. Handle this in a new server-side redirect route.

**Files:**

- Modify: `apps/next/middleware.ts`

### Step 1: Add UUID detection to middleware

A UUID matches the pattern `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`. If the first path segment looks like a UUID, redirect to a lookup endpoint.

In `apps/next/middleware.ts`, add before the final `return NextResponse.next()`:

```typescript
// Detect UUID-based profile paths and redirect to username URLs
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const firstSegment = nextUrl.pathname.split('/')[1]

if (firstSegment && UUID_PATTERN.test(firstSegment)) {
  const rest = nextUrl.pathname.slice(firstSegment.length + 1) // e.g. "/stories/foo"
  const redirectUrl = new URL(
    `/api/user-redirect/${firstSegment}${rest}${nextUrl.search}`,
    request.url,
  )
  return NextResponse.redirect(redirectUrl, { status: 301 })
}
```

### Step 2: Create the redirect API route

**File:** `apps/next/app/api/user-redirect/[userId]/[...rest]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@repo/database'
import pool from '../../../../utils/open-pool'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ userId: string; rest?: string[] }> },
) {
  const params = await props.params
  const { userId, rest = [] } = params

  const client = await pool.connect()
  try {
    const user = await getUser(client, { id: userId })

    if (!user?.username) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const restPath = rest.length > 0 ? `/${rest.join('/')}` : ''
    const { searchParams } = new URL(request.url)
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''

    return NextResponse.redirect(
      new URL(`/${user.username}${restPath}${query}`, request.url),
      { status: 301 },
    )
  } finally {
    client.release()
  }
}
```

### Step 3: Verify no infinite redirect loop

The `/api/user-redirect/` path must NOT be matched by the UUID detection logic. In the middleware, ensure the UUID check only runs for non-API paths:

```typescript
const isApiRoute = nextUrl.pathname.startsWith('/api/')

if (!isApiRoute && firstSegment && UUID_PATTERN.test(firstSegment)) {
  // ... redirect
}
```

### Step 4: Test manually

```bash
# Start dev server
pnpm dev

# In another terminal, test redirect:
curl -I "http://localhost:3000/e7f10cda-4cd7-4717-88b3-59c6d9ef1db5/stories/test"
```

Expected: `301` redirect to `/{username}/stories/test`.

### Step 5: Commit

```bash
git add apps/next/middleware.ts \
        'apps/next/app/api/user-redirect/'
git commit -m "feat: redirect legacy UUID profile URLs to username URLs"
```

---

## Task 10: Fix `/api/user/[slug]` Route

This API route is misnamed — its `[slug]` param actually receives a user ID. Now that users have usernames, rename it properly and keep backward compatibility.

**Files:**

- Modify: `apps/next/app/api/user/[slug]/route.ts`

The route currently does `verifyOwnership(user.id, slug)` and `getUser(client, { id: slug })`. It's only used by authenticated users accessing their own profile, so keeping it ID-based is fine. Just rename the param for clarity:

```typescript
// Rename [slug] → [userId] in the directory name
git mv 'apps/next/app/api/user/[slug]' 'apps/next/app/api/user/[userId]'
```

Then update `route.ts` to use `userId` as the param name:

```typescript
export async function GET(
  request: Request,
  props: { params: Promise<{ userId: string }> },
) {
  // ...
  const { userId } = params
  const authzError = verifyOwnership(user.id, userId)
  const userRequest = await getUser(client, { id: userId })
  // ...
}
```

### Commit

```bash
git add 'apps/next/app/api/user/[userId]/'
git commit -m "fix: rename user API route param from slug to userId"
```

---

## Task 11: Profile Settings — Allow Username Changes

Users should be able to update their username from their profile page.

**Files:**

- Read first: `packages/app/features/user/detail-screen.tsx`
- Read first: `packages/app/features/user/components/UserInfoHeader.tsx`
- Create: `apps/next/actions/user/updateUsername.ts`
- Modify: `packages/app/features/user/components/UserInfoHeader.tsx`

### Step 1: Create the update action

```typescript
// apps/next/actions/user/updateUsername.ts
'use server'

import { updateUser } from '@repo/database'
import pool from '../../utils/open-pool'
import { requireAuth } from '../../lib/auth-middleware'
import { rateLimit, RateLimitConfigs } from '../../lib/rate-limit'
import { UsernameSchema } from '@repo/schema/username'
import checkUsernameAvailable from './checkUsernameAvailable'
import { z } from 'zod'

export async function updateUsername(
  request: Request,
  { username }: { username: string },
) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return { error: 'Too many requests' }

  const authResult = await requireAuth(request)
  if (authResult.error) return { error: 'Unauthorized' }
  const { user } = authResult

  const result = UsernameSchema.safeParse(username)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Invalid username' }
  }

  const availability = await checkUsernameAvailable({
    username: result.data,
    excludeUserId: user.id,
  })
  if (!availability.available) {
    return { error: availability.error ?? 'Username already taken' }
  }

  const client = await pool.connect()
  try {
    await updateUser(client, {
      id: user.id,
      username: result.data,
      // Pass existing values as null to use COALESCE defaults
      name: null,
      email: user.email,
      emailverified: null,
      image: null,
      slug: null,
      role: null,
      istwofactorenabled: null,
      locale: null,
    })

    return { success: true, username: result.data }
  } catch (error) {
    console.error(
      'Error updating username:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return { error: 'Failed to update username' }
  } finally {
    client.release()
  }
}
```

> **Note on `checkUsernameAvailable` with `excludeUserId`:** Update the `checkUsernameExists` query in `account.sql` to `SELECT EXISTS(SELECT 1 FROM users WHERE username = $1 AND id != $2)` when `excludeUserId` is provided, or handle at the app layer by checking if the username belongs to the current user.

### Step 2: Add username editing to UserInfoHeader

Read `packages/app/features/user/components/UserInfoHeader.tsx` first, then add an inline edit for username (show current username with a pencil icon, clicking opens an input). Follow the existing pattern in the file.

Key UX: After a successful save, the page should redirect to `/{newUsername}` since the URL changes.

### Step 3: Commit

```bash
git add apps/next/actions/user/updateUsername.ts \
        packages/app/features/user/components/UserInfoHeader.tsx
git commit -m "feat: allow username changes from profile settings"
```

---

## Task 12: Update Any Hardcoded userId References in Navigation

Search for any remaining places that generate profile URLs using the old UUID pattern.

### Step 1: Search for hardcoded userId in hrefs

```bash
grep -r 'userId' apps/next/app --include="*.tsx" --include="*.ts" -l
grep -r "/${userId}/" packages/app --include="*.tsx" --include="*.ts" -l
```

### Step 2: Update DashboardLayout's logged-in user link

The `DashboardLayout` and `SiteHeader` may link to the current user's profile using their ID. These need to use the username instead.

The session object now has `session.user.username` (via Better Auth additionalFields). Use that for the profile link.

### Step 3: Commit all remaining fixes

```bash
git add -A
git commit -m "fix: update remaining userId references to use username in URLs"
```

---

## Verification Checklist

Before opening a PR, verify:

- [ ] New user registration requires a username (3-30 chars, alphanumeric/hyphen/underscore)
- [ ] `https://conjugame.org/johndoe/stories/new-story` works in incognito (public view)
- [ ] Old UUID URL redirects 301 to username URL
- [ ] Username is shown in profile settings and can be edited
- [ ] Changing username redirects to the new URL
- [ ] Duplicate username is rejected at registration
- [ ] Build passes: `pnpm turbo run build`
- [ ] TypeScript passes: `pnpm tsc --noEmit` in `apps/next` and `apps/database`
