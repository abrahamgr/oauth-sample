import type { FastifyInstance } from 'fastify'
import { config } from '../config'
import {
  createResetToken,
  deleteUserTokens,
  findResetToken,
  findUserByEmail,
  markResetTokenUsed,
  updateUserPassword,
} from '../db'
import { sendPasswordResetEmail } from '../email'
import { forgotPasswordSchema, resetPasswordSchema } from '../schemas'

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000 // 15 minutes

export async function passwordResetRoutes(app: FastifyInstance) {
  // POST /forgot-password — request a password reset email.
  //
  // Always returns 200 regardless of whether the email exists to prevent
  // user enumeration attacks.
  app.post(
    '/forgot-password',
    { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const secret = request.headers['x-internal-secret']
      if (secret !== config.internalSecret) {
        return reply.status(403).send({ error: 'Forbidden' })
      }

      const parsed = forgotPasswordSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'invalid_request',
          details: parsed.error.flatten().fieldErrors,
        })
      }

      const { email } = parsed.data
      const user = await findUserByEmail(email)

      if (user) {
        const token = Buffer.from(
          crypto.getRandomValues(new Uint8Array(32)),
        ).toString('hex')
        const expiresAt = Date.now() + RESET_TOKEN_TTL_MS

        await createResetToken(token, user.id, expiresAt)
        // await sendPasswordResetEmail(user.email, user.name, token)
      }

      return reply.send({
        message: 'If that email exists, a reset link has been sent.',
      })
    },
  )

  // POST /reset-password — set a new password using a valid reset token.
  app.post(
    '/reset-password',
    { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const secret = request.headers['x-internal-secret']
      if (secret !== config.internalSecret) {
        return reply.status(403).send({ error: 'Forbidden' })
      }

      const parsed = resetPasswordSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'invalid_request',
          details: parsed.error.flatten().fieldErrors,
        })
      }

      const { token, password } = parsed.data

      const storedToken = await findResetToken(token)
      if (!storedToken) {
        return reply.status(400).send({ error: 'invalid_token' })
      }

      if (storedToken.used_at !== null) {
        return reply.status(400).send({ error: 'invalid_token: already used' })
      }

      if (storedToken.expires_at < Date.now()) {
        return reply.status(400).send({ error: 'invalid_token: expired' })
      }

      const passwordHash = await Bun.password.hash(password)
      await updateUserPassword(storedToken.user_id, passwordHash)
      await markResetTokenUsed(token)
      await deleteUserTokens(storedToken.user_id)

      return reply.send({ message: 'Password updated successfully.' })
    },
  )
}
