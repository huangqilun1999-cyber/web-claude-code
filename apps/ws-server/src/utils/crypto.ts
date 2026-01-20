import { createDecipheriv } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters')
  }
  return Buffer.from(key, 'utf-8')
}

export function decrypt(encrypted: string, ivHex: string): string {
  const iv = Buffer.from(ivHex, 'hex')
  const encryptedText = encrypted.slice(0, -AUTH_TAG_LENGTH * 2)
  const authTag = Buffer.from(encrypted.slice(-AUTH_TAG_LENGTH * 2), 'hex')

  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
