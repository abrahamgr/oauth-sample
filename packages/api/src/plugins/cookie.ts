import fastifyCookie from '@fastify/cookie'
import type { FastifyInstance } from 'fastify'
import { config } from '../config.js'

export async function registerCookie(app: FastifyInstance) {
  await app.register(fastifyCookie, {
    // Used to sign/unsign cookies — shared with the IDP so both can verify
    secret: config.sessionSecret,
    parseOptions: {},
  })
}
