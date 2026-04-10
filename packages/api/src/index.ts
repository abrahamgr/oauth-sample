import Fastify from 'fastify'
import { config } from './config'
import {
  deleteExpiredCodes,
  deleteExpiredResetTokens,
  deleteExpiredTokens,
  runMigrations,
} from './db'
import { registerCookie } from './plugins/cookie'
import { registerCors } from './plugins/cors'
import { registerRateLimit } from './plugins/rate-limit'
import { authorizeRoutes } from './routes/authorize'
import { internalRoutes } from './routes/internal'
import { passwordResetRoutes } from './routes/password-reset'
import { registerRoutes } from './routes/register'
import { tokenRoutes } from './routes/token'
import { userinfoRoutes } from './routes/userinfo'

const app = Fastify({ logger: { level: 'info' } })

// ── Plugins ───────────────────────────────────────────────────────────────────

await registerCors(app)
await registerCookie(app)
await registerRateLimit(app)

// ── Routes ────────────────────────────────────────────────────────────────────

await app.register(authorizeRoutes)
await app.register(tokenRoutes)
await app.register(userinfoRoutes)
await app.register(registerRoutes)
await app.register(internalRoutes)
await app.register(passwordResetRoutes)

// ── Cleanup ───────────────────────────────────────────────────────────────────

const ONE_DAY_MS = 24 * 60 * 60 * 1000
setInterval(async () => {
  await deleteExpiredCodes()
  await deleteExpiredTokens()
  await deleteExpiredResetTokens()
}, ONE_DAY_MS)

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
