/**
 * OAuth 2.0 Authorization Code + PKCE flow helpers.
 *
 * State is stored in sessionStorage so it survives the redirect round-trip
 * but is cleared when the browser tab closes.
 */

import { generateChallenge, generateVerifier } from './pkce'

const API_URL = '/api'
export const IDP_URL = '/idp'
const CLIENT_ID = 'oauth-sample-app'
const REDIRECT_URI = `${window.location.origin}/callback`
export const AUTH_STATE_CHANGE_EVENT = 'oauth-profile-changed'

const STORAGE_KEYS = {
  verifier: 'oauth_code_verifier',
  state: 'oauth_state',
  token: 'oauth_access_token',
} as const

function notifyProfileChanged() {
  window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT))
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.token)
}

// ── Initiate login ────────────────────────────────────────────────────────────

/**
 * Start the OAuth flow:
 *   1. Generate PKCE verifier + challenge.
 *   2. Save the verifier and a random state value to sessionStorage.
 *   3. Redirect the browser to the API's /authorize endpoint.
 */
export async function startLogin(): Promise<void> {
  const verifier = generateVerifier()
  const challenge = await generateChallenge(verifier)
  const state = generateVerifier().slice(0, 32) // random state to prevent CSRF

  sessionStorage.setItem(STORAGE_KEYS.verifier, verifier)
  sessionStorage.setItem(STORAGE_KEYS.state, state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    scope: 'openid profile email',
    state,
  })

  window.location.href = `${API_URL}/authorize?${params.toString()}`
}

// ── Exchange code for tokens ──────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
}

/**
 * Exchange the authorization code for an access token.
 *   1. Validate the state to prevent CSRF.
 *   2. Retrieve the verifier from sessionStorage.
 *   3. POST to /token with the code + verifier.
 *   4. Store the access token in sessionStorage.
 */
export async function exchangeCode(
  code: string,
  state: string,
): Promise<TokenResponse> {
  const storedState = sessionStorage.getItem(STORAGE_KEYS.state)
  if (!storedState || storedState !== state) {
    throw new Error('State mismatch — possible CSRF attack')
  }

  const verifier = sessionStorage.getItem(STORAGE_KEYS.verifier)
  if (!verifier) {
    throw new Error('Code verifier not found in sessionStorage')
  }

  const res = await fetch(`${API_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
    }),
  })

  if (!res.ok) {
    const err = (await res.json()) as { error: string }
    throw new Error(err.error ?? 'Token exchange failed')
  }

  const tokens = (await res.json()) as TokenResponse

  // Store the access token for subsequent API calls
  sessionStorage.setItem(STORAGE_KEYS.token, tokens.access_token)
  notifyProfileChanged()

  // Clean up PKCE state
  sessionStorage.removeItem(STORAGE_KEYS.verifier)
  sessionStorage.removeItem(STORAGE_KEYS.state)

  return tokens
}

// ── Fetch user info ───────────────────────────────────────────────────────────

export interface UserInfo {
  sub: string
  email: string
  name: string
  avatar_url: string | null
}

/** Fetch the authenticated user's profile from the /userinfo endpoint. */
export async function fetchUserInfo(
  token = getAccessToken(),
): Promise<UserInfo> {
  if (!token) throw new Error('No access token found — please log in')

  const res = await fetch(`${API_URL}/userinfo`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch user info')
  }

  return res.json() as Promise<UserInfo>
}

/** True if an access token is stored in sessionStorage. */
export function isLoggedIn(): boolean {
  return Boolean(getAccessToken())
}

/** Clear the local token and redirect to the IDP to clear the session cookie. */
export function logout(): void {
  sessionStorage.removeItem(STORAGE_KEYS.token)
  notifyProfileChanged()
  window.location.href = `${IDP_URL}/logout?redirect=${encodeURIComponent(window.location.origin)}`
}
