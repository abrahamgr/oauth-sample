import type { FastifyInstance } from 'fastify'
import { config } from '../config'
import { findUserByEmail } from '../db'

interface VerifyBody {
  email: string
  password: string
}

export async function internalRoutes(app: FastifyInstance) {
  // POST /internal/verify — verify credentials (called server-to-server from IDP)
  app.post<{ Body: VerifyBody }>('/internal/verify', async (request, reply) => {
    const secret = request.headers['x-internal-secret']
    if (secret !== config.internalSecret) {
      return reply.status(403).send({ error: 'Forbidden' })
    }

    const { email, password } = request.body

    if (!email || !password) {
      return reply
        .status(400)
        .send({ error: 'email and password are required' })
    }

    const user = findUserByEmail(email)
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const valid = await Bun.password.verify(password, user.password_hash)
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    return reply.send({ id: user.id, email: user.email, name: user.name })
  })
}
