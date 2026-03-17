import { v4 as uuidv4 } from 'uuid'
import { createVerification } from '@repo/database'
import pool from '../../app/utils/open-pool'

export const generateVerificationToken = async (
  email: string,
): Promise<string> => {
  const token = uuidv4()
  const expires = new Date(new Date().getTime() + 3600 * 1000)

  const client = await pool.connect()
  try {
    await createVerification(client, {
      id: uuidv4(),
      identifier: email,
      value: token,
      expiresat: expires,
    })
  } finally {
    client.release()
  }

  return token
}
