import Fastify from 'fastify'
import { config } from './config'
import { registerCookie } from './plugins/cookie'
import { registerCors } from './plugins/cors'
import { authorizeRoutes } from './routes/authorize'
import { internalRoutes } from './routes/internal'
import { registerRoutes } from './routes/register'
import { tokenRoutes } from './routes/token'
import { userinfoRoutes } from './routes/userinfo'

const app = Fastify({ logger: { level: 'info' } })

// ── Plugins ───────────────────────────────────────────────────────────────────

await registerCors(app)
await registerCookie(app)

// ── Routes ────────────────────────────────────────────────────────────────────

await app.register(authorizeRoutes)
await app.register(tokenRoutes)
await app.register(userinfoRoutes)
await app.register(registerRoutes)
await app.register(internalRoutes)

// ── Start ─────────────────────────────────────────────────────────────────────

try {
  await app.listen({ port: config.port, host: '0.0.0.0' })
  console.log(
    `\n  OAuth API server running on http://localhost:${config.port}\n`,
  )
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
