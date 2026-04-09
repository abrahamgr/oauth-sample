import type { FastifyInstance } from 'fastify'
import { config } from '../config'
import { createUser, findUserByEmail } from '../db'
import { registerBodySchema } from '../schemas'

export async function registerRoutes(app: FastifyInstance) {
  // POST /register — create a new user account
  // Protected by X-Internal-Secret so it can't be called from the public internet.
  app.post('/register', async (request, reply) => {
    const secret = request.headers['x-internal-secret']
    if (secret !== config.internalSecret) {
      return reply.status(403).send({ error: 'Forbidden' })
    }

    const parsed = registerBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_request',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    const { email, password, name } = parsed.data

    if (await findUserByEmail(email)) {
      return reply
        .status(409)
        .send({ error: 'A user with that email already exists' })
    }

    const passwordHash = await Bun.password.hash(password)
    const id = crypto.randomUUID()

    await createUser({ id, email, password_hash: passwordHash, name })

    return reply.status(201).send({ id, email, name })
  })
}
