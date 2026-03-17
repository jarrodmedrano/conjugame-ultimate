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
  AND ($2::text = '' OR difficulty = $2::text)
ORDER BY RANDOM()
LIMIT $3;

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
