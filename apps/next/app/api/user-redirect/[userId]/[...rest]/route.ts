import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@repo/database'
import pool from '../../../../utils/open-pool'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ userId: string; rest?: string[] }> },
) {
  const params = await props.params
  const { userId, rest = [] } = params

  const client = await pool.connect()
  try {
    const user = await getUser(client, { id: userId })

    if (!user?.username) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const restPath = rest.length > 0 ? `/${rest.join('/')}` : ''
    const { searchParams } = new URL(request.url)
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''

    return NextResponse.redirect(
      new URL(`/${user.username}${restPath}${query}`, request.url),
      { status: 301 },
    )
  } finally {
    client.release()
  }
}
