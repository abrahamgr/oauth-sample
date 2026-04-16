import { parse, serialize } from 'cookie'
import { jwtVerify, SignJWT } from 'jose'

// SESSION_SECRET must match the API's SESSION_SECRET so that the API can
// verify the session cookie that the IDP sets after login.
const SESSION_SECRET = process.env.SESSION_SECRET

const secret = new TextEncoder().encode(SESSION_SECRET)
export const SESSION_COOKIE_NAME = '__session'
const sessionCookieOptions = {
  httpOnly: true,
  maxAge: 600,
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
} as const

/**
 * Sign a session JWT containing the authenticated user's ID.
 * The API will verify this JWT when it receives the session cookie.
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
  return serialize(SESSION_COOKIE_NAME, token, sessionCookieOptions)
}

export function clearSessionCookie(): string {
  return serialize(SESSION_COOKIE_NAME, '', {
    ...sessionCookieOptions,
    maxAge: 0,
  })
}

export async function verifySession(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get('Cookie')
  const token = cookieHeader ? parse(cookieHeader)[SESSION_COOKIE_NAME] : null
  if (typeof token !== 'string' || token.length === 0) return null

  try {
    const { payload } = await jwtVerify(token, secret)
    return (payload.sub as string) ?? null
  } catch {
    return null
  }
}
