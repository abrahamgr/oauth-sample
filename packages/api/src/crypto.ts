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
  const hasher = new Bun.CryptoHasher('sha256')
  hasher.update(codeVerifier)
  const digest = hasher.digest('base64')

  // Convert standard base64 → base64url
  const challenge = digest
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return challenge === storedChallenge
}
