import type { FastifyInstance } from 'fastify'
import { jwtVerify } from 'jose'
import { config } from '../config'
import { findUserById } from '../db'

export async function userinfoRoutes(app: FastifyInstance) {
  // GET /userinfo — return profile info for the authenticated user.
  //
  // The client passes its access token as a Bearer token in the
  // Authorization header. We verify the JWT, look up the user, and return
  // their profile claims.
  app.get('/userinfo', async (request, reply) => {
    const authHeader = request.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      request.log.warn('Missing or invalid Authorization header in /userinfo')
      return reply
        .status(401)
        .header('WWW-Authenticate', 'Bearer realm="oauth-sample"')
        .send({ error: 'missing_token' })
    }

    const token = authHeader.slice(7)

    let userId: string
    try {
      const secret = new TextEncoder().encode(config.jwtSecret)
      const { payload } = await jwtVerify(token, secret, {
        issuer: 'oauth-sample-api',
        audience: 'oauth-sample-app',
      })
      userId = payload.sub as string
    } catch (err) {
      request.log.warn({ err }, 'JWT verification failed in /userinfo')
      return reply
        .status(401)
        .header('WWW-Authenticate', 'Bearer error="invalid_token"')
        .send({ error: 'invalid_token' })
    }

    const user = await findUserById(userId)
    if (!user) {
      request.log.warn(
        { userId },
        'User not found in /userinfo for valid token',
      )
      return reply.status(404).send({ error: 'user_not_found' })
    }

    return reply.send({
      sub: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
    })
  })
}
