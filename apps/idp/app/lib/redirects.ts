const DEFAULT_APP_URL = 'http://localhost:3000'
const DEFAULT_DENY_URL = DEFAULT_APP_URL
const ALLOWED_LOCAL_ORIGINS = new Set([
  DEFAULT_APP_URL,
  'http://localhost:3001',
  'http://localhost:3002',
])

export function sanitizeRedirectTarget(
  request: Request,
  target: string | null | undefined,
  fallback = DEFAULT_APP_URL,
): string {
  if (!target) {
    return fallback
  }

  if (target.startsWith('/') && !target.startsWith('//')) {
    return target
  }

  try {
    const requestUrl = new URL(request.url)
    const nextUrl = new URL(target)

    if (
      nextUrl.origin === requestUrl.origin ||
      ALLOWED_LOCAL_ORIGINS.has(nextUrl.origin)
    ) {
      return nextUrl.toString()
    }
  } catch {
    return fallback
  }

  return fallback
}

export function getDefaultAppRedirect() {
  return DEFAULT_APP_URL
}

export function getDefaultDenyRedirect() {
  return DEFAULT_DENY_URL
}
