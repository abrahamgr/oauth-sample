import type { FastifyInstance } from 'fastify'
import { config } from '../config.js'
import { createUser, findUserByEmail } from '../db.js'

interface RegisterBody {
  email: string
  password: string
  name: string
}

export async function registerRoutes(app: FastifyInstance) {
  // POST /register — create a new user account
  // Protected by X-Internal-Secret so it can't be called from the public internet.
  app.post<{ Body: RegisterBody }>('/register', async (request, reply) => {
    const secret = request.headers['x-internal-secret']
    if (secret !== config.internalSecret) {
      return reply.status(403).send({ error: 'Forbidden' })
    }

    const { email, password, name } = request.body

    if (!email || !password || !name) {
      return reply
        .status(400)
        .send({ error: 'email, password, and name are required' })
    }

    if (findUserByEmail(email)) {
      return reply
        .status(409)
        .send({ error: 'A user with that email already exists' })
    }

    const passwordHash = await Bun.password.hash(password)
    const id = crypto.randomUUID()

    createUser({ id, email, password_hash: passwordHash, name })

    return reply.status(201).send({ id, email, name })
  })
}
