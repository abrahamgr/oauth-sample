// Server-side API client for communicating with packages/api.
// All calls include the X-Internal-Secret header so the API knows
// this request is coming from a trusted internal service.

// biome-ignore-start lint/style/noNonNullAssertion: env variables required
const API_URL = process.env.API_URL!
const INTERNAL_SECRET = process.env.INTERNAL_SECRET!
// biome-ignore-end lint/style/noNonNullAssertion: env variables required

const internalHeaders = {
  'Content-Type': 'application/json',
  'X-Internal-Secret': INTERNAL_SECRET,
}

function buildProfileHeaders(userId: string) {
  return {
    ...internalHeaders,
    'X-User-Id': userId,
  }
}

export interface UserResult {
  id: string
  email: string
  name: string
  avatar_url: string | null
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

export async function getUserProfile(userId: string): Promise<UserResult> {
  const res = await fetch(`${API_URL}/internal/profile`, {
    headers: buildProfileHeaders(userId),
  })

  if (!res.ok) {
    const body = (await res.json()) as { error?: string }
    throw new Error(body.error ?? 'Failed to load profile')
  }

  return res.json() as Promise<UserResult>
}

export async function updateUser(
  userId: string,
  profile: { name: string; avatar_url: string | null },
): Promise<UserResult> {
  const res = await fetch(`${API_URL}/internal/profile`, {
    method: 'PATCH',
    headers: buildProfileHeaders(userId),
    body: JSON.stringify(profile),
  })

  if (!res.ok) {
    const body = (await res.json()) as {
      error?: string
      details?: Record<string, string[]>
    }

    if (body.error === 'invalid_request' && body.details) {
      throw new Error(Object.values(body.details).flat()[0] ?? body.error)
    }

    throw new Error(body.error ?? 'Failed to update profile')
  }

  return res.json() as Promise<UserResult>
}

/**
 * Request a password reset email for the given address.
 * Always resolves — the API never reveals whether the email exists.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await fetch(`${API_URL}/forgot-password`, {
    method: 'POST',
    headers: internalHeaders,
    body: JSON.stringify({ email }),
  })
}

/**
 * Reset the user's password using a token from the reset email.
 * Throws if the token is invalid, expired, or already used.
 */
export async function resetPassword(
  token: string,
  password: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/reset-password`, {
    method: 'POST',
    headers: internalHeaders,
    body: JSON.stringify({ token, password }),
  })

  if (!res.ok) {
    const body = (await res.json()) as { error: string }
    throw new Error(body.error ?? 'Reset failed')
  }
}
