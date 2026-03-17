import { NextRequest, NextResponse } from 'next/server'
import { getAllVerbs, getVerbsByLanguage } from '../../../actions/verbs/getVerbs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const language = searchParams.get('language')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  const verbs = language
    ? await getVerbsByLanguage(language, limit, offset)
    : await getAllVerbs(limit, offset)

  return NextResponse.json({ verbs })
}
