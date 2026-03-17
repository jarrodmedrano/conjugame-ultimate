# syntax=docker/dockerfile:1.3.1
#!/bin/sh
FROM --platform=linux/amd64 node:24.12.0-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update -qq && apt-get install -y openssl
# This Dockerfile is copy-pasted into our main docs at /docs/handbook/deploying-with-docker.
# Make sure you update both files!

FROM --platform=linux/amd64 base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# Set working directory
WORKDIR /app
RUN yarn global add turbo
COPY . .
#RUN pnpm global add turbo
RUN turbo prune --scope=next-app --docker

# Add lockfile and package.json's of  isolated subworkspace
FROM --platform=linux/amd64 base AS installer
RUN apt-get update
RUN apt-get update -qq && \
    apt-get install -y openssl curl
WORKDIR /app
RUN yarn global add pnpm
# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY packages/app /app/packages/app
COPY packages/ui /app/packages/ui
COPY packages/schema /app/packages/schema
COPY packages/sitemap /app/packages/sitemap
COPY packages/eslint-config /app/packages/eslint-config
COPY packages/typescript-config /app/packages/typescript-config
COPY apps/database /app/apps/database
COPY apps/next /app/apps/next
RUN pnpm install

# Build the project
COPY turbo.json turbo.json

# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM

# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN


# Build-time environment variables required for Next.js static generation
# These are needed during build but will be overridden at runtime
ARG CLOUDINARY_CLOUD_NAME
ARG CLOUDINARY_API_KEY
ARG CLOUDINARY_API_SECRET
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL
ARG NEXT_PUBLIC_APP_URL
ARG DATABASE_HOST
ARG DATABASE_USER
ARG DATABASE_PORT
ARG DATABASE_SECRET
ARG DATABASE_NAME
ARG FACEBOOK_CLIENT_ID
ARG FACEBOOK_CLIENT_SECRET
ARG APPLE_CLIENT_ID
ARG APPLE_CLIENT_SECRET
ARG STRIPE_SECRET_KEY
ARG STRIPE_WEBHOOK_SECRET
ARG STRIPE_MONTHLY_PRICE_ID
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_GTM_ID
ARG API_KEY_ENCRYPTION_KEY
ARG AI_PROVIDER
ARG AI_MODEL
ARG RESEND_API_KEY
ARG RESEND_FROM_EMAIL

ENV CLOUDINARY_CLOUD_NAME=$CLOUDINARY_CLOUD_NAME
ENV CLOUDINARY_API_KEY=$CLOUDINARY_API_KEY
ENV CLOUDINARY_API_SECRET=$CLOUDINARY_API_SECRET
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV DATABASE_HOST=$DATABASE_HOST
ENV DATABASE_USER=$DATABASE_USER
ENV DATABASE_PORT=$DATABASE_PORT
ENV DATABASE_SECRET=$DATABASE_SECRET
ENV DATABASE_NAME=$DATABASE_NAME
ENV FACEBOOK_CLIENT_ID=$FACEBOOK_CLIENT_ID
ENV FACEBOOK_CLIENT_SECRET=$FACEBOOK_CLIENT_SECRET
ENV APPLE_CLIENT_ID=$APPLE_CLIENT_ID
ENV APPLE_CLIENT_SECRET=$APPLE_CLIENT_SECRET
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
ENV STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
ENV STRIPE_MONTHLY_PRICE_ID=$STRIPE_MONTHLY_PRICE_ID
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID
ENV API_KEY_ENCRYPTION_KEY=$API_KEY_ENCRYPTION_KEY
ENV AI_PROVIDER=$AI_PROVIDER
ENV AI_MODEL=$AI_MODEL
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV RESEND_FROM_EMAIL=$RESEND_FROM_EMAIL

RUN pnpm turbo run build --filter=next-app...

FROM --platform=linux/amd64 base as runner
WORKDIR /app
# Don't run production as root
RUN addgroup --system --gid 1012 nodejs
RUN adduser --system --uid 1013 nextjs

# Install curl for health check
RUN apt-get update -qq && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/next/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/next/.next/static ./apps/next/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/next/public ./apps/next/public
RUN chown -R nextjs:nodejs ./apps/next
USER nextjs

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# --- Inject build-time and runtime secrets/config ---
ARG CLOUDINARY_CLOUD_NAME
ARG CLOUDINARY_API_KEY
ARG CLOUDINARY_API_SECRET
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL
ARG NEXT_PUBLIC_APP_URL
ARG DATABASE_HOST
ARG DATABASE_USER
ARG DATABASE_PORT
ARG DATABASE_SECRET
ARG DATABASE_NAME
ARG FACEBOOK_CLIENT_ID
ARG FACEBOOK_CLIENT_SECRET
ARG APPLE_CLIENT_ID
ARG APPLE_CLIENT_SECRET
ARG NEXT_PUBLIC_GTM_ID
ARG API_KEY_ENCRYPTION_KEY
ARG AI_PROVIDER
ARG AI_MODEL
ARG RESEND_API_KEY
ARG RESEND_FROM_EMAIL

ENV CLOUDINARY_CLOUD_NAME=$CLOUDINARY_CLOUD_NAME
ENV CLOUDINARY_API_KEY=$CLOUDINARY_API_KEY
ENV CLOUDINARY_API_SECRET=$CLOUDINARY_API_SECRET
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV DATABASE_HOST=$DATABASE_HOST
ENV DATABASE_USER=$DATABASE_USER
ENV DATABASE_PORT=$DATABASE_PORT
ENV DATABASE_SECRET=$DATABASE_SECRET
ENV DATABASE_NAME=$DATABASE_NAME
ENV FACEBOOK_CLIENT_ID=$FACEBOOK_CLIENT_ID
ENV FACEBOOK_CLIENT_SECRET=$FACEBOOK_CLIENT_SECRET
ENV APPLE_CLIENT_ID=$APPLE_CLIENT_ID
ENV APPLE_CLIENT_SECRET=$APPLE_CLIENT_SECRET
ENV NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID
ENV API_KEY_ENCRYPTION_KEY=$API_KEY_ENCRYPTION_KEY
ENV AI_PROVIDER=$AI_PROVIDER
ENV AI_MODEL=$AI_MODEL
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV RESEND_FROM_EMAIL=$RESEND_FROM_EMAIL

# Add health check for Dokku
HEALTHCHECK --interval=5s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "/app/apps/next/server.js"]