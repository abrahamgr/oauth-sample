import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  dbCredentials: { url: 'oauth.sqlite' },
  schema: './src/db/schema.ts',
  out: './drizzle',
})
