// Configuration and static OAuth client registry
// In production these would come from a database.

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  jwtSecret: requireEnv('JWT_SECRET'),
  sessionSecret: requireEnv('SESSION_SECRET'),
  internalSecret: requireEnv('INTERNAL_SECRET'),
  idpUrl: requireEnv('IDP_URL'),
  appUrl: requireEnv('APP_URL'),
  smtp: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    from: process.env.SMTP_FROM ?? 'noreply@oauth-sample.local',
  },
}

// Registered OAuth clients. In a real auth server this lives in the database.
export interface OAuthClient {
  clientId: string
  name: string
  allowedRedirectUris: string[]
  allowedScopes: string[]
}

export const registeredClients: Record<string, OAuthClient> = {
  'oauth-sample-app': {
    clientId: 'oauth-sample-app',
    name: 'OAuth Sample App',
    allowedRedirectUris:
      process.env.NODE_ENV === 'production'
        ? [`${config.appUrl}/callback`]
        : ['http://localhost:3000/callback'],
    allowedScopes: ['openid', 'profile', 'email'],
  },
}

export function getClient(clientId: string): OAuthClient | undefined {
  return registeredClients[clientId]
}
