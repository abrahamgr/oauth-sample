// Server-side API client for communicating with packages/api.
// All calls include the X-Internal-Secret header so the API knows
// this request is coming from a trusted internal service.

const API_URL = process.env.API_URL ?? 'http://localhost:3001'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? 'internal-api-secret'

const internalHeaders = {
  'Content-Type': 'application/json',
  'X-Internal-Secret': INTERNAL_SECRET,
}

export interface UserResult {
  id: string
  email: string
  name: string
}

/**
 * Verify a user's credentials against the API.
 * Returns the user object on success, or null if credentials are invalid.
 */
export async function validateCredentials(
  email: string,
  password: string,
): Promise<UserResult | null> {
  const res = await fetch(`${API_URL}/internal/verify`, {
    method: 'POST',
    headers: internalHeaders,
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) return null
  return res.json() as Promise<UserResult>
}

/**
 * Register a new user via the API.
 * Returns the created user or throws on failure.
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
): Promise<UserResult> {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: internalHeaders,
    body: JSON.stringify({ email, password, name }),
  })

  if (!res.ok) {
    const body = (await res.json()) as { error: string }
    throw new Error(body.error ?? 'Registration failed')
  }

  return res.json() as Promise<UserResult>
}
