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
