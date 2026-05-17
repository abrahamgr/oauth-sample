import type { FastifyInstance } from 'fastify'
import { config } from '../config'
import { verifyPassword } from '../crypto'
import {
  createDocument,
  deleteDocumentByIdForUser,
  findUserByEmail,
  findUserById,
  listDocumentsByUser,
  updateUserProfile,
} from '../db'
import { createFirebaseCustomToken } from '../firebase-admin'
import {
  createDocumentBodySchema,
  internalProfileHeadersSchema,
  internalVerifyBodySchema,
  updateProfileBodySchema,
} from '../schemas'

export async function internalRoutes(app: FastifyInstance) {
  function verifyInternalSecret(secret: unknown): boolean {
    return secret === config.internalSecret
  }

  function getInternalUserId(headers: Record<string, unknown>): string | null {
    const parsed = internalProfileHeadersSchema.safeParse(headers)
    if (!parsed.success) return null
    return parsed.data['x-user-id']
  }

  // POST /internal/verify — verify credentials (called server-to-server from IDP)
  app.post('/internal/verify', async (request, reply) => {
    const secret = request.headers['x-internal-secret']
    if (!verifyInternalSecret(secret)) {
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

    return reply.send({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
    })
  })

  app.get('/internal/profile', async (request, reply) => {
    const secret = request.headers['x-internal-secret']
    if (!verifyInternalSecret(secret)) {
      request.log.warn('Forbidden: invalid x-internal-secret')
      return reply.status(403).send({ error: 'Forbidden' })
    }

    const userId = getInternalUserId(request.headers as Record<string, unknown>)
    if (!userId) {
      return reply.status(400).send({
        error: 'invalid_request',
        details: { 'x-user-id': ['Required'] },
      })
    }

    const user = await findUserById(userId)
    if (!user) {
      return reply.status(404).send({ error: 'user_not_found' })
    }

    return reply.send({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
    })
  })

  app.patch('/internal/profile', async (request, reply) => {
    const secret = request.headers['x-internal-secret']
    if (!verifyInternalSecret(secret)) {
      request.log.warn('Forbidden: invalid x-internal-secret')
      return reply.status(403).send({ error: 'Forbidden' })
    }

    const userId = getInternalUserId(request.headers as Record<string, unknown>)
    if (!userId) {
      return reply.status(400).send({
        error: 'invalid_request',
        details: { 'x-user-id': ['Required'] },
      })
    }

    const parsed = updateProfileBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_request',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    const user = await findUserById(userId)
    if (!user) {
      return reply.status(404).send({ error: 'user_not_found' })
    }

    await updateUserProfile(userId, parsed.data)

    return reply.send({
      id: user.id,
      email: user.email,
      ...parsed.data,
    })
  })

  app.get('/internal/documents', async (request, reply) => {
    const secret = request.headers['x-internal-secret']
    if (!verifyInternalSecret(secret)) {
      return reply.status(403).send({ error: 'Forbidden' })
    }

    const userId = getInternalUserId(request.headers as Record<string, unknown>)
    if (!userId) {
      return reply.status(400).send({
        error: 'invalid_request',
        details: { 'x-user-id': ['Required'] },
      })
    }

    const documents = await listDocumentsByUser(userId)
    return reply.send({ documents })
  })

  app.post('/internal/documents', async (request, reply) => {
    const secret = request.headers['x-internal-secret']
    if (!verifyInternalSecret(secret)) {
      return reply.status(403).send({ error: 'Forbidden' })
    }

    const userId = getInternalUserId(request.headers as Record<string, unknown>)
    if (!userId) {
      return reply.status(400).send({
        error: 'invalid_request',
        details: { 'x-user-id': ['Required'] },
      })
    }

    const parsed = createDocumentBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_request',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    const expectedPrefix = `documents/${userId}/`
    if (!parsed.data.storage_path.startsWith(expectedPrefix)) {
      request.log.warn(
        { userId, storage_path: parsed.data.storage_path },
        'Rejected document with mismatched storage_path prefix',
      )
      return reply.status(400).send({
        error: 'invalid_request',
        details: { storage_path: ['Path must be scoped to the current user'] },
      })
    }

    const document = await createDocument({
      id: crypto.randomUUID(),
      user_id: userId,
      name: parsed.data.name,
      storage_path: parsed.data.storage_path,
      content_type: parsed.data.content_type,
      size_bytes: parsed.data.size_bytes,
    })

    return reply.status(201).send({ document })
  })

  // POST /internal/firebase-token — mint a Firebase custom token whose uid is
  // the IDP's internal user id. The browser exchanges it via
  // signInWithCustomToken so Storage rules can match request.auth.uid.
  app.post('/internal/firebase-token', async (request, reply) => {
    const secret = request.headers['x-internal-secret']
    if (!verifyInternalSecret(secret)) {
      return reply.status(403).send({ error: 'Forbidden' })
    }

    const userId = getInternalUserId(request.headers as Record<string, unknown>)
    if (!userId) {
      return reply.status(400).send({
        error: 'invalid_request',
        details: { 'x-user-id': ['Required'] },
      })
    }

    try {
      const firebaseToken = await createFirebaseCustomToken(userId)
      return reply.send({ firebaseToken })
    } catch (err) {
      request.log.error({ err }, 'Failed to mint Firebase custom token')
      return reply.status(500).send({ error: 'firebase_token_failed' })
    }
  })

  app.delete<{ Params: { id: string } }>(
    '/internal/documents/:id',
    async (request, reply) => {
      const secret = request.headers['x-internal-secret']
      if (!verifyInternalSecret(secret)) {
        return reply.status(403).send({ error: 'Forbidden' })
      }

      const userId = getInternalUserId(
        request.headers as Record<string, unknown>,
      )
      if (!userId) {
        return reply.status(400).send({
          error: 'invalid_request',
          details: { 'x-user-id': ['Required'] },
        })
      }

      const document = await deleteDocumentByIdForUser(
        request.params.id,
        userId,
      )
      if (!document) {
        return reply.status(404).send({ error: 'document_not_found' })
      }

      return reply.send({ document })
    },
  )
}
