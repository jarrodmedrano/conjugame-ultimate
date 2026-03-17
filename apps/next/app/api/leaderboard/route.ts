import { NextRequest, NextResponse } from 'next/server'
import getLeaderboardAction from '../../../actions/progress/getLeaderboard'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const language = searchParams.get('language') || ''
  const limit = parseInt(searchParams.get('limit') || '20')

  const leaderboard = await getLeaderboardAction(language, limit)
  return NextResponse.json({ leaderboard })
}
