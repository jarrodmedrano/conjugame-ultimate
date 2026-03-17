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
