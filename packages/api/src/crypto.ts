import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

/**
 * PKCE (Proof Key for Code Exchange) helpers.
 *
 * The app generates a random code_verifier and sends a code_challenge
 * (BASE64URL(SHA-256(code_verifier))) with the authorization request.
 * When exchanging the code for tokens, the app sends the original
 * code_verifier. The server verifies that SHA-256(verifier) === challenge.
 */

/**
 * Verify that SHA-256(codeVerifier) === storedChallenge.
 * Both values are BASE64URL-encoded (no padding).
 */
export function verifyPKCE(
  codeVerifier: string,
  storedChallenge: string,
): boolean {
  const digest = createHash('sha256').update(codeVerifier).digest('base64url')
  return digest === storedChallenge
}

/**
 * Hash a password using scrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

/**
 * Verify a password against a stored scrypt hash.
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const [salt, key] = hash.split(':')
  if (!salt || !key) return false

  const keyBuffer = Buffer.from(key, 'hex')
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer

  if (keyBuffer.length !== derivedKey.length) return false
  return timingSafeEqual(keyBuffer, derivedKey)
}
