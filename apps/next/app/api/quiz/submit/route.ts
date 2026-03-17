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
