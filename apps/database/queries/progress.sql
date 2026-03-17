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
WHERE ($1::text = '' OR uls.language = $1::text)
ORDER BY uls.total_score DESC
LIMIT $2;
