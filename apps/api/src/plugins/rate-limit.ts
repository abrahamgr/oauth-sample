import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'

export async function registerRateLimit(app: FastifyInstance) {
  await app.register(rateLimit, {
    // Global default — overridden per-route via config.rateLimit
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (_request, context) => ({
      error: 'too_many_requests',
      message: `Rate limit exceeded. Retry after ${Math.ceil(context.ttl / 1000)} seconds.`,
    }),
  })
}
