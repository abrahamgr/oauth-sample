import type { FastifyInstance } from 'fastify'
import { jwtVerify } from 'jose'
import { config, getClient } from '../config.js'
import { createCode } from '../db.js'

interface AuthorizeQuery {
  response_type: string
  client_id: string
  redirect_uri: string
  code_challenge: string
  code_challenge_method: string
  scope?: string
  state?: string
}

export async function authorizeRoutes(app: FastifyInstance) {
  // GET /authorize — the OAuth authorization endpoint.
  //
  // Flow:
  // 1. Validate client_id, redirect_uri, and PKCE parameters.
  // 2. Check for a valid idp_session cookie (set by the IDP after login).
  // 3. If no session → redirect to IDP login page.
  // 4. If session valid → issue an auth code and redirect to redirect_uri.
  app.get<{ Querystring: AuthorizeQuery }>(
    '/authorize',
    async (request, reply) => {
      const {
        response_type,
        client_id,
        redirect_uri,
        code_challenge,
        code_challenge_method,
        scope = 'openid profile email',
        state = '',
      } = request.query

      // ── Validate request parameters ──────────────────────────────────────────

      if (response_type !== 'code') {
        return reply.status(400).send({ error: 'unsupported_response_type' })
      }

      const client = getClient(client_id)
      if (!client) {
        return reply.status(400).send({ error: 'invalid_client' })
      }

      if (!client.allowedRedirectUris.includes(redirect_uri)) {
        return reply.status(400).send({ error: 'invalid_redirect_uri' })
      }

      if (!code_challenge || code_challenge_method !== 'S256') {
        return reply
          .status(400)
          .send({ error: 'invalid_request: PKCE S256 required' })
      }

      // ── Check for an existing IDP session cookie ──────────────────────────────

      const sessionToken = request.cookies.idp_session

      if (!sessionToken) {
        // No session — send user to IDP login page.
        // The IDP will redirect back to this /authorize URL after login.
        const authorizeUrl = new URL(
          `http://localhost:${config.port}/authorize`,
        )
        authorizeUrl.search = new URLSearchParams(
          request.query as Record<string, string>,
        ).toString()

        const loginUrl = new URL(`${config.idpUrl}/login`)
        loginUrl.searchParams.set('redirect', authorizeUrl.toString())

        return reply.redirect(loginUrl.toString())
      }

      // ── Verify the session JWT (signed by IDP with shared SESSION_SECRET) ─────

      let userId: string
      try {
        const secret = new TextEncoder().encode(config.sessionSecret)
        const { payload } = await jwtVerify(sessionToken, secret)
        userId = payload.sub as string
      } catch {
        // Invalid or expired session — restart login
        const authorizeUrl = new URL(
          `http://localhost:${config.port}/authorize`,
        )
        authorizeUrl.search = new URLSearchParams(
          request.query as Record<string, string>,
        ).toString()

        const loginUrl = new URL(`${config.idpUrl}/login`)
        loginUrl.searchParams.set('redirect', authorizeUrl.toString())

        return reply.clearCookie('idp_session').redirect(loginUrl.toString())
      }

      // ── Issue authorization code ──────────────────────────────────────────────

      const code = crypto.randomUUID()
      const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

      createCode({
        code,
        user_id: userId,
        client_id,
        redirect_uri,
        code_challenge,
        scope,
        expires_at: expiresAt,
      })

      // Redirect to the app's callback URL with the code and state
      const callbackUrl = new URL(redirect_uri)
      callbackUrl.searchParams.set('code', code)
      if (state) callbackUrl.searchParams.set('state', state)

      return reply.redirect(callbackUrl.toString())
    },
  )
}
