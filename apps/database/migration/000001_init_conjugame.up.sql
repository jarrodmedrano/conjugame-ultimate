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
