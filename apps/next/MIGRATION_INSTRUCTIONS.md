# Better Auth Migration Instructions

## Important: Database Schema Changes

Better Auth uses a different schema structure than Auth.js. The key differences are:

### Table Name Changes:

- `users` → `user`
- `sessions` → `session`
- `accounts` → `account`
- `verification_token` → `verification`

### Schema Structure:

Better Auth uses TEXT (UUID) IDs by default instead of INTEGER IDs.

## Migration Steps

### 1. Install Dependencies

```bash
cd apps/next
pnpm add better-auth
```

### 2. Set Environment Variables

Add to your `.env` file:

```bash
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET="your-secret-key-at-least-32-characters"
BETTER_AUTH_URL="http://localhost:3000"
```

### 3. Run Better Auth CLI to Generate Schema

Better Auth can automatically generate and migrate your database schema:

```bash
# Generate the schema
cd apps/next
npx @better-auth/cli generate

# Apply the migration (creates tables automatically)
npx @better-auth/cli migrate
```

### 4. Manual Schema Migration (Alternative)

If you prefer manual migration or have existing data, follow these steps:

**WARNING: This will modify your database structure. Backup your data first!**

The schema changes needed are:

1. **Rename tables:**

   ```sql
   ALTER TABLE users RENAME TO "user";
   ALTER TABLE accounts RENAME TO account;
   DROP TABLE IF EXISTS sessions;
   DROP TABLE IF EXISTS verification_token;
   ```

2. **Add required columns to user table:**

   ```sql
   ALTER TABLE "user"
     ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW(),
     ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();
   ```

3. **Create new session table:**

   ```sql
   CREATE TABLE session (
       id TEXT PRIMARY KEY,
       "userId" TEXT NOT NULL,
       token TEXT NOT NULL UNIQUE,
       "expiresAt" TIMESTAMPTZ NOT NULL,
       "ipAddress" TEXT,
       "userAgent" TEXT,
       "createdAt" TIMESTAMPTZ DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ DEFAULT NOW()
   );
   ```

4. **Update account table:**

   ```sql
   ALTER TABLE account
     ADD COLUMN IF NOT EXISTS "accountId" TEXT,
     ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMPTZ,
     ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMPTZ,
     ADD COLUMN IF NOT EXISTS password TEXT,
     ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW(),
     ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();

   -- Rename provider to providerId
   ALTER TABLE account RENAME COLUMN provider TO "providerId";
   ```

5. **Create verification table:**
   ```sql
   CREATE TABLE verification (
       id TEXT PRIMARY KEY,
       identifier TEXT NOT NULL,
       value TEXT NOT NULL,
       "expiresAt" TIMESTAMPTZ NOT NULL,
       "createdAt" TIMESTAMPTZ DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ DEFAULT NOW()
   );
   ```

### 5. ID Type Migration (If you have existing data)

Better Auth uses UUID strings by default. If you currently use INTEGER IDs, you'll need to:

1. Convert user IDs from INTEGER to TEXT
2. Update all foreign key references
3. Migrate your existing data

This is a complex migration. Consider:

- Using better-auth's `advanced.generateId: false` to let database handle IDs
- Or migrate existing user IDs to UUIDs

See the migration SQL files in `apps/database/migration/` for detailed scripts.

### 6. Test the Setup

```bash
# Start your dev server
pnpm dev

# Test registration
# Navigate to http://localhost:3000/register

# Test sign in
# Navigate to http://localhost:3000/signin
```

## What's Been Updated

The following files have been migrated to use better-auth:

1. ✅ `/apps/next/auth.ts` - Better Auth configuration
2. ✅ `/apps/next/app/api/auth/[...all]/route.ts` - API handler
3. ✅ `/apps/next/lib/auth-client.ts` - Client-side utilities
4. ✅ `/apps/next/actions/user/signinUser.ts` - Sign in action
5. ✅ `/apps/next/actions/user/registerUser.ts` - Register action
6. ✅ `/apps/next/app/(auth)/signin/[[...rest]]/page.tsx` - Sign in page
7. ✅ `/apps/next/app/(auth)/register/[[...rest]]/page.tsx` - Register page
8. ✅ `/apps/next/app/utils/withAuth.tsx` - Auth HOC

## Next Steps

1. **Update database queries** - The `apps/database/sqlc/account_sql.ts` queries reference the old schema
2. **Add OAuth providers** - Configure Google, Facebook, Apple in auth.ts
3. **Email verification** - Implement email sending for verification
4. **Two-factor auth** - Add better-auth's 2FA plugin
5. **Update other files** - Search for NextAuth imports and update them

## Troubleshooting

### "BETTER_AUTH_SECRET is required"

Generate a secret: `openssl rand -base64 32`

### Database connection errors

Check your `.env` variables match your database config

### "Table does not exist" errors

Run `npx @better-auth/cli migrate` to create tables

### TypeScript errors

Make sure to update all imports from `next-auth` to use the new auth client

## Rollback

If you need to rollback:

1. Restore database from backup
2. Reinstall next-auth: `pnpm add next-auth@5.0.0-beta.30`
3. Revert the auth.ts file from git

## Resources

- [Better Auth Docs](https://www.better-auth.com/docs)
- [Email & Password Auth](https://www.better-auth.com/docs/authentication/email-password)
- [Database Setup](https://www.better-auth.com/docs/concepts/database)
