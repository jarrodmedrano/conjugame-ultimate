import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@repo/database'
import pool from '../../../utils/open-pool'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ userId: string }> },
) {
  const params = await props.params
  const { userId } = params

  const client = await pool.connect()
  try {
    const user = await getUser(client, { id: userId })

    if (!user?.username) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''

    return NextResponse.redirect(
      new URL(`/${user.username}${query}`, request.url),
      { status: 301 },
    )
  } finally {
    client.release()
  }
}
