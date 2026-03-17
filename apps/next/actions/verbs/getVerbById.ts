'use server'
import { getVerb } from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function getVerbById(id: number) {
  try {
    const client = await pool.connect()
    try {
      return await getVerb(client, { id })
    } finally {
      client.release()
    }
  } catch {
    return null
  }
}
