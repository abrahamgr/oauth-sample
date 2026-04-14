/**
 * PKCE (Proof Key for Code Exchange) utilities for the browser.
 *
 * RFC 7636 — https://www.rfc-editor.org/rfc/rfc7636
 *
 * Flow:
 *   1. Generate a cryptographically random code_verifier (43-128 chars).
 *   2. Compute code_challenge = BASE64URL(SHA-256(ASCII(code_verifier))).
 *   3. Send code_challenge with the authorization request.
 *   4. Send code_verifier when exchanging the code for tokens.
 *   5. The server recomputes the challenge and compares — if they match,
 *      only the party that initiated the flow can exchange the code.
 */

/** Generate a random, URL-safe code verifier (128 characters). */
export function generateVerifier(): string {
  const array = new Uint8Array(96) // 96 bytes → 128 base64url chars
  crypto.getRandomValues(array)
  return base64url(array)
}

/**
 * Derive the PKCE code_challenge from a verifier.
 * Uses the Web Crypto API (available in all modern browsers).
 */
export async function generateChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64url(new Uint8Array(hash))
}

/** Encode a Uint8Array as a Base64URL string (no padding). */
function base64url(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
