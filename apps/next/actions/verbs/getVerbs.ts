'use server'
import { listVerbsByLanguage, listAllVerbs } from '@repo/database'
import pool from '../../app/utils/open-pool'

export async function getVerbsByLanguage(
  language: string,
  limit = 50,
  offset = 0,
) {
  try {
    const client = await pool.connect()
    try {
      return await listVerbsByLanguage(client, { language, limit, offset })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Failed to fetch verbs by language:', error)
    return []
  }
}

export async function getAllVerbs(limit = 50, offset = 0) {
  try {
    const client = await pool.connect()
    try {
      return await listAllVerbs(client, { limit, offset })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Failed to fetch verbs:', error)
    return []
  }
}
