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
