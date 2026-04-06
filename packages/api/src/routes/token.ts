import type { FastifyInstance } from 'fastify'
import { SignJWT } from 'jose'
import { config } from '../config'
import { verifyPKCE } from '../crypto'
import { createToken, deleteCode, findCode } from '../db'
import { tokenBodySchema } from '../schemas'

export async function tokenRoutes(app: FastifyInstance) {
  // POST /token — exchange an authorization code for access + refresh tokens.
  //
  // The client sends the code it received in the callback along with the
  // original code_verifier. We verify SHA-256(verifier) === stored challenge
  // (PKCE), then issue a signed JWT access token.
  app.post('/token', async (request, reply) => {
    const parsed = tokenBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_request',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    const { code, code_verifier, client_id, redirect_uri } = parsed.data

    // ── Look up the authorization code ────────────────────────────────────────

    const storedCode = findCode(code)
    if (!storedCode) {
      return reply.status(400).send({ error: 'invalid_grant: code not found' })
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
      deleteCode(code)
      return reply.status(400).send({ error: 'invalid_grant: code expired' })
    }

    // ── Verify PKCE ───────────────────────────────────────────────────────────

    if (!verifyPKCE(code_verifier, storedCode.code_challenge)) {
      return reply
        .status(400)
        .send({ error: 'invalid_grant: PKCE verification failed' })
    }

    // ── Delete the code immediately (prevent replay attacks) ──────────────────

    deleteCode(code)

    // ── Issue JWT access token ────────────────────────────────────────────────

    const secret = new TextEncoder().encode(config.jwtSecret)
    const expiresInSeconds = 3600 // 1 hour

    const accessToken = await new SignJWT({ scope: storedCode.scope })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(storedCode.user_id)
      .setIssuer('oauth-sample-api')
      .setAudience('oauth-sample-app')
      .setIssuedAt()
      .setExpirationTime(`${expiresInSeconds}s`)
      .sign(secret)

    const refreshToken = crypto.randomUUID()
    const tokenExpiresAt = Date.now() + expiresInSeconds * 1000

    createToken({
      access_token: accessToken,
      refresh_token: refreshToken,
      user_id: storedCode.user_id,
      client_id,
      scope: storedCode.scope,
      expires_at: tokenExpiresAt,
    })

    return reply.header('Cache-Control', 'no-store').send({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresInSeconds,
      refresh_token: refreshToken,
      scope: storedCode.scope,
    })
  })
}
