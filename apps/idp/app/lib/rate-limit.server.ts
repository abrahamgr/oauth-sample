// Simple in-memory IP-based rate limiter for server actions.
// Resets on server restart — sufficient for a single-node deployment.

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  /** Maximum number of requests allowed within the window. */
  max: number
  /** Window duration in milliseconds. */
  windowMs: number
}

/**
 * Returns true if the key has exceeded the rate limit.
 * The key is typically `"action:ip"` (e.g. `"login:127.0.0.1"`).
 */
export function isRateLimited(key: string, config: RateLimitConfig): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return false
  }

  entry.count += 1

  if (entry.count > config.max) {
    return true
  }

  return false
}

/**
 * Extracts the client IP from a React Router request.
 * Respects X-Forwarded-For when behind a trusted proxy.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  )
}
