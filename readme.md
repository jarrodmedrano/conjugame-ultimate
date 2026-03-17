# Jarrod Starter Monorepo 🕴

## 🔦 About

This monorepo is a starter for an Expo + Next.js app

## 🗂 Folder layout

- `apps` entry points for each app

  - `expo`
  - `app` you'll be creating files inside of `apps/expo/app` to use file system routing on iOS and Android.
  - `next`

- `packages` shared packages across apps
  - `app` you'll be importing most files from `app/`
    - `features` (don't use a `screens` folder. organize by feature.)
    - `provider` (all the providers that wrap the app, and some no-ops for Web.)
    - `design` your app's design system. organize this as you please.
      - `typography` (components for all the different text styles)
      - `layout` (components for layouts)

You can add other folders inside of `packages/` if you know what you're doing and have a good reason to.

## 🏁 Start the app

- Install dependencies: `pnpm install`

- Next.js local dev: `pnpm run web`

  - Runs `npm run next`

- Database local dev:
  First, you need to run Docker
  - `cd apps/database && make postgres`
    Starts the postgres server in a docker container
  - `make createdb`
    creates the database in the container
  - `make create`
    creates the database schema
  - `make migrateup`
    runs the migrations

## ☁️ Cloudinary Setup

This project uses Cloudinary for image storage. To enable image uploads:

### 1. Create Cloudinary Account

Sign up for a free account at [https://cloudinary.com](https://cloudinary.com)

### 2. Get Your Credentials

Find your credentials in the Cloudinary dashboard (Console > Dashboard)

### 3. Configure Environment Variables

Add to your `.env.local` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Image Upload Features

- **Supported Entities:** Stories, Characters, Locations, Timelines
- **Image Limits:** 2MB max file size, 1200x1200px max dimensions
- **Formats:** JPG and PNG only
- **Gallery:** 1 primary image + up to 6 gallery images per entity
- **Storage:** All images hosted on Cloudinary CDN in the `conjugame` folder

### 5. API Endpoints

Image upload functionality is available via REST API:

- `POST /api/v1/[entity]/[id]/image/upload` - Upload new image
- `DELETE /api/v1/[entity]/[id]/image/[imageId]` - Delete image
- `PUT /api/v1/[entity]/[id]/image/[imageId]/primary` - Set primary image

Where `[entity]` can be: `stories`, `characters`, `locations`, `timelines`

## 🆕 Add new dependencies

### Pure JS dependencies

If you're installing a JavaScript-only dependency that will be used across platforms, install it in `packages/app`:

```sh
cd packages/app
yarn add date-fns
cd ../..
yarn
```

### Native dependencies

If you're installing a library with any native code, you must install it in `apps/expo`:

```sh
cd apps/expo
yarn add react-native-reanimated

cd ../..
yarn
```

You can also install the native library inside of `packages/app` if you want to get autoimport for that package inside of the `app` folder. However, you need to be careful and install the _exact_ same version in both packages. If the versions mismatch at all, you'll potentially get terrible bugs. This is a classic monorepo issue. I use `lerna-update-wizard` to help with this (you don't need to use Lerna to use that lib).

# Stripe webhook

How to test stripe locally:

`stripe listen --forward-to localhost:3000/api/webhooks/stripe`

# Migrate db up

expose db port

`dokku postgres:expose <database-name>`

Open local tunnel:

`ssh -L 54320:localhost:32768 root@your-server-ip`

`cd apps/database && make migrate-up`

# GitHub Secrets

Add these secrets in **Settings → Secrets and variables → Actions** before deploying.

## Required secrets

| Secret                               | Description                                                     |
| ------------------------------------ | --------------------------------------------------------------- |
| `DOKKU_HOST`                         | Hostname of your Dokku server                                   |
| `DOKKU_DEPLOY_KEY`                   | SSH private key authorized on the Dokku server                  |
| `DOCKERHUB_USERNAME`                 | Docker Hub username for image pushes                            |
| `DOCKERHUB_TOKEN`                    | Docker Hub access token                                         |
| `BETTER_AUTH_SECRET`                 | Random 32-byte secret for Better Auth session signing           |
| `BETTER_AUTH_URL`                    | Public URL of the deployed app (e.g. `https://app.example.com`) |
| `NEXT_PUBLIC_APP_URL`                | Same as `BETTER_AUTH_URL`                                       |
| `DATABASE_HOST`                      | Postgres host                                                   |
| `DATABASE_USER`                      | Postgres user                                                   |
| `DATABASE_PORT`                      | Postgres port                                                   |
| `DATABASE_SECRET`                    | Postgres password                                               |
| `DATABASE_NAME`                      | Postgres database name                                          |
| `CLOUDINARY_CLOUD_NAME`              | Cloudinary cloud name                                           |
| `CLOUDINARY_API_KEY`                 | Cloudinary API key                                              |
| `CLOUDINARY_API_SECRET`              | Cloudinary API secret                                           |
| `STRIPE_SECRET_KEY`                  | Stripe secret key                                               |
| `STRIPE_WEBHOOK_SECRET`              | Stripe webhook signing secret                                   |
| `STRIPE_MONTHLY_PRICE_ID`            | Stripe monthly subscription price ID                            |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key                                          |
| `API_KEY_ENCRYPTION_KEY`             | 32-byte base64 key for encrypting user API keys (see below)     |
| `AI_PROVIDER`                        | AI provider for server-side generation: `anthropic` or `openai` |
| `AI_MODEL`                           | Model ID, e.g. `claude-sonnet-4-6`                              |

## Optional secrets

| Secret                   | Description                                              |
| ------------------------ | -------------------------------------------------------- |
| `SENDGRID_API_KEY`       | SendGrid API key for transactional email                 |
| `GOOGLE_CLIENT_SECRET`   | Google OAuth client secret                               |
| `FACEBOOK_CLIENT_ID`     | Facebook OAuth app ID                                    |
| `FACEBOOK_CLIENT_SECRET` | Facebook OAuth app secret                                |
| `APPLE_CLIENT_ID`        | Apple Sign In service ID                                 |
| `APPLE_CLIENT_SECRET`    | Apple Sign In private key                                |
| `NEXT_PUBLIC_GTM_ID`     | Google Tag Manager container ID                          |
| `OPENAI_API_KEY`         | OpenAI API key (if using OpenAI as server-side provider) |

## Generating API_KEY_ENCRYPTION_KEY

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

This key encrypts user-provided API keys at rest. Store it securely and never rotate it without re-encrypting existing keys first.
