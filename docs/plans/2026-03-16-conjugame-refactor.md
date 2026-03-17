# Conjugame Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the story-bible app into Conjugame — a verb conjugation quiz game — replacing all domain content while keeping the existing Next.js 15 monorepo, Better Auth, sqlc/PostgreSQL, Stripe, and Cloudinary architecture.

**Architecture:** Keep the PNPM monorepo structure (`apps/api`, `apps/database`, `apps/next`, `packages/*`) intact. Replace schema/queries/actions/features for the new domain (verbs, questions, quiz sessions, user progress, ratings). New git history from scratch.

**Tech Stack:** Next.js 15, Better Auth, PostgreSQL + sqlc (TypeScript codegen), Stripe, Cloudinary (avatar only), Tailwind/Shadcn/ui, Zod, Turbo/PNPM monorepo.

**Reference directory:** `/conjugame/` — read for inspiration only, never modify.

---

## Task 1: New Git History

**Files:**
- Delete: `.git/` directory
- Modify: `.gitignore` (add `conjugame/` entry)

**Step 1: Remove existing git history and reinitialize**

```bash
cd /Users/jarrodmedrano/work/conjugame-ultimate
rm -rf .git
git init
```

**Step 2: Add conjugame reference dir to .gitignore**

Add this line to `.gitignore` in the repo root:
```
conjugame/
```

**Step 3: Stage everything and make initial commit**

```bash
git add .
git commit -m "feat: initial conjugame - verb conjugation quiz game"
```

---

## Task 2: Rewrite Database Schema

**Files:**
- Modify: `apps/database/schemas/schema.sql`

**Step 1: Replace schema.sql entirely**

Replace the entire contents of `apps/database/schemas/schema.sql` with:

```sql
-- Better Auth Core Schema

-- User Table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    "emailVerified" BOOLEAN DEFAULT FALSE,
    image TEXT,
    avatar_url TEXT,
    slug VARCHAR(255),
    username VARCHAR(255) UNIQUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    locale TEXT DEFAULT 'en',
    "isTwoFactorEnabled" BOOLEAN DEFAULT FALSE
);

-- Session Table
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Account Table
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMPTZ,
    "refreshTokenExpiresAt" TIMESTAMPTZ,
    scope TEXT,
    "idToken" TEXT,
    password TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Verification Table
CREATE TABLE verifications (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Subscriptions Table (Stripe)
CREATE TABLE subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    stripe_customer_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'inactive',
    price_id TEXT,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for Better Auth
CREATE INDEX idx_sessions_userId ON sessions("userId");
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_accounts_userId ON accounts("userId");
CREATE INDEX idx_verifications_identifier ON verifications(identifier);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- ==============================
-- Conjugame Application Tables
-- ==============================

-- Verbs
CREATE TABLE verbs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    language VARCHAR(50) NOT NULL,
    infinitive VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verbs_language ON verbs(language);

-- Questions (multiple choice)
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    verb_id INTEGER REFERENCES verbs(id) ON DELETE SET NULL,
    tense VARCHAR(100) NOT NULL,
    regularity VARCHAR(50),
    verb_type VARCHAR(50),
    text TEXT NOT NULL,
    translation TEXT,
    answers JSONB NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    language VARCHAR(50) NOT NULL,
    src VARCHAR(255),
    rating_score DECIMAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_language ON questions(language);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_verb_id ON questions(verb_id);

-- User Progress (per quiz session)
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_language ON user_progress(language);

-- User Language Stats (aggregated per user per language)
CREATE TABLE user_language_stats (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL,
    total_score INTEGER NOT NULL DEFAULT 0,
    total_quizzes INTEGER NOT NULL DEFAULT 0,
    total_correct INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    best_score INTEGER NOT NULL DEFAULT 0,
    last_played_at TIMESTAMPTZ,
    UNIQUE(user_id, language)
);

CREATE INDEX idx_user_language_stats_user_id ON user_language_stats(user_id);
CREATE INDEX idx_user_language_stats_language ON user_language_stats(language);
CREATE INDEX idx_user_language_stats_total_score ON user_language_stats(total_score DESC);

-- Question Ratings (users rate question quality 1-5)
CREATE TABLE question_ratings (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

CREATE INDEX idx_question_ratings_question_id ON question_ratings(question_id);
```

**Step 2: Create the first migration file**

Create `apps/database/migration/000001_init_conjugame.up.sql` with the same content as schema.sql above.

Create `apps/database/migration/000001_init_conjugame.down.sql`:
```sql
DROP TABLE IF EXISTS question_ratings;
DROP TABLE IF EXISTS user_language_stats;
DROP TABLE IF EXISTS user_progress;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS verbs;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS verifications;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;
```

**Step 3: Create seed migration**

Create `apps/database/migration/000002_seed_languages.up.sql`:
```sql
-- Seed initial verbs for Spanish
INSERT INTO verbs (name, language, infinitive) VALUES
  ('hablar', 'spanish', 'hablar'),
  ('comer', 'spanish', 'comer'),
  ('vivir', 'spanish', 'vivir'),
  ('ser', 'spanish', 'ser'),
  ('estar', 'spanish', 'estar'),
  ('tener', 'spanish', 'tener'),
  ('ir', 'spanish', 'ir'),
  ('hacer', 'spanish', 'hacer');

-- Seed initial verbs for English
INSERT INTO verbs (name, language, infinitive) VALUES
  ('to be', 'english', 'be'),
  ('to have', 'english', 'have'),
  ('to do', 'english', 'do'),
  ('to go', 'english', 'go'),
  ('to speak', 'english', 'speak'),
  ('to eat', 'english', 'eat'),
  ('to live', 'english', 'live');

-- Seed initial verbs for Portuguese
INSERT INTO verbs (name, language, infinitive) VALUES
  ('falar', 'portuguese', 'falar'),
  ('comer', 'portuguese', 'comer'),
  ('viver', 'portuguese', 'viver'),
  ('ser', 'portuguese', 'ser'),
  ('estar', 'portuguese', 'estar'),
  ('ter', 'portuguese', 'ter'),
  ('ir', 'portuguese', 'ir'),
  ('fazer', 'portuguese', 'fazer');
```

Create `apps/database/migration/000002_seed_languages.down.sql`:
```sql
DELETE FROM verbs WHERE language IN ('spanish', 'english', 'portuguese');
```

**Step 4: Remove old migration files**

Delete all old migration files from `apps/database/migration/` that predate these new ones (all files `000003_*` through `000019_*` and any others).

```bash
ls apps/database/migration/
# Then delete everything except the two new ones above
```

**Step 5: Commit**

```bash
git add apps/database/
git commit -m "feat: replace schema with conjugame domain tables"
```

---

## Task 3: Rewrite SQL Queries

**Files:**
- Modify: `apps/database/queries/account.sql` (keep auth queries, add avatar_url, add username)
- Modify: `apps/database/queries/subscriptions.sql` (remove entity count queries)
- Create: `apps/database/queries/verbs.sql`
- Create: `apps/database/queries/questions.sql`
- Create: `apps/database/queries/progress.sql`
- Create: `apps/database/queries/ratings.sql`
- Delete: `apps/database/queries/entity_images.sql`
- Delete: `apps/database/queries/relationships.sql`

**Step 1: Update account.sql — add avatar_url and username to UpdateUser**

Replace the UpdateUser query in `apps/database/queries/account.sql`:

```sql
-- name: UpdateUser :one
UPDATE users SET
  name = COALESCE($2, name),
  email = COALESCE($3, email),
  "emailVerified" = COALESCE($4, "emailVerified"),
  image = COALESCE($5, image),
  avatar_url = COALESCE($6, avatar_url),
  slug = COALESCE($7, slug),
  username = COALESCE($8, username),
  "role" = COALESCE($9, "role"),
  "isTwoFactorEnabled" = COALESCE($10, "isTwoFactorEnabled"),
  "locale" = COALESCE($11, 'en'),
  "updatedAt" = NOW()
WHERE id = $1
RETURNING *;
```

Also remove the Stories/Characters/Locations/Timelines sections from account.sql (everything after the Verification section).

**Step 2: Update subscriptions.sql — remove entity count queries**

Remove the `CountStoriesForUser`, `CountCharactersForUser`, `CountLocationsForUser`, `CountTimelinesForUser` queries. Keep only the subscription CRUD queries.

**Step 3: Create apps/database/queries/verbs.sql**

```sql
-- Verbs

-- name: CreateVerb :one
INSERT INTO verbs (name, language, infinitive)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetVerb :one
SELECT * FROM verbs WHERE id = $1 LIMIT 1;

-- name: ListVerbsByLanguage :many
SELECT * FROM verbs WHERE language = $1 ORDER BY name ASC LIMIT $2 OFFSET $3;

-- name: ListAllVerbs :many
SELECT * FROM verbs ORDER BY language, name ASC LIMIT $1 OFFSET $2;

-- name: UpdateVerb :one
UPDATE verbs SET
  name = COALESCE($2, name),
  language = COALESCE($3, language),
  infinitive = COALESCE($4, infinitive),
  updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteVerb :exec
DELETE FROM verbs WHERE id = $1;
```

**Step 4: Create apps/database/queries/questions.sql**

