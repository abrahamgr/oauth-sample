import { SignJWT, jwtVerify } from 'jose'

// SESSION_SECRET must match the API's SESSION_SECRET so that the API can
// verify the session cookie that the IDP sets after login.
const SESSION_SECRET =
  process.env.SESSION_SECRET ??
  'session-signing-secret-change-in-production-32c'

const secret = new TextEncoder().encode(SESSION_SECRET)

/**
 * Sign a session JWT containing the authenticated user's ID.
 * The API will verify this JWT when it receives the idp_session cookie.
 */
export async function signSession(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(secret)
}

/**
 * Build a Set-Cookie header value for the IDP session cookie.
 * HttpOnly prevents JS access; SameSite=Lax allows the cookie to be sent
 * on cross-origin redirects (browser navigations from :3000 → :3001 → :3002).
 */
export function buildSessionCookie(token: string): string {
  return `idp_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`
}

export async function verifySession(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get('Cookie') ?? ''
  const match = cookieHeader.match(/(?:^|;\s*)idp_session=([^;]+)/)
  if (!match) return null
  try {
    const { payload } = await jwtVerify(match[1], secret)
    return (payload.sub as string) ?? null
  } catch {
    return null
  }
}
