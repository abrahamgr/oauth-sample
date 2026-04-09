import type { FastifyInstance } from 'fastify'
import { SignJWT } from 'jose'
import { config } from '../config'
import { verifyPKCE } from '../crypto'
import {
  createToken,
  deleteCode,
  deleteToken,
  findCode,
  findTokenByRefreshToken,
} from '../db'
import { tokenBodySchema } from '../schemas'

const ACCESS_TOKEN_TTL_S = 3600 // 1 hour
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

async function signAccessToken(userId: string, scope: string): Promise<string> {
  const secret = new TextEncoder().encode(config.jwtSecret)
  return new SignJWT({ scope })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer('oauth-sample-api')
    .setAudience('oauth-sample-app')
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_S}s`)
    .sign(secret)
}

export async function tokenRoutes(app: FastifyInstance) {
  // POST /token — exchange an authorization code or refresh token for tokens.
  app.post(
    '/token',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const parsed = tokenBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'invalid_request',
          details: parsed.error.flatten().fieldErrors,
        })
      }

      const data = parsed.data

      // ── Refresh token grant ───────────────────────────────────────────────────

      if (data.grant_type === 'refresh_token') {
        const { refresh_token, client_id } = data

        const storedToken = await findTokenByRefreshToken(refresh_token)
        if (!storedToken) {
          return reply
            .status(400)
            .send({ error: 'invalid_grant: refresh token not found' })
        }

        if (storedToken.expires_at < Date.now()) {
          await deleteToken(refresh_token)
          return reply
            .status(400)
            .send({ error: 'invalid_grant: refresh token expired' })
        }

        if (storedToken.client_id !== client_id) {
          return reply
            .status(400)
            .send({ error: 'invalid_grant: client_id mismatch' })
        }

        // Token rotation — delete old record before issuing new one
        await deleteToken(refresh_token)

        const accessToken = await signAccessToken(
          storedToken.user_id,
          storedToken.scope,
        )
        const newRefreshToken = crypto.randomUUID()

        await createToken({
          access_token: accessToken,
          refresh_token: newRefreshToken,
          user_id: storedToken.user_id,
          client_id,
          scope: storedToken.scope,
          expires_at: Date.now() + REFRESH_TOKEN_TTL_MS,
        })

        return reply.header('Cache-Control', 'no-store').send({
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: ACCESS_TOKEN_TTL_S,
          refresh_token: newRefreshToken,
          scope: storedToken.scope,
        })
      }

      // ── Authorization code grant ──────────────────────────────────────────────

      const { code, code_verifier, client_id, redirect_uri } = data

      // ── Look up the authorization code ────────────────────────────────────────

      const storedCode = await findCode(code)
      if (!storedCode) {
        return reply
          .status(400)
          .send({ error: 'invalid_grant: code not found' })
      }

      if (storedCode.client_id !== client_id) {
        return reply
          .status(400)
          .send({ error: 'invalid_grant: client_id mismatch' })
      }

      if (storedCode.redirect_uri !== redirect_uri) {
        return reply
          .status(400)
          .send({ error: 'invalid_grant: redirect_uri mismatch' })
      }

      if (storedCode.expires_at < Date.now()) {
        await deleteCode(code)
        return reply.status(400).send({ error: 'invalid_grant: code expired' })
      }

      // ── Verify PKCE ───────────────────────────────────────────────────────────

      if (!verifyPKCE(code_verifier, storedCode.code_challenge)) {
        return reply
          .status(400)
          .send({ error: 'invalid_grant: PKCE verification failed' })
      }

      // ── Delete the code immediately (prevent replay attacks) ──────────────────

      await deleteCode(code)

      // ── Issue JWT access token ────────────────────────────────────────────────

      const accessToken = await signAccessToken(
        storedCode.user_id,
        storedCode.scope,
      )
      const refreshToken = crypto.randomUUID()

      await createToken({
        access_token: accessToken,
        refresh_token: refreshToken,
        user_id: storedCode.user_id,
        client_id,
        scope: storedCode.scope,
        expires_at: Date.now() + REFRESH_TOKEN_TTL_MS,
      })

      return reply.header('Cache-Control', 'no-store').send({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: ACCESS_TOKEN_TTL_S,
        refresh_token: refreshToken,
        scope: storedCode.scope,
      })
    },
  )
}
