# Conjugame Refactor Design

**Date:** 2026-03-16
**Status:** Approved

## Overview

Refactor the story-bible app into **Conjugame** — a verb conjugation quiz game that quizzes users on verb conjugations across multiple languages. Keep the existing app architecture (Next.js 15 monorepo, Better Auth, Go API, PostgreSQL, Stripe, Cloudinary) but replace all story-bible domain content with conjugame domain content.

---

## Architecture

Keep the existing monorepo structure:

```
apps/
  api/          # Go backend - keep, adapt endpoints
  database/     # PostgreSQL migrations - keep structure, replace schema
  next/         # Next.js 15 app - keep, replace content
packages/
  app/          # Shared features - replace with conjugame features
  ui/           # UI component library - keep as-is
  schema/       # Zod validation - replace with conjugame schemas
  config/       # Keep as-is
```

**Keep identical:** Better Auth, session management, middleware, security headers, PNPM/Turbo config, Docker, TypeScript config, Shadcn/ui.
**Keep with minimal changes:** Cloudinary (avatar uploads only), Stripe subscriptions.
**Remove:** Entity relationship system, entity image galleries, Stories/Characters/Locations/Timelines domain.

---

## Database Schema

### Better Auth Tables (unchanged)

- `users` — add `avatar_url` for Cloudinary avatar
- `sessions`, `accounts`, `verifications` — unchanged

### New Application Tables

```sql
-- Supported languages seed: spanish, english, portuguese
CREATE TABLE verbs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  language VARCHAR(50) NOT NULL,
  infinitive VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  verb_id INTEGER REFERENCES verbs(id) ON DELETE SET NULL,
  tense VARCHAR(100) NOT NULL,
  regularity VARCHAR(50),         -- 'regular', 'irregular'
  verb_type VARCHAR(50),          -- '-er', '-ir', '-re', etc.
  text TEXT NOT NULL,
  translation TEXT,
  answers JSONB NOT NULL,         -- [{text: string, correct: boolean}]
  difficulty VARCHAR(20),         -- 'easy', 'medium', 'hard'
  language VARCHAR(50) NOT NULL,
  src VARCHAR(255),
  rating_score DECIMAL DEFAULT 0, -- computed avg from question_ratings
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_language_stats (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(50) NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 0,
  total_quizzes INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  last_played_at TIMESTAMP,
  UNIQUE(user_id, language)
);

CREATE TABLE question_ratings (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);
```

### Seed Data

Initial languages: `spanish`, `english`, `portuguese`

---

## Routes & Pages

```
app/
├── (auth)/                    # Keep existing - login, register, reset password
├── [username]/
│   ├── page.tsx               # Profile with per-language stats
│   └── history/               # Quiz session history
├── quiz/
│   ├── page.tsx               # Select language + difficulty
│   └── [sessionId]/           # Active quiz session
├── verbs/
│   ├── page.tsx               # Browse verbs by language
│   └── [id]/                  # Verb detail
├── leaderboard/
│   └── page.tsx               # Global + per-language leaderboards
├── api/
│   ├── auth/                  # Keep existing Better Auth handlers
│   ├── quiz/                  # Quiz session endpoints
│   ├── verbs/                 # Verb CRUD
│   ├── questions/             # Question management
│   ├── ratings/               # Question ratings
│   ├── progress/              # User progress tracking
│   ├── upload/                # Cloudinary avatar upload only
│   ├── subscription/          # Keep existing Stripe
│   └── webhooks/              # Keep existing Stripe webhooks
├── about/
├── layout.tsx
└── page.tsx                   # Landing page
```

**Server actions** organized by entity: `actions/verbs/`, `actions/questions/`, `actions/quiz/`, `actions/progress/`, `actions/ratings/`.

---

## Features & Components

```
packages/app/features/
├── quiz/
│   ├── components/
│   │   ├── QuizSetup.tsx        # Language + difficulty selector
│   │   ├── QuizQuestion.tsx     # Multiple choice question card
│   │   ├── QuizResults.tsx      # End of session score summary
│   │   └── ProgressBar.tsx      # Quiz progress indicator
│   ├── hooks/
│   │   └── useQuizSession.ts    # Quiz state machine
│   └── quiz-screen.tsx
├── verbs/
│   ├── components/
│   │   ├── VerbsGrid.tsx
│   │   └── VerbDetail.tsx
│   └── verbs-screen.tsx
├── leaderboard/
│   ├── components/
│   │   ├── LeaderboardTable.tsx
│   │   └── LanguageFilter.tsx
│   └── leaderboard-screen.tsx
├── user/
│   ├── components/
│   │   ├── LanguageStatsCard.tsx
│   │   └── QuizHistoryTable.tsx
│   └── profile-screen.tsx
└── shared/
```

**Zod schemas** in `packages/schema/`: `verb`, `question`, `quizSession`, `questionRating`, `userProgress`.

---

## Git History

1. Remove existing `.git` directory
2. `git init` fresh repo
3. Initial commit: `feat: initial conjugame - verb conjugation quiz game`
4. `/conjugame` reference directory kept but listed in `.gitignore`