```sql
-- Questions

-- name: CreateQuestion :one
INSERT INTO questions (verb_id, tense, regularity, verb_type, text, translation, answers, difficulty, language, src)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: GetQuestion :one
SELECT * FROM questions WHERE id = $1 LIMIT 1;

-- name: ListQuestionsByLanguage :many
SELECT * FROM questions WHERE language = $1 ORDER BY id LIMIT $2 OFFSET $3;

-- name: ListQuestionsByLanguageAndDifficulty :many
SELECT * FROM questions
WHERE language = $1 AND difficulty = $2
ORDER BY RANDOM()
LIMIT $3 OFFSET $4;

-- name: GetRandomQuestions :many
SELECT * FROM questions
WHERE language = sqlc.arg(language)
  AND (sqlc.arg(difficulty)::text = '' OR difficulty = sqlc.arg(difficulty))
ORDER BY RANDOM()
LIMIT sqlc.arg(limit_count);

-- name: UpdateQuestion :one
UPDATE questions SET
  tense = COALESCE($2, tense),
  text = COALESCE($3, text),
  translation = COALESCE($4, translation),
  answers = COALESCE($5, answers),
  difficulty = COALESCE($6, difficulty)
WHERE id = $1
RETURNING *;

-- name: UpdateQuestionRatingScore :one
UPDATE questions SET rating_score = $2 WHERE id = $1 RETURNING *;

-- name: DeleteQuestion :exec
DELETE FROM questions WHERE id = $1;
```

**Step 5: Create apps/database/queries/progress.sql**

```sql
-- User Progress

-- name: CreateUserProgress :one
INSERT INTO user_progress (user_id, language, score, total_questions, correct_answers)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListUserProgress :many
SELECT * FROM user_progress
WHERE user_id = $1
ORDER BY completed_at DESC
LIMIT $2 OFFSET $3;

-- name: ListUserProgressByLanguage :many
SELECT * FROM user_progress
WHERE user_id = $1 AND language = $2
ORDER BY completed_at DESC
LIMIT $3 OFFSET $4;

-- name: GetUserLanguageStats :one
SELECT * FROM user_language_stats WHERE user_id = $1 AND language = $2 LIMIT 1;

-- name: ListUserLanguageStats :many
SELECT * FROM user_language_stats
WHERE user_id = $1
ORDER BY total_score DESC;

-- name: UpsertUserLanguageStats :one
INSERT INTO user_language_stats (user_id, language, total_score, total_quizzes, total_correct, total_questions, best_score, last_played_at)
VALUES ($1, $2, $3, 1, $4, $5, $3, NOW())
ON CONFLICT (user_id, language) DO UPDATE SET
  total_score = user_language_stats.total_score + EXCLUDED.total_score,
  total_quizzes = user_language_stats.total_quizzes + 1,
  total_correct = user_language_stats.total_correct + EXCLUDED.total_correct,
  total_questions = user_language_stats.total_questions + EXCLUDED.total_questions,
  best_score = GREATEST(user_language_stats.best_score, EXCLUDED.best_score),
  last_played_at = NOW()
RETURNING *;

-- name: GetLeaderboard :many
SELECT
  uls.user_id,
  u.name,
  u.username,
  u.avatar_url,
  uls.language,
  uls.total_score,
  uls.total_quizzes,
  uls.best_score
FROM user_language_stats uls
JOIN users u ON u.id = uls.user_id
WHERE (sqlc.arg(language)::text = '' OR uls.language = sqlc.arg(language))
ORDER BY uls.total_score DESC
LIMIT sqlc.arg(limit_count);
```

**Step 6: Create apps/database/queries/ratings.sql**

```sql
-- Question Ratings

-- name: UpsertQuestionRating :one
INSERT INTO question_ratings (user_id, question_id, rating)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, question_id) DO UPDATE SET
  rating = EXCLUDED.rating
RETURNING *;

-- name: GetQuestionRating :one
SELECT * FROM question_ratings WHERE user_id = $1 AND question_id = $2 LIMIT 1;

-- name: GetAverageRatingForQuestion :one
SELECT AVG(rating)::decimal AS avg_rating, COUNT(*)::int AS rating_count
FROM question_ratings
WHERE question_id = $1;
```

**Step 7: Delete old query files**

```bash
rm apps/database/queries/entity_images.sql
rm apps/database/queries/relationships.sql
```

**Step 8: Commit**

```bash
git add apps/database/queries/
git commit -m "feat: replace SQL queries with conjugame domain queries"
```

---

## Task 4: Write sqlc TypeScript Files + Update database/index.ts

The project uses sqlc to generate TypeScript from SQL. Since we're replacing the schema, we need to write new sqlc-style TypeScript files manually (matching the pattern of existing files).

**Files:**
- Create: `apps/database/sqlc/verb_sql.ts`
- Create: `apps/database/sqlc/question_sql.ts`
- Create: `apps/database/sqlc/progress_sql.ts`
- Create: `apps/database/sqlc/ratings_sql.ts`
- Modify: `apps/database/sqlc/account_sql.ts` (update UpdateUser signature)
- Modify: `apps/database/sqlc/subscriptions_sql.ts` (remove entity count functions)
- Delete: `apps/database/sqlc/character_sql.ts`, `character_attributes_sql.ts`, `character_relationships_sql.ts`, `entity_images_sql.ts`, `location_attributes_sql.ts`, `relationships_sql.ts`, `story_attributes_sql.ts`, `timeline_events_sql.ts`
- Modify: `apps/database/index.ts`

**Step 1: Read existing sqlc file to understand the pattern**

Read `apps/database/sqlc/subscriptions_sql.ts` to see the exact TypeScript pattern used.

**Step 2: Create apps/database/sqlc/verb_sql.ts**

```typescript
import { Client } from 'pg'

export interface CreateVerbArgs {
  name: string
  language: string
  infinitive: string | null
}

export interface VerbRow {
  id: number
  name: string
  language: string
  infinitive: string | null
  created_at: Date
  updated_at: Date
}

export interface ListVerbsByLanguageArgs {
  language: string
  limit: number
  offset: number
}

export interface ListAllVerbsArgs {
  limit: number
  offset: number
}

export interface UpdateVerbArgs {
  id: number
  name: string | null
  language: string | null
  infinitive: string | null
}

const createVerbQuery = `
INSERT INTO verbs (name, language, infinitive)
VALUES ($1, $2, $3)
RETURNING id, name, language, infinitive, created_at, updated_at
`

export async function createVerb(client: Client, args: CreateVerbArgs): Promise<VerbRow> {
  const result = await client.query(createVerbQuery, [args.name, args.language, args.infinitive])
  return result.rows[0]
}

const getVerbQuery = `SELECT id, name, language, infinitive, created_at, updated_at FROM verbs WHERE id = $1 LIMIT 1`

export async function getVerb(client: Client, args: { id: number }): Promise<VerbRow | null> {
  const result = await client.query(getVerbQuery, [args.id])
  return result.rows.length > 0 ? result.rows[0] : null
}

const listVerbsByLanguageQuery = `
SELECT id, name, language, infinitive, created_at, updated_at
FROM verbs WHERE language = $1 ORDER BY name ASC LIMIT $2 OFFSET $3
`

export async function listVerbsByLanguage(client: Client, args: ListVerbsByLanguageArgs): Promise<VerbRow[]> {
  const result = await client.query(listVerbsByLanguageQuery, [args.language, args.limit, args.offset])
  return result.rows
}

const listAllVerbsQuery = `
SELECT id, name, language, infinitive, created_at, updated_at
FROM verbs ORDER BY language, name ASC LIMIT $1 OFFSET $2
`

export async function listAllVerbs(client: Client, args: ListAllVerbsArgs): Promise<VerbRow[]> {
  const result = await client.query(listAllVerbsQuery, [args.limit, args.offset])
  return result.rows
}

const updateVerbQuery = `
UPDATE verbs SET
  name = COALESCE($2, name),
  language = COALESCE($3, language),
  infinitive = COALESCE($4, infinitive),
  updated_at = NOW()
WHERE id = $1
RETURNING id, name, language, infinitive, created_at, updated_at
`

export async function updateVerb(client: Client, args: UpdateVerbArgs): Promise<VerbRow> {
  const result = await client.query(updateVerbQuery, [args.id, args.name, args.language, args.infinitive])
  return result.rows[0]
}

const deleteVerbQuery = `DELETE FROM verbs WHERE id = $1`

export async function deleteVerb(client: Client, args: { id: number }): Promise<void> {
  await client.query(deleteVerbQuery, [args.id])
}
```

**Step 3: Create apps/database/sqlc/question_sql.ts**

