import { Client } from 'pg'

export interface QuestionAnswer {
  text: string
  correct: boolean
}

export interface QuestionRow {
  id: number
  verb_id: number | null
  tense: string
  regularity: string | null
  verb_type: string | null
  text: string
  translation: string | null
  answers: QuestionAnswer[]
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
  answers: QuestionAnswer[]
  difficulty: string
  language: string
  src: string | null
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
  answers: QuestionAnswer[] | null
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

export async function listQuestionsByLanguage(client: Client, args: { language: string; limit: number; offset: number }): Promise<QuestionRow[]> {
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
