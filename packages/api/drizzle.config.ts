import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  dbCredentials: { url: process.env.DATABASE_URL! },
  schema: './src/db/schema.ts',
  out: './drizzle',
})