```typescript
import { Client } from 'pg'

export interface QuestionRow {
  id: number
  verb_id: number | null
  tense: string
  regularity: string | null
  verb_type: string | null
  text: string
  translation: string | null
  answers: { text: string; correct: boolean }[]
  difficulty: string
  language: string
  src: string | null
  rating_score: string
  created_at: Date
}

export interface CreateQuestionArgs {
  verb_id: number | null
  tense: string
  regularity: string | null
  verb_type: string | null
  text: string
  translation: string | null
  answers: { text: string; correct: boolean }[]
  difficulty: string
  language: string
  src: string | null
}

export interface ListQuestionsByLanguageArgs {
  language: string
  limit: number
  offset: number
}

export interface ListQuestionsByLanguageAndDifficultyArgs {
  language: string
  difficulty: string
  limit: number
  offset: number
}

export interface GetRandomQuestionsArgs {
  language: string
  difficulty: string
  limit_count: number
}

export interface UpdateQuestionArgs {
  id: number
  tense: string | null
  text: string | null
  translation: string | null
  answers: { text: string; correct: boolean }[] | null
  difficulty: string | null
}

const createQuestionQuery = `
INSERT INTO questions (verb_id, tense, regularity, verb_type, text, translation, answers, difficulty, language, src)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *
`

export async function createQuestion(client: Client, args: CreateQuestionArgs): Promise<QuestionRow> {
  const result = await client.query(createQuestionQuery, [
    args.verb_id, args.tense, args.regularity, args.verb_type,
    args.text, args.translation, JSON.stringify(args.answers),
    args.difficulty, args.language, args.src,
  ])
  return result.rows[0]
}

const getQuestionQuery = `SELECT * FROM questions WHERE id = $1 LIMIT 1`

export async function getQuestion(client: Client, args: { id: number }): Promise<QuestionRow | null> {
  const result = await client.query(getQuestionQuery, [args.id])
  return result.rows.length > 0 ? result.rows[0] : null
}

const listQuestionsByLanguageQuery = `
SELECT * FROM questions WHERE language = $1 ORDER BY id LIMIT $2 OFFSET $3
`

export async function listQuestionsByLanguage(client: Client, args: ListQuestionsByLanguageArgs): Promise<QuestionRow[]> {
  const result = await client.query(listQuestionsByLanguageQuery, [args.language, args.limit, args.offset])
  return result.rows
}

const getRandomQuestionsQuery = `
SELECT * FROM questions
WHERE language = $1
  AND ($2 = '' OR difficulty = $2)
ORDER BY RANDOM()
LIMIT $3
`

export async function getRandomQuestions(client: Client, args: GetRandomQuestionsArgs): Promise<QuestionRow[]> {
  const result = await client.query(getRandomQuestionsQuery, [args.language, args.difficulty, args.limit_count])
  return result.rows
}

const updateQuestionQuery = `
UPDATE questions SET
  tense = COALESCE($2, tense),
  text = COALESCE($3, text),
  translation = COALESCE($4, translation),
  answers = COALESCE($5, answers),
  difficulty = COALESCE($6, difficulty)
WHERE id = $1
RETURNING *
`

export async function updateQuestion(client: Client, args: UpdateQuestionArgs): Promise<QuestionRow> {
  const result = await client.query(updateQuestionQuery, [
    args.id, args.tense, args.text, args.translation,
    args.answers ? JSON.stringify(args.answers) : null, args.difficulty,
  ])
  return result.rows[0]
}

const updateQuestionRatingScoreQuery = `UPDATE questions SET rating_score = $2 WHERE id = $1 RETURNING *`

export async function updateQuestionRatingScore(client: Client, args: { id: number; rating_score: number }): Promise<QuestionRow> {
  const result = await client.query(updateQuestionRatingScoreQuery, [args.id, args.rating_score])
  return result.rows[0]
}

const deleteQuestionQuery = `DELETE FROM questions WHERE id = $1`

export async function deleteQuestion(client: Client, args: { id: number }): Promise<void> {
  await client.query(deleteQuestionQuery, [args.id])
}
```

**Step 4: Create apps/database/sqlc/progress_sql.ts**

```typescript
import { Client } from 'pg'

export interface UserProgressRow {
  id: number
  user_id: string
  language: string
  score: number
  total_questions: number
  correct_answers: number
  completed_at: Date
}

export interface CreateUserProgressArgs {
  user_id: string
  language: string
  score: number
  total_questions: number
  correct_answers: number
}

export interface UserLanguageStatsRow {
  id: number
  user_id: string
  language: string
  total_score: number
  total_quizzes: number
  total_correct: number
  total_questions: number
  best_score: number
  last_played_at: Date | null
}

export interface UpsertUserLanguageStatsArgs {
  user_id: string
  language: string
  score: number
  correct_answers: number
  total_questions: number
}

export interface LeaderboardRow {
  user_id: string
  name: string | null
  username: string | null
  avatar_url: string | null
  language: string
  total_score: number
  total_quizzes: number
  best_score: number
}

export interface GetLeaderboardArgs {
  language: string
  limit_count: number
}

const createUserProgressQuery = `
INSERT INTO user_progress (user_id, language, score, total_questions, correct_answers)
VALUES ($1, $2, $3, $4, $5)
RETURNING *
`

export async function createUserProgress(client: Client, args: CreateUserProgressArgs): Promise<UserProgressRow> {
  const result = await client.query(createUserProgressQuery, [
    args.user_id, args.language, args.score, args.total_questions, args.correct_answers,
  ])
  return result.rows[0]
}

const listUserProgressQuery = `
SELECT * FROM user_progress WHERE user_id = $1 ORDER BY completed_at DESC LIMIT $2 OFFSET $3
`

export async function listUserProgress(client: Client, args: { user_id: string; limit: number; offset: number }): Promise<UserProgressRow[]> {
  const result = await client.query(listUserProgressQuery, [args.user_id, args.limit, args.offset])
  return result.rows
}

const listUserProgressByLanguageQuery = `
SELECT * FROM user_progress WHERE user_id = $1 AND language = $2 ORDER BY completed_at DESC LIMIT $3 OFFSET $4
`

export async function listUserProgressByLanguage(client: Client, args: { user_id: string; language: string; limit: number; offset: number }): Promise<UserProgressRow[]> {
  const result = await client.query(listUserProgressByLanguageQuery, [args.user_id, args.language, args.limit, args.offset])
  return result.rows
}

const listUserLanguageStatsQuery = `
SELECT * FROM user_language_stats WHERE user_id = $1 ORDER BY total_score DESC
`

export async function listUserLanguageStats(client: Client, args: { user_id: string }): Promise<UserLanguageStatsRow[]> {
  const result = await client.query(listUserLanguageStatsQuery, [args.user_id])
  return result.rows
}

const upsertUserLanguageStatsQuery = `
INSERT INTO user_language_stats (user_id, language, total_score, total_quizzes, total_correct, total_questions, best_score, last_played_at)
VALUES ($1, $2, $3, 1, $4, $5, $3, NOW())
ON CONFLICT (user_id, language) DO UPDATE SET
  total_score = user_language_stats.total_score + EXCLUDED.total_score,
  total_quizzes = user_language_stats.total_quizzes + 1,
  total_correct = user_language_stats.total_correct + EXCLUDED.total_correct,
  total_questions = user_language_stats.total_questions + EXCLUDED.total_questions,
  best_score = GREATEST(user_language_stats.best_score, EXCLUDED.best_score),
  last_played_at = NOW()
RETURNING *
`

export async function upsertUserLanguageStats(client: Client, args: UpsertUserLanguageStatsArgs): Promise<UserLanguageStatsRow> {
  const result = await client.query(upsertUserLanguageStatsQuery, [
    args.user_id, args.language, args.score, args.correct_answers, args.total_questions,
  ])
  return result.rows[0]
}

const getLeaderboardQuery = `
SELECT
  uls.user_id,
  u.name,
  u.username,
  u.avatar_url,
  uls.language,
  uls.total_score,
  uls.total_quizzes,
  uls.best_score
FROM user_language_stats uls
JOIN users u ON u.id = uls.user_id
WHERE ($1 = '' OR uls.language = $1)
ORDER BY uls.total_score DESC
LIMIT $2
`

export async function getLeaderboard(client: Client, args: GetLeaderboardArgs): Promise<LeaderboardRow[]> {
  const result = await client.query(getLeaderboardQuery, [args.language, args.limit_count])
  return result.rows
}
```

**Step 5: Create apps/database/sqlc/ratings_sql.ts**

```typescript
import { Client } from 'pg'

export interface QuestionRatingRow {
  id: number
  user_id: string
  question_id: number
  rating: number
  created_at: Date
}

export interface UpsertQuestionRatingArgs {
  user_id: string
  question_id: number
  rating: number
}

export interface AverageRatingRow {
  avg_rating: string | null
  rating_count: number
}

const upsertQuestionRatingQuery = `
INSERT INTO question_ratings (user_id, question_id, rating)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, question_id) DO UPDATE SET rating = EXCLUDED.rating
RETURNING *
`

export async function upsertQuestionRating(client: Client, args: UpsertQuestionRatingArgs): Promise<QuestionRatingRow> {
  const result = await client.query(upsertQuestionRatingQuery, [args.user_id, args.question_id, args.rating])
  return result.rows[0]
}

const getQuestionRatingQuery = `
SELECT * FROM question_ratings WHERE user_id = $1 AND question_id = $2 LIMIT 1
`

export async function getQuestionRating(client: Client, args: { user_id: string; question_id: number }): Promise<QuestionRatingRow | null> {
  const result = await client.query(getQuestionRatingQuery, [args.user_id, args.question_id])
  return result.rows.length > 0 ? result.rows[0] : null
}

const getAverageRatingQuery = `
SELECT AVG(rating)::decimal AS avg_rating, COUNT(*)::int AS rating_count
FROM question_ratings WHERE question_id = $1
`

export async function getAverageRatingForQuestion(client: Client, args: { question_id: number }): Promise<AverageRatingRow> {
  const result = await client.query(getAverageRatingQuery, [args.question_id])
  return result.rows[0]
}
```

**Step 6: Update apps/database/index.ts**

Replace entire file contents:

