import type { FastifyInstance } from 'fastify'
import { config } from '../config'
import { hashPassword } from '../crypto'
import { createUser, findUserByEmail } from '../db'
import { registerBodySchema } from '../schemas'

export async function registerRoutes(app: FastifyInstance) {
  // POST /register — create a new user account
  // Protected by X-Internal-Secret so it can't be called from the public internet.
  app.post('/register', async (request, reply) => {
    const secret = request.headers['x-internal-secret']
    if (secret !== config.internalSecret) {
      request.log.warn('Forbidden: invalid x-internal-secret in /register')
      return reply.status(403).send({ error: 'Forbidden' })
    }

    const parsed = registerBodySchema.safeParse(request.body)
    if (!parsed.success) {
      request.log.warn(
        {
          errors: parsed.error.flatten().fieldErrors,
          email: (request.body as unknown as { email?: string })?.email,
        },
        'Validation failed for /register',
      )
      return reply.status(400).send({
        error: 'invalid_request',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    const { email, password, name } = parsed.data

    if (await findUserByEmail(email)) {
      request.log.warn({ email }, 'Registration failed: user already exists')
      return reply
        .status(409)
        .send({ error: 'A user with that email already exists' })
    }

    const passwordHash = await hashPassword(password)
    const id = crypto.randomUUID()

    await createUser({
      id,
      email,
      password_hash: passwordHash,
      name,
      avatar_url: null,
    })

    return reply.status(201).send({ id, email, name, avatar_url: null })
  })
}
