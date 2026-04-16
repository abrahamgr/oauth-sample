import fastifyCookie from '@fastify/cookie'
import type { FastifyInstance } from 'fastify'
import { config } from '../config'

export async function registerCookie(app: FastifyInstance) {
  await app.register(fastifyCookie, {
    // Shared with the IDP for session JWT verification.
    secret: config.sessionSecret,
    parseOptions: {},
  })
}