```typescript
export * from './sqlc/account_sql'
export * from './sqlc/subscriptions_sql'
export * from './sqlc/verb_sql'
export * from './sqlc/question_sql'
export * from './sqlc/progress_sql'
export * from './sqlc/ratings_sql'
```

**Step 7: Update apps/database/sqlc/subscriptions_sql.ts**

Read this file first. Then remove the `countStoriesForUser`, `countCharactersForUser`, `countLocationsForUser`, `countTimelinesForUser` functions (they won't compile since those tables are gone).

**Step 8: Delete old sqlc files**

```bash
rm apps/database/sqlc/character_attributes_sql.ts
rm apps/database/sqlc/character_relationships_sql.ts
rm apps/database/sqlc/entity_images_sql.ts
rm apps/database/sqlc/location_attributes_sql.ts
rm apps/database/sqlc/relationships_sql.ts
rm apps/database/sqlc/story_attributes_sql.ts
rm apps/database/sqlc/timeline_events_sql.ts
# Also remove old story/character/location/timeline sqlc files if they exist:
rm -f apps/database/sqlc/story_sql.ts
rm -f apps/database/sqlc/character_sql.ts
rm -f apps/database/sqlc/location_sql.ts
rm -f apps/database/sqlc/timeline_sql.ts
rm -f apps/database/sqlc/user_sql.ts
rm -f apps/database/sqlc/session_sql.ts
rm -f apps/database/sqlc/verification_sql.ts
```

**Step 9: Commit**

```bash
git add apps/database/
git commit -m "feat: add conjugame sqlc TypeScript database layer"
```

---

## Task 5: Replace Zod Schemas

**Files:**
- Modify: `packages/schema/index.ts`
- Delete: any existing story/character/location/timeline schema files in `packages/schema/`
- Create: `packages/schema/verb.ts`
- Create: `packages/schema/question.ts`
- Create: `packages/schema/quiz.ts`
- Create: `packages/schema/progress.ts`
- Keep: `packages/schema/login.ts`, `register.ts`, `newpassword.ts`, `reset.ts`, `username.ts`

**Step 1: Create packages/schema/verb.ts**

```typescript
import { z } from 'zod'

export const SUPPORTED_LANGUAGES = ['spanish', 'english', 'portuguese'] as const
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

export const VerbSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(255),
  language: z.enum(SUPPORTED_LANGUAGES),
  infinitive: z.string().max(255).nullable(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
})

export const CreateVerbSchema = z.object({
  name: z.string().min(1, 'Verb name is required').max(255),
  language: z.enum(SUPPORTED_LANGUAGES),
  infinitive: z.string().max(255).optional().nullable(),
})

export const UpdateVerbSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(255).optional(),
  language: z.enum(SUPPORTED_LANGUAGES).optional(),
  infinitive: z.string().max(255).optional().nullable(),
})

export type Verb = z.infer<typeof VerbSchema>
export type CreateVerbInput = z.infer<typeof CreateVerbSchema>
export type UpdateVerbInput = z.infer<typeof UpdateVerbSchema>
```

**Step 2: Create packages/schema/question.ts**

```typescript
import { z } from 'zod'
import { SUPPORTED_LANGUAGES } from './verb'

export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number]

export const AnswerSchema = z.object({
  text: z.string().min(1),
  correct: z.boolean(),
})

export const QuestionSchema = z.object({
  id: z.number(),
  verb_id: z.number().nullable(),
  tense: z.string().min(1).max(100),
  regularity: z.string().max(50).nullable(),
  verb_type: z.string().max(50).nullable(),
  text: z.string().min(1),
  translation: z.string().nullable(),
  answers: z.array(AnswerSchema).min(2).max(6),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  language: z.enum(SUPPORTED_LANGUAGES),
  src: z.string().max(255).nullable(),
  rating_score: z.union([z.string(), z.number()]).optional(),
  created_at: z.date().optional(),
})

export const CreateQuestionSchema = z.object({
  verb_id: z.number().optional().nullable(),
  tense: z.string().min(1, 'Tense is required').max(100),
  regularity: z.enum(['regular', 'irregular']).optional().nullable(),
  verb_type: z.string().max(50).optional().nullable(),
  text: z.string().min(1, 'Question text is required'),
  translation: z.string().optional().nullable(),
  answers: z.array(AnswerSchema).min(2, 'At least 2 answers required').max(6),
  difficulty: z.enum(DIFFICULTY_LEVELS).default('medium'),
  language: z.enum(SUPPORTED_LANGUAGES),
  src: z.string().max(255).optional().nullable(),
})

export const RateQuestionSchema = z.object({
  questionId: z.number(),
  rating: z.number().int().min(1).max(5),
})

export type Question = z.infer<typeof QuestionSchema>
export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>
export type Answer = z.infer<typeof AnswerSchema>
export type RateQuestionInput = z.infer<typeof RateQuestionSchema>
```

**Step 3: Create packages/schema/quiz.ts**

```typescript
import { z } from 'zod'
import { SUPPORTED_LANGUAGES } from './verb'
import { DIFFICULTY_LEVELS } from './question'

export const QuizSetupSchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES),
  difficulty: z.enum(DIFFICULTY_LEVELS).default('medium'),
  questionCount: z.number().int().min(5).max(20).default(10),
})

export const SubmitQuizSchema = z.object({
  language: z.string(),
  difficulty: z.string(),
  score: z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
  correctAnswers: z.number().int().min(0),
})

export type QuizSetupInput = z.infer<typeof QuizSetupSchema>
export type SubmitQuizInput = z.infer<typeof SubmitQuizSchema>
```

**Step 4: Create packages/schema/progress.ts**

```typescript
import { z } from 'zod'

export const UserProgressSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  language: z.string(),
  score: z.number(),
  total_questions: z.number(),
  correct_answers: z.number(),
  completed_at: z.date().optional(),
})

export const UserLanguageStatsSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  language: z.string(),
  total_score: z.number(),
  total_quizzes: z.number(),
  total_correct: z.number(),
  total_questions: z.number(),
  best_score: z.number(),
  last_played_at: z.date().nullable().optional(),
})

export type UserProgress = z.infer<typeof UserProgressSchema>
export type UserLanguageStats = z.infer<typeof UserLanguageStatsSchema>
```

**Step 5: Update packages/schema/index.ts**

```typescript
export * from './login'
export * from './register'
export * from './newpassword'
export * from './reset'
export * from './username'
export * from './verb'
export * from './question'
export * from './quiz'
export * from './progress'
```

**Step 6: Commit**

```bash
git add packages/schema/
git commit -m "feat: add conjugame Zod schemas"
```

---

## Task 6: Server Actions — Verbs

**Files:**
- Create: `apps/next/actions/verbs/getVerbs.ts`
- Create: `apps/next/actions/verbs/getVerbById.ts`
- Create: `apps/next/actions/verbs/createVerb.ts`
- Create: `apps/next/actions/verbs/updateVerb.ts`
- Create: `apps/next/actions/verbs/deleteVerb.ts`

Follow the exact pattern from `apps/next/actions/story/getStories.ts`.

**Step 1: Create apps/next/actions/verbs/getVerbs.ts**

```typescript
'use server'
import { listVerbsByLanguage, listAllVerbs } from '@repo/database'
import pool from '../../app/utils/open-pool'

export async function getVerbsByLanguage(language: string, limit = 50, offset = 0) {
  try {
    const client = await pool.connect()
    try {
      return await listVerbsByLanguage(client, { language, limit, offset })
    } finally {
      client.release()
    }
  } catch {
    return []
  }
}

export async function getAllVerbs(limit = 50, offset = 0) {
  try {
    const client = await pool.connect()
    try {
      return await listAllVerbs(client, { limit, offset })
    } finally {
      client.release()
    }
  } catch {
    return []
  }
}
```

**Step 2: Create apps/next/actions/verbs/getVerbById.ts**

```typescript
'use server'
import { getVerb } from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function getVerbById(id: number) {
  try {
    const client = await pool.connect()
    try {
      return await getVerb(client, { id })
    } finally {
      client.release()
    }
  } catch {
    return null
  }
}
```

**Step 3: Create apps/next/actions/verbs/createVerb.ts**

```typescript
'use server'
import { headers } from 'next/headers'
import { auth } from '../../auth'
import { createVerb } from '@repo/database'
import pool from '../../app/utils/open-pool'
import { CreateVerbSchema } from '@repo/schema'

export default async function createVerbAction(input: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return { error: 'Unauthorized' }
  }
  const parsed = CreateVerbSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten() }

  try {
    const client = await pool.connect()
    try {
      const verb = await createVerb(client, {
        name: parsed.data.name,
        language: parsed.data.language,
        infinitive: parsed.data.infinitive ?? null,
      })
      return { verb }
    } finally {
      client.release()
    }
  } catch {
    return { error: 'Failed to create verb' }
  }
}
```

**Step 4: Create apps/next/actions/verbs/deleteVerb.ts**

```typescript
'use server'
import { headers } from 'next/headers'
import { auth } from '../../auth'
import { deleteVerb } from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function deleteVerbAction(id: number) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return { error: 'Unauthorized' }
  }
  try {
    const client = await pool.connect()
    try {
      await deleteVerb(client, { id })
      return { success: true }
    } finally {
      client.release()
    }
  } catch {
    return { error: 'Failed to delete verb' }
  }
}
```

**Step 5: Commit**

```bash
git add apps/next/actions/verbs/
git commit -m "feat: add verb server actions"
```

---

## Task 7: Server Actions — Questions

**Files:**
- Create: `apps/next/actions/questions/getQuestions.ts`
- Create: `apps/next/actions/questions/getRandomQuestions.ts`
- Create: `apps/next/actions/questions/createQuestion.ts`
- Create: `apps/next/actions/questions/deleteQuestion.ts`

**Step 1: Create apps/next/actions/questions/getQuestions.ts**

```typescript
'use server'
import { listQuestionsByLanguage } from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function getQuestions(language: string, limit = 20, offset = 0) {
  try {
    const client = await pool.connect()
    try {
      return await listQuestionsByLanguage(client, { language, limit, offset })
    } finally {
      client.release()
    }
  } catch {
    return []
  }
}
```

**Step 2: Create apps/next/actions/questions/getRandomQuestions.ts**

```typescript
'use server'
import { getRandomQuestions } from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function getRandomQuestionsAction(
  language: string,
  difficulty: string,
  count: number,
) {
  try {
    const client = await pool.connect()
    try {
      return await getRandomQuestions(client, {
        language,
        difficulty,
        limit_count: count,
      })
    } finally {
      client.release()
    }
  } catch {
    return []
  }
}
```

**Step 3: Create apps/next/actions/questions/createQuestion.ts**

```typescript
'use server'
import { headers } from 'next/headers'
import { auth } from '../../auth'
import { createQuestion } from '@repo/database'
import pool from '../../app/utils/open-pool'
import { CreateQuestionSchema } from '@repo/schema'

export default async function createQuestionAction(input: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return { error: 'Unauthorized' }
  }
  const parsed = CreateQuestionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten() }

  try {
    const client = await pool.connect()
    try {
      const question = await createQuestion(client, {
        verb_id: parsed.data.verb_id ?? null,
        tense: parsed.data.tense,
        regularity: parsed.data.regularity ?? null,
        verb_type: parsed.data.verb_type ?? null,
        text: parsed.data.text,
        translation: parsed.data.translation ?? null,
        answers: parsed.data.answers,
        difficulty: parsed.data.difficulty,
        language: parsed.data.language,
        src: parsed.data.src ?? null,
      })
      return { question }
    } finally {
      client.release()
    }
  } catch {
    return { error: 'Failed to create question' }
  }
}
```

**Step 4: Commit**

```bash
git add apps/next/actions/questions/
git commit -m "feat: add question server actions"
```

---

## Task 8: Server Actions — Quiz & Progress

**Files:**
- Create: `apps/next/actions/quiz/submitQuiz.ts`
- Create: `apps/next/actions/progress/getUserProgress.ts`
- Create: `apps/next/actions/progress/getLeaderboard.ts`

**Step 1: Create apps/next/actions/quiz/submitQuiz.ts**

```typescript
'use server'
import { headers } from 'next/headers'
import { auth } from '../../auth'
import { createUserProgress, upsertUserLanguageStats } from '@repo/database'
import pool from '../../app/utils/open-pool'
import { SubmitQuizSchema } from '@repo/schema'

export default async function submitQuiz(input: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: 'Must be logged in to save progress' }

  const parsed = SubmitQuizSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const { language, score, totalQuestions, correctAnswers } = parsed.data

  try {
    const client = await pool.connect()
    try {
      const [progress, stats] = await Promise.all([
        createUserProgress(client, {
          user_id: session.user.id,
          language,
          score,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
        }),
        upsertUserLanguageStats(client, {
          user_id: session.user.id,
          language,
          score,
          correct_answers: correctAnswers,
          total_questions: totalQuestions,
        }),
      ])
      return { progress, stats }
    } finally {
      client.release()
    }
  } catch {
    return { error: 'Failed to save quiz progress' }
  }
}
```

**Step 2: Create apps/next/actions/progress/getUserProgress.ts**

```typescript
'use server'
import { listUserLanguageStats, listUserProgress } from '@repo/database'
import pool from '../../app/utils/open-pool'

export async function getUserLanguageStats(userId: string) {
  try {
    const client = await pool.connect()
    try {
      return await listUserLanguageStats(client, { user_id: userId })
    } finally {
      client.release()
    }
  } catch {
    return []
  }
}

export async function getUserHistory(userId: string, limit = 20, offset = 0) {
  try {
    const client = await pool.connect()
    try {
      return await listUserProgress(client, { user_id: userId, limit, offset })
    } finally {
      client.release()
    }
  } catch {
    return []
  }
}
```

**Step 3: Create apps/next/actions/progress/getLeaderboard.ts**

```typescript
'use server'
import { getLeaderboard } from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function getLeaderboardAction(language = '', limit = 20) {
  try {
    const client = await pool.connect()
    try {
      return await getLeaderboard(client, { language, limit_count: limit })
    } finally {
      client.release()
    }
  } catch {
    return []
  }
}
```

**Step 4: Commit**

```bash
git add apps/next/actions/quiz/ apps/next/actions/progress/
git commit -m "feat: add quiz and progress server actions"
```

---

## Task 9: Server Actions — Ratings

**Files:**
- Create: `apps/next/actions/ratings/rateQuestion.ts`

**Step 1: Create apps/next/actions/ratings/rateQuestion.ts**

```typescript
'use server'
import { headers } from 'next/headers'
import { auth } from '../../auth'
import { upsertQuestionRating, getAverageRatingForQuestion, updateQuestionRatingScore } from '@repo/database'
import pool from '../../app/utils/open-pool'
import { RateQuestionSchema } from '@repo/schema'

export default async function rateQuestion(input: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: 'Must be logged in to rate questions' }

  const parsed = RateQuestionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const { questionId, rating } = parsed.data

  try {
    const client = await pool.connect()
    try {
      await upsertQuestionRating(client, {
        user_id: session.user.id,
        question_id: questionId,
        rating,
      })
      const avgResult = await getAverageRatingForQuestion(client, { question_id: questionId })
      if (avgResult.avg_rating) {
        await updateQuestionRatingScore(client, {
          id: questionId,
          rating_score: parseFloat(avgResult.avg_rating),
        })
      }
      return { success: true, avgRating: avgResult.avg_rating, ratingCount: avgResult.rating_count }
    } finally {
      client.release()
    }
  } catch {
    return { error: 'Failed to rate question' }
  }
}
```

**Step 2: Commit**

```bash
git add apps/next/actions/ratings/
git commit -m "feat: add question rating server action"
```

---

## Task 10: Remove Old Server Actions

**Files:**
- Delete: `apps/next/actions/story/`
- Delete: `apps/next/actions/character/`
- Delete: `apps/next/actions/character-relationships/`
- Delete: `apps/next/actions/location/`
- Delete: `apps/next/actions/timeline/`
- Delete: `apps/next/actions/timeline-events/`
- Delete: `apps/next/actions/relationships/`
- Delete: `apps/next/actions/entities/`

**Step 1: Remove old action directories**

```bash
rm -rf apps/next/actions/story
rm -rf apps/next/actions/character
rm -rf apps/next/actions/character-relationships
rm -rf apps/next/actions/location
rm -rf apps/next/actions/timeline
rm -rf apps/next/actions/timeline-events
rm -rf apps/next/actions/relationships
rm -rf apps/next/actions/entities
```

**Step 2: Commit**

```bash
git add -A apps/next/actions/
git commit -m "chore: remove story-bible server actions"
```

---

## Task 11: Update API Routes

**Files:**
- Delete: `apps/next/app/api/[entityType]/`
- Delete: `apps/next/app/api/character/`
- Delete: `apps/next/app/api/story/`
- Delete: `apps/next/app/api/location/`
- Delete: `apps/next/app/api/timeline/`
- Delete: `apps/next/app/api/delete/`
- Delete: `apps/next/app/api/generate/`
- Delete: `apps/next/app/api/user-redirect/`
- Create: `apps/next/app/api/verbs/route.ts`
- Create: `apps/next/app/api/questions/route.ts`
- Create: `apps/next/app/api/quiz/submit/route.ts`
- Create: `apps/next/app/api/leaderboard/route.ts`
- Modify: `apps/next/app/api/upload/image/route.ts` (simplify to avatar-only)

**Step 1: Remove old API route directories**

```bash
rm -rf "apps/next/app/api/[entityType]"
rm -rf apps/next/app/api/character
rm -rf apps/next/app/api/story
rm -rf apps/next/app/api/location
rm -rf apps/next/app/api/timeline
rm -rf apps/next/app/api/delete
rm -rf apps/next/app/api/generate
rm -rf apps/next/app/api/user-redirect
```

**Step 2: Create apps/next/app/api/verbs/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAllVerbs, getVerbsByLanguage } from '../../../actions/verbs/getVerbs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const language = searchParams.get('language')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  const verbs = language
    ? await getVerbsByLanguage(language, limit, offset)
    : await getAllVerbs(limit, offset)

  return NextResponse.json({ verbs })
}
```

**Step 3: Create apps/next/app/api/questions/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import getQuestions from '../../../actions/questions/getQuestions'
import getRandomQuestionsAction from '../../../actions/questions/getRandomQuestions'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const language = searchParams.get('language') || 'spanish'
  const difficulty = searchParams.get('difficulty') || ''
  const random = searchParams.get('random') === 'true'
  const count = parseInt(searchParams.get('count') || '10')

  if (random) {
    const questions = await getRandomQuestionsAction(language, difficulty, count)
    return NextResponse.json({ questions })
  }

  const questions = await getQuestions(language, count, 0)
  return NextResponse.json({ questions })
}
```

