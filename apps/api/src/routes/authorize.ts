import type { FastifyInstance } from 'fastify'
import { jwtVerify } from 'jose'
import {
  config,
  getClient,
  registeredClients,
  SESSION_COOKIE_NAME,
} from '../config'
import { createCode } from '../db'
import { authorizeQuerySchema } from '../schemas'

export async function authorizeRoutes(app: FastifyInstance) {
  // GET /authorize — the OAuth authorization endpoint.
  //
  // Flow:
  // 1. Validate client_id, redirect_uri, and PKCE parameters.
  // 2. Check for a valid session cookie (set by the IDP after login).
  // 3. If no session → redirect to IDP login page.
  // 4. If session valid → issue an auth code and redirect to redirect_uri.
  app.get('/authorize', async (request, reply) => {
    const parsed = authorizeQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      request.log.warn(
        { errors: parsed.error.flatten().fieldErrors, query: request.query },
        'Validation failed for /authorize',
      )
      return reply.status(400).send({
        error: 'invalid_request',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    const {
      response_type: _response_type,
      client_id,
      redirect_uri,
      code_challenge,
      code_challenge_method: _code_challenge_method,
      scope,
      state,
    } = parsed.data

    // ── Validate client ───────────────────────────────────────────────────────

    const client = getClient(client_id)
    if (!client) {
      request.log.warn(
        `Invalid client_id in /authorize request: ${client_id}, configured clients: ${Object.keys(registeredClients).join(',')}`,
      )
      return reply.status(400).send({ error: 'invalid_client' })
    }

    if (!client.allowedRedirectUris.includes(redirect_uri)) {
      request.log.warn(
        `Invalid redirect_uri in /authorize request: ${redirect_uri}, allowed URIs: ${client.allowedRedirectUris.join(',')}`,
      )
      return reply.status(400).send({ error: 'invalid_redirect_uri' })
    }

    const forwardedHost = request.headers['x-forwarded-host'] as
      | string
      | undefined
    const host = forwardedHost || request.headers.host
    const protocol =
      (request.headers['x-forwarded-proto'] as string | undefined) ||
      request.protocol
    const authorizeUrl = `${protocol}://${host}${request.url}`

    const redirectToLogin = () => {
      const loginUrl = new URL(`${config.idpUrl}/login`)
      loginUrl.searchParams.set('redirect', authorizeUrl)
      return reply.redirect(loginUrl.toString())
    }

    // ── Check for an existing IDP session cookie ──────────────────────────────

    const sessionToken = request.cookies[SESSION_COOKIE_NAME]

    if (!sessionToken) {
      // No session — send user to IDP login page.
      request.log.warn(
        { cookies: Object.keys(request.cookies) },
        'No session cookie found',
      )
      // The IDP will redirect back to this /authorize URL after login.
      return redirectToLogin()
    }

    // ── Verify the session JWT (signed by IDP with shared SESSION_SECRET) ─────

    let userId: string
    try {
      const secret = new TextEncoder().encode(config.sessionSecret)
      const { payload } = await jwtVerify(sessionToken, secret)
      userId = payload.sub as string
    } catch (error) {
      // Invalid or expired session — restart login
      request.log.warn({ error }, 'Invalid or expired session — restart login')
      reply.clearCookie(SESSION_COOKIE_NAME)
      return redirectToLogin()
    }

    // ── Issue authorization code ──────────────────────────────────────────────

    const code = crypto.randomUUID()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    await createCode({
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
  })
}
