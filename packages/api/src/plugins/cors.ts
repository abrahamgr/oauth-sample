import cors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'
import { config } from '../config.js'

export async function registerCors(app: FastifyInstance) {
  await app.register(cors, {
    origin: [config.appUrl, config.idpUrl],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Secret'],
  })
}