**Step 4: Create apps/next/app/api/quiz/submit/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import submitQuiz from '../../../../actions/quiz/submitQuiz'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await submitQuiz(body)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
```

**Step 5: Create apps/next/app/api/leaderboard/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import getLeaderboardAction from '../../../actions/progress/getLeaderboard'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const language = searchParams.get('language') || ''
  const limit = parseInt(searchParams.get('limit') || '20')

  const leaderboard = await getLeaderboardAction(language, limit)
  return NextResponse.json({ leaderboard })
}
```

**Step 6: Simplify apps/next/app/api/upload/image/route.ts**

Read the existing file, then rewrite it to be avatar-only (remove entity type/id handling, store to a `avatars/` folder in Cloudinary, update `users.avatar_url` instead of `entity_images`):

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cloudinary } from '../../../../lib/cloudinary'
import { validateImageFile } from '../../../../lib/validate-image'
import { requireAuth } from '../../../../lib/auth-middleware'
import pool from '../../../utils/open-pool'
import { rateLimit, RateLimitConfigs } from '../../../../lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, RateLimitConfigs.upload)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth(request)
    if (authResult.error) return authResult.error

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const validationError = validateImageFile(file)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: 'conjugame/avatars',
      transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face' }],
    })

    const client = await pool.connect()
    try {
      await client.query(
        'UPDATE users SET avatar_url = $1, "updatedAt" = NOW() WHERE id = $2',
        [uploadResult.secure_url, authResult.user.id]
      )
    } finally {
      client.release()
    }

    return NextResponse.json({ url: uploadResult.secure_url })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
