import type { FastifyInstance } from 'fastify'
import { config } from '../config'
import { verifyPassword } from '../crypto'
import { findUserByEmail } from '../db'
import { internalVerifyBodySchema } from '../schemas'

export async function internalRoutes(app: FastifyInstance) {
  // POST /internal/verify — verify credentials (called server-to-server from IDP)
  app.post('/internal/verify', async (request, reply) => {
    const secret = request.headers['x-internal-secret']
    if (secret !== config.internalSecret) {
      request.log.warn('Forbidden: invalid x-internal-secret')
      return reply.status(403).send({ error: 'Forbidden' })
    }

    const parsed = internalVerifyBodySchema.safeParse(request.body)
    if (!parsed.success) {
      request.log.warn(
        {
          errors: parsed.error.flatten().fieldErrors,
          email: (request.body as unknown as { email?: string })?.email,
        },
        'Validation failed for /internal/verify',
      )
      return reply.status(400).send({
        error: 'invalid_request',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    const { email, password } = parsed.data

    const user = await findUserByEmail(email)
    if (!user) {
      request.log.warn({ email }, 'Invalid credentials: user not found')
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      request.log.warn({ email }, 'Invalid credentials: password mismatch')
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    return reply.send({ id: user.id, email: user.email, name: user.name })
  })
}
