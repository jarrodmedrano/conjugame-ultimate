import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96 bits — recommended for GCM

export interface EncryptedApiKey {
  encryptedKey: Buffer
  iv: Buffer
  authTag: Buffer
  maskedKey: string
}

// Lazily validated and cached — Next.js evaluates modules at build time
// (no env vars available), so we cannot throw at module load.
let _masterKey: Buffer | null = null

function getMasterKey(): Buffer {
  if (_masterKey) return _masterKey
  const raw = process.env.API_KEY_ENCRYPTION_KEY
  if (!raw) throw new Error('API_KEY_ENCRYPTION_KEY environment variable is required')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new Error('API_KEY_ENCRYPTION_KEY must be 32 bytes (base64-encoded)')
  _masterKey = key
  return _masterKey
}

function buildMaskedKey(apiKey: string): string {
  return '****' + apiKey.slice(-4)
}

export function encryptApiKey(rawKey: string): EncryptedApiKey {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getMasterKey(), iv)

  const encrypted = Buffer.concat([cipher.update(rawKey, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    encryptedKey: encrypted,
    iv,
    authTag,
    maskedKey: buildMaskedKey(rawKey),
  }
}

export function decryptApiKey(encrypted: EncryptedApiKey): string {
  const decipher = createDecipheriv(ALGORITHM, getMasterKey(), encrypted.iv)
  decipher.setAuthTag(encrypted.authTag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted.encryptedKey),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}