```

**Step 7: Commit**

```bash
git add -A apps/next/app/api/
git commit -m "feat: replace API routes with conjugame endpoints"
```

---

## Task 12: Replace Feature Components — Quiz

**Files:**
- Delete: `packages/app/features/stories/`
- Delete: `packages/app/features/characters/`
- Delete: `packages/app/features/locations/`
- Delete: `packages/app/features/timelines/`
- Delete: `packages/app/features/create/`
- Delete: `packages/app/features/home-native/`
- Create: `packages/app/features/quiz/quiz-screen.tsx`
- Create: `packages/app/features/quiz/components/QuizSetup.tsx`
- Create: `packages/app/features/quiz/components/QuizQuestion.tsx`
- Create: `packages/app/features/quiz/components/QuizResults.tsx`
- Create: `packages/app/features/quiz/components/ProgressBar.tsx`
- Create: `packages/app/features/quiz/hooks/useQuizSession.ts`

**Step 1: Delete old feature directories**

```bash
rm -rf packages/app/features/stories
rm -rf packages/app/features/characters
rm -rf packages/app/features/locations
rm -rf packages/app/features/timelines
rm -rf packages/app/features/create
rm -rf packages/app/features/home-native
```

**Step 2: Create packages/app/features/quiz/hooks/useQuizSession.ts**

```typescript
import { useState, useCallback } from 'react'
import type { QuestionRow } from '@repo/database'

export type QuizStatus = 'idle' | 'active' | 'complete'

interface QuizState {
  status: QuizStatus
  questions: QuestionRow[]
  currentIndex: number
  score: number
  correctAnswers: number
  selectedAnswer: number | null
  showResult: boolean
}

export function useQuizSession(questions: QuestionRow[]) {
  const [state, setState] = useState<QuizState>({
    status: questions.length > 0 ? 'active' : 'idle',
    questions,
    currentIndex: 0,
    score: 0,
    correctAnswers: 0,
    selectedAnswer: null,
    showResult: false,
  })

  const currentQuestion = state.questions[state.currentIndex] ?? null
  const isLastQuestion = state.currentIndex === state.questions.length - 1

  const selectAnswer = useCallback((answerIndex: number) => {
    if (state.selectedAnswer !== null) return
    const question = state.questions[state.currentIndex]
    if (!question) return

    const answers = question.answers as { text: string; correct: boolean }[]
    const isCorrect = answers[answerIndex]?.correct ?? false

    setState((prev) => ({
      ...prev,
      selectedAnswer: answerIndex,
      showResult: true,
      score: isCorrect ? prev.score + 10 : prev.score,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
    }))
  }, [state.selectedAnswer, state.currentIndex, state.questions])

  const nextQuestion = useCallback(() => {
    if (isLastQuestion) {
      setState((prev) => ({ ...prev, status: 'complete' }))
    } else {
      setState((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        selectedAnswer: null,
        showResult: false,
      }))
    }
  }, [isLastQuestion])

  return { state, currentQuestion, isLastQuestion, selectAnswer, nextQuestion }
}
```

**Step 3: Create packages/app/features/quiz/components/ProgressBar.tsx**

```typescript
'use client'

interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-muted-foreground mb-1">
        <span>Question {current} of {total}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
```

**Step 4: Create packages/app/features/quiz/components/QuizQuestion.tsx**

```typescript
'use client'
import { Button } from '@repo/ui/components/button'
import { cn } from '@repo/ui/lib/utils'
import type { QuestionRow } from '@repo/database'

interface QuizQuestionProps {
  question: QuestionRow
  selectedAnswer: number | null
  showResult: boolean
  onSelectAnswer: (index: number) => void
}

export function QuizQuestion({ question, selectedAnswer, showResult, onSelectAnswer }: QuizQuestionProps) {
  const answers = question.answers as { text: string; correct: boolean }[]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground uppercase tracking-wide">{question.tense}</p>
        <h2 className="text-2xl font-semibold">{question.text}</h2>
        {question.translation && (
          <p className="text-sm text-muted-foreground italic">{question.translation}</p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3">
        {answers.map((answer, index) => {
          const isSelected = selectedAnswer === index
          const isCorrect = answer.correct
          let variant: 'outline' | 'default' | 'destructive' | 'secondary' = 'outline'
          if (showResult && isSelected && isCorrect) variant = 'default'
          else if (showResult && isSelected && !isCorrect) variant = 'destructive'
          else if (showResult && isCorrect) variant = 'secondary'

          return (
            <Button
              key={index}
              variant={variant}
              className={cn('h-auto py-3 px-4 text-left justify-start',
                showResult && isCorrect && 'border-green-500'
              )}
              onClick={() => onSelectAnswer(index)}
              disabled={showResult}
            >
              {answer.text}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 5: Create packages/app/features/quiz/components/QuizSetup.tsx**

```typescript
'use client'
import { useState } from 'react'
import { Button } from '@repo/ui/components/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'
import { SUPPORTED_LANGUAGES, DIFFICULTY_LEVELS } from '@repo/schema'
import type { QuizSetupInput } from '@repo/schema'

interface QuizSetupProps {
  onStart: (config: QuizSetupInput) => void
  isLoading?: boolean
}

export function QuizSetup({ onStart, isLoading }: QuizSetupProps) {
  const [language, setLanguage] = useState<string>('spanish')
  const [difficulty, setDifficulty] = useState<string>('medium')
  const [questionCount, setQuestionCount] = useState<number>(10)

  const handleStart = () => {
    onStart({
      language: language as QuizSetupInput['language'],
      difficulty: difficulty as QuizSetupInput['difficulty'],
      questionCount,
    })
  }

  return (
    <div className="space-y-6 max-w-sm mx-auto">
      <div className="space-y-2">
        <label className="text-sm font-medium">Language</label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang} className="capitalize">
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Difficulty</label>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTY_LEVELS.map((d) => (
              <SelectItem key={d} value={d} className="capitalize">
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Number of Questions</label>
        <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(parseInt(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 15, 20].map((n) => (
              <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button className="w-full" onClick={handleStart} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Start Quiz'}
      </Button>
    </div>
  )
}
```

**Step 6: Create packages/app/features/quiz/components/QuizResults.tsx**

```typescript
'use client'
import { Button } from '@repo/ui/components/button'

interface QuizResultsProps {
  score: number
  correctAnswers: number
  totalQuestions: number
  language: string
  onPlayAgain: () => void
  onViewLeaderboard: () => void
}

export function QuizResults({ score, correctAnswers, totalQuestions, language, onPlayAgain, onViewLeaderboard }: QuizResultsProps) {
  const percentage = Math.round((correctAnswers / totalQuestions) * 100)

  return (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Quiz Complete!</h2>
        <p className="text-muted-foreground capitalize">{language} conjugation</p>
      </div>
      <div className="bg-secondary rounded-xl p-8 space-y-4">
        <div className="text-5xl font-bold text-primary">{score}</div>
        <div className="text-sm text-muted-foreground">points</div>
        <div className="text-lg">
          {correctAnswers} / {totalQuestions} correct ({percentage}%)
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onViewLeaderboard}>View Leaderboard</Button>
        <Button onClick={onPlayAgain}>Play Again</Button>
      </div>
    </div>
  )
}
```

**Step 7: Create packages/app/features/quiz/quiz-screen.tsx**

```typescript
'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { QuizSetup } from './components/QuizSetup'
import { QuizQuestion } from './components/QuizQuestion'
import { QuizResults } from './components/QuizResults'
import { ProgressBar } from './components/ProgressBar'
import { Button } from '@repo/ui/components/button'
import { useQuizSession } from './hooks/useQuizSession'
import type { QuizSetupInput } from '@repo/schema'
import type { QuestionRow } from '@repo/database'

interface QuizScreenProps {
  initialQuestions?: QuestionRow[]
  initialSetup?: QuizSetupInput
}

export function QuizScreen({ initialQuestions = [], initialSetup }: QuizScreenProps) {
  const router = useRouter()
  const [questions, setQuestions] = useState<QuestionRow[]>(initialQuestions)
  const [setup, setSetup] = useState<QuizSetupInput | null>(initialSetup ?? null)
  const [isLoading, setIsLoading] = useState(false)

  const { state, currentQuestion, selectAnswer, nextQuestion } = useQuizSession(questions)

  const handleStart = useCallback(async (config: QuizSetupInput) => {
    setIsLoading(true)
    setSetup(config)
    try {
      const params = new URLSearchParams({
        language: config.language,
        difficulty: config.difficulty,
        count: String(config.questionCount),
        random: 'true',
      })
      const res = await fetch(`/api/questions?${params}`)
      const data = await res.json()
      setQuestions(data.questions || [])
    } catch {
      setQuestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handlePlayAgain = useCallback(() => {
    setQuestions([])
    setSetup(null)
  }, [])

  const handleSubmitQuiz = useCallback(async () => {
    if (!setup) return
    try {
      await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: setup.language,
          difficulty: setup.difficulty,
          score: state.score,
          totalQuestions: questions.length,
          correctAnswers: state.correctAnswers,
        }),
      })
    } catch {
      // non-critical
    }
  }, [setup, state.score, state.correctAnswers, questions.length])

  if (state.status === 'complete') {
    handleSubmitQuiz()
    return (
      <QuizResults
        score={state.score}
        correctAnswers={state.correctAnswers}
        totalQuestions={questions.length}
        language={setup?.language || ''}
        onPlayAgain={handlePlayAgain}
        onViewLeaderboard={() => router.push('/leaderboard')}
      />
    )
  }

  if (questions.length === 0 || !setup) {
    return <QuizSetup onStart={handleStart} isLoading={isLoading} />
  }

  if (!currentQuestion) return null

  return (
    <div className="space-y-6">
      <ProgressBar current={state.currentIndex + 1} total={questions.length} />
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground capitalize">{setup.language} • {setup.difficulty}</span>
        <span className="font-semibold">{state.score} pts</span>
      </div>
      <QuizQuestion
        question={currentQuestion}
        selectedAnswer={state.selectedAnswer}
        showResult={state.showResult}
        onSelectAnswer={selectAnswer}
      />
      {state.showResult && (
        <Button className="w-full" onClick={nextQuestion}>
          {state.currentIndex === questions.length - 1 ? 'See Results' : 'Next Question'}
        </Button>
      )}
    </div>
  )
}
```

**Step 8: Commit**

```bash
git add packages/app/features/quiz/
git commit -m "feat: add quiz feature components and session hook"
```

---

## Task 13: Feature Components — Verbs & Leaderboard

**Files:**
- Create: `packages/app/features/verbs/verbs-screen.tsx`
- Create: `packages/app/features/verbs/components/VerbsGrid.tsx`
- Create: `packages/app/features/leaderboard/leaderboard-screen.tsx`
- Create: `packages/app/features/leaderboard/components/LeaderboardTable.tsx`

**Step 1: Create packages/app/features/verbs/components/VerbsGrid.tsx**

```typescript
'use client'
import type { VerbRow } from '@repo/database'

interface VerbsGridProps {
  verbs: VerbRow[]
}

export function VerbsGrid({ verbs }: VerbsGridProps) {
  if (verbs.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No verbs found.</p>
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {verbs.map((verb) => (
        <div
          key={verb.id}
          className="border rounded-lg p-3 text-center hover:bg-accent transition-colors"
        >
          <p className="font-semibold">{verb.name}</p>
          {verb.infinitive && verb.infinitive !== verb.name && (
            <p className="text-sm text-muted-foreground">{verb.infinitive}</p>
          )}
          <p className="text-xs text-muted-foreground capitalize mt-1">{verb.language}</p>
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Create packages/app/features/verbs/verbs-screen.tsx**

```typescript
'use client'
import { useState } from 'react'
import { VerbsGrid } from './components/VerbsGrid'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'
import { SUPPORTED_LANGUAGES } from '@repo/schema'
import type { VerbRow } from '@repo/database'

interface VerbsScreenProps {
  initialVerbs: VerbRow[]
}

export function VerbsScreen({ initialVerbs }: VerbsScreenProps) {
  const [language, setLanguage] = useState<string>('all')
  const filtered = language === 'all'
    ? initialVerbs
    : initialVerbs.filter((v) => v.language === language)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Verbs</h1>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang} className="capitalize">
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <VerbsGrid verbs={filtered} />
    </div>
  )
}
```

**Step 3: Create packages/app/features/leaderboard/components/LeaderboardTable.tsx**

```typescript
'use client'
import type { LeaderboardRow } from '@repo/database'

interface LeaderboardTableProps {
  rows: LeaderboardRow[]
}

export function LeaderboardTable({ rows }: LeaderboardTableProps) {
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No scores yet. Be the first!</p>
  }
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium">#</th>
            <th className="text-left p-3 font-medium">Player</th>
            <th className="text-left p-3 font-medium">Language</th>
            <th className="text-right p-3 font-medium">Score</th>
            <th className="text-right p-3 font-medium">Quizzes</th>
            <th className="text-right p-3 font-medium">Best</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.user_id}-${row.language}`} className="border-b last:border-0 hover:bg-muted/30">
              <td className="p-3 text-muted-foreground">{i + 1}</td>
              <td className="p-3 font-medium">{row.username || row.name || 'Anonymous'}</td>
              <td className="p-3 capitalize">{row.language}</td>
              <td className="p-3 text-right font-semibold">{row.total_score}</td>
              <td className="p-3 text-right text-muted-foreground">{row.total_quizzes}</td>
              <td className="p-3 text-right text-muted-foreground">{row.best_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

**Step 4: Create packages/app/features/leaderboard/leaderboard-screen.tsx**

```typescript
'use client'
import { useState } from 'react'
import { LeaderboardTable } from './components/LeaderboardTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'
import { SUPPORTED_LANGUAGES } from '@repo/schema'
import type { LeaderboardRow } from '@repo/database'

interface LeaderboardScreenProps {
  initialRows: LeaderboardRow[]
}

export function LeaderboardScreen({ initialRows }: LeaderboardScreenProps) {
  const [language, setLanguage] = useState<string>('all')
  const filtered = language === 'all'
    ? initialRows
    : initialRows.filter((r) => r.language === language)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang} className="capitalize">
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <LeaderboardTable rows={filtered} />
    </div>
  )
}
```

**Step 5: Commit**

```bash
git add packages/app/features/verbs/ packages/app/features/leaderboard/
git commit -m "feat: add verbs and leaderboard feature components"
```

---

## Task 14: Feature Components — User Profile

**Files:**
- Create: `packages/app/features/user/components/LanguageStatsCard.tsx`
- Create: `packages/app/features/user/components/QuizHistoryTable.tsx`
- Modify: `packages/app/features/user/detail-screen.tsx` (replace story-bible profile with conjugame profile)

**Step 1: Read existing packages/app/features/user/detail-screen.tsx** to understand the current structure before modifying.

**Step 2: Create packages/app/features/user/components/LanguageStatsCard.tsx**

```typescript
'use client'
import type { UserLanguageStatsRow } from '@repo/database'

interface LanguageStatsCardProps {
  stats: UserLanguageStatsRow
}

export function LanguageStatsCard({ stats }: LanguageStatsCardProps) {
  const accuracy = stats.total_questions > 0
    ? Math.round((stats.total_correct / stats.total_questions) * 100)
    : 0

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold capitalize text-lg">{stats.language}</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Total Score</p>
          <p className="font-bold text-xl">{stats.total_score}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Best Score</p>
          <p className="font-bold text-xl">{stats.best_score}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Quizzes</p>
          <p className="font-semibold">{stats.total_quizzes}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Accuracy</p>
          <p className="font-semibold">{accuracy}%</p>
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Create packages/app/features/user/components/QuizHistoryTable.tsx**

```typescript
'use client'
import type { UserProgressRow } from '@repo/database'

interface QuizHistoryTableProps {
  history: UserProgressRow[]
}

export function QuizHistoryTable({ history }: QuizHistoryTableProps) {
  if (history.length === 0) {
    return <p className="text-muted-foreground text-center py-6">No quiz history yet.</p>
  }
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium">Date</th>
            <th className="text-left p-3 font-medium">Language</th>
            <th className="text-right p-3 font-medium">Score</th>
            <th className="text-right p-3 font-medium">Correct</th>
          </tr>
        </thead>
        <tbody>
          {history.map((row) => (
            <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="p-3 text-muted-foreground">
                {row.completed_at ? new Date(row.completed_at).toLocaleDateString() : '—'}
              </td>
              <td className="p-3 capitalize">{row.language}</td>
              <td className="p-3 text-right font-semibold">{row.score}</td>
              <td className="p-3 text-right text-muted-foreground">
                {row.correct_answers}/{row.total_questions}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

**Step 4: Replace the user profile screen to show language stats**

Read `packages/app/features/user/detail-screen.tsx` first. Then rewrite the main content section to show `LanguageStatsCard` components instead of story-bible entity grids. Keep the existing layout/header structure.

**Step 5: Commit**

```bash
git add packages/app/features/user/
git commit -m "feat: update user profile to show conjugame language stats"
```

---

## Task 15: Replace App Routes

**Files:**
- Delete: `apps/next/app/[username]/stories/`
- Delete: `apps/next/app/[username]/characters/`
- Delete: `apps/next/app/[username]/locations/`
- Delete: `apps/next/app/[username]/timelines/`
- Delete: `apps/next/app/stories/`
- Delete: `apps/next/app/create/`
- Create: `apps/next/app/quiz/page.tsx`
- Create: `apps/next/app/quiz/layout.tsx`
- Create: `apps/next/app/verbs/page.tsx`
- Create: `apps/next/app/leaderboard/page.tsx`
- Create: `apps/next/app/[username]/history/page.tsx`
- Modify: `apps/next/app/[username]/layout.tsx`
- Modify: `apps/next/app/[username]/page.tsx` (create if needed)

**Step 1: Delete old route directories**

```bash
rm -rf "apps/next/app/[username]/stories"
rm -rf "apps/next/app/[username]/characters"
rm -rf "apps/next/app/[username]/locations"
rm -rf "apps/next/app/[username]/timelines"
rm -rf apps/next/app/stories
rm -rf apps/next/app/create
```

**Step 2: Create apps/next/app/quiz/page.tsx**

```typescript
import { QuizScreen } from '@app/features/quiz/quiz-screen'

export const metadata = { title: 'Quiz — Conjugame' }

export default function QuizPage() {
  return (
    <main className="container max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Conjugation Quiz</h1>
        <p className="text-muted-foreground mt-2">Test your verb conjugation skills</p>
      </div>
      <QuizScreen />
    </main>
  )
}
```

**Step 3: Create apps/next/app/verbs/page.tsx**

```typescript
import { VerbsScreen } from '@app/features/verbs/verbs-screen'
import { getAllVerbs } from '../../actions/verbs/getVerbs'

export const metadata = { title: 'Verbs — Conjugame' }

export default async function VerbsPage() {
  const verbs = await getAllVerbs(200, 0)
  return (
    <main className="container max-w-4xl mx-auto py-12 px-4">
      <VerbsScreen initialVerbs={verbs} />
    </main>
  )
}
```

**Step 4: Create apps/next/app/leaderboard/page.tsx**

```typescript
import { LeaderboardScreen } from '@app/features/leaderboard/leaderboard-screen'
import getLeaderboardAction from '../../actions/progress/getLeaderboard'

export const metadata = { title: 'Leaderboard — Conjugame' }

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboardAction('', 50)
  return (
    <main className="container max-w-4xl mx-auto py-12 px-4">
      <LeaderboardScreen initialRows={leaderboard} />
    </main>
  )
}
```

**Step 5: Create apps/next/app/[username]/history/page.tsx**

```typescript
import { QuizHistoryTable } from '@app/features/user/components/QuizHistoryTable'
import { getUserHistory } from '../../../actions/progress/getUserProgress'
import { resolveUsername } from '../../../lib/resolve-username'

interface Props {
  params: Promise<{ username: string }>
}

export default async function UserHistoryPage({ params }: Props) {
  const { username } = await params
  const profileUser = await resolveUsername(username)
  const history = await getUserHistory(profileUser.id, 20, 0)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Quiz History</h2>
      <QuizHistoryTable history={history} />
    </div>
  )
}
```

**Step 6: Rewrite apps/next/app/[username]/layout.tsx**

Replace the entire layout to show quiz/progress navigation instead of stories/characters/etc. Read the file first, then replace the `sections` array to use:

```typescript
// Replace the imports and sections with conjugame equivalents
import { getUserLanguageStats } from '../../actions/progress/getUserProgress'

// sections for sidebar:
const sections: SidebarSection[] = [
  {
    title: 'Languages',
    icon: 'BookOpen',
    items: languageStats.map((stat) => ({
      id: stat.language,
      name: stat.language.charAt(0).toUpperCase() + stat.language.slice(1),
      slug: stat.language,
      href: `/${username}?language=${stat.language}`,
    })),
    moreHref: `/${username}`,
  },
  {
    title: 'Quiz',
    icon: 'Play',
    items: [],
    createHref: '/quiz',
    moreHref: '/quiz',
  },
  {
    title: 'History',
    icon: 'Clock',
    items: [],
    moreHref: `/${username}/history`,
  },
]
```

**Step 7: Create [username]/page.tsx to show profile**

```typescript
import { LanguageStatsCard } from '@app/features/user/components/LanguageStatsCard'
import { getUserLanguageStats } from '../../actions/progress/getUserProgress'
import { resolveUsername } from '../../lib/resolve-username'

interface Props {
  params: Promise<{ username: string }>
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params
  const profileUser = await resolveUsername(username)
  const stats = await getUserLanguageStats(profileUser.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{profileUser.name || username}</h1>
        <p className="text-muted-foreground">@{username}</p>
      </div>
      {stats.length === 0 ? (
        <p className="text-muted-foreground">No quiz activity yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <LanguageStatsCard key={stat.language} stats={stat} />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 8: Update routes.ts**

Replace `apps/next/routes.ts` with:

```typescript
export const publicRoutes = [
  '/',
  '/verify',
  '/verifytoken',
  '/about',
  '/signin',
  '/leaderboard',
  '/verbs',
]

export const privateRoutes = ['/admin', '/quiz']

export const authRoutes = [
  '/signin',
  '/register',
  '/error',
  '/reset',
  '/new-password',
  '/user',
]

export const apiAuthPrefix = '/api/auth'
export const DEFAULT_LOGIN_REDIRECT = '/quiz'
export const signinRoute = '/signin'
```

**Step 9: Commit**

```bash
git add -A apps/next/app/
git commit -m "feat: add quiz, verbs, leaderboard, and user history routes"
```

---

## Task 16: Update Home Page

**Files:**
- Modify: `packages/app/features/home/screen.tsx`

**Step 1: Read the current home screen**

Read `packages/app/features/home/screen.tsx` to understand the current structure.

**Step 2: Update the home screen copy for Conjugame**

Replace story-bible copy with conjugame copy. Update the `Hero` component props:

```typescript
<Hero
  title="Master Verb Conjugation"
  description="Learn to conjugate verbs in Spanish, English, and Portuguese with interactive quizzes. Track your progress, compete on the leaderboard, and master a new language one verb at a time."
  navigation={navigation}
  buttonLink={'/quiz'}
  buttonText={'Start Quizzing'}
  altButtonLink={'/leaderboard'}
  altButtonText={'View Leaderboard'}
  heroButtonText={'Browse Verbs'}
  heroButtonLink={'/verbs'}
  companyName="Conjugame"
  companyLogo={<Logo className="h-8 w-auto" />}
  companyLink={'/quiz'}
/>
```

**Step 3: Update navigation constants**

Find `packages/app/utils/constants.ts` or wherever `navigation` is defined. Read it first. Update navigation links to: Home (`/`), Quiz (`/quiz`), Verbs (`/verbs`), Leaderboard (`/leaderboard`).

**Step 4: Commit**

```bash
git add packages/app/features/home/ packages/app/utils/
git commit -m "feat: update home page for conjugame"
```

---

## Task 17: Update Package Metadata

**Files:**
- Modify: `package.json` (root)
- Modify: `apps/next/package.json`
- Modify: `readme.md`

**Step 1: Update root package.json**

Read the file, then change the `name` field to `"conjugame-ultimate"` and update the `description`.

**Step 2: Update apps/next/package.json**

Read the file, change `name` to `"@conjugame/next"` and update `description` to `"Conjugame - verb conjugation quiz game"`.

**Step 3: Commit**

```bash
git add package.json apps/next/package.json readme.md
git commit -m "chore: update package metadata for conjugame"
```

---

## Task 18: Final Cleanup

**Files:**
- Remove any remaining story-bible references
- Update `apps/next/app/layout.tsx` title/metadata
- Remove old tests that reference story-bible entities

**Step 1: Update app metadata in apps/next/app/layout.tsx**

Read the file. Change the app title/metadata from "Story Bible" to "Conjugame".

**Step 2: Remove old e2e and unit tests that reference story-bible entities**

```bash
ls apps/next/e2e/
ls apps/next/__tests__/
```

Read relevant test files. Remove any tests referencing stories, characters, locations, timelines. Keep auth-related tests.

**Step 3: Final search for story-bible references**

```bash
grep -r "story-bible\|Story Bible\|storyBible" apps/next/ packages/app/ packages/schema/ --include="*.ts" --include="*.tsx" -l
```

Fix any remaining references found.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup - remove remaining story-bible references"
```

---

## Verification Checklist

After all tasks complete, verify:

- [ ] `git log --oneline` shows clean conjugame history (no story-bible commits)
- [ ] `apps/database/schemas/schema.sql` has conjugame tables only
- [ ] No story/character/location/timeline references in `packages/schema/`
- [ ] No story/character/location/timeline imports in `apps/next/actions/`
- [ ] Quiz page renders at `/quiz`
- [ ] Verbs page renders at `/verbs`
- [ ] Leaderboard page renders at `/leaderboard`
- [ ] User profile shows language stats
- [ ] TypeScript compiles: `pnpm tsc --noEmit`
- [ ] `conjugame/` reference dir is gitignored
