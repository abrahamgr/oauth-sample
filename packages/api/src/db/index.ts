import { Database } from 'bun:sqlite'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from './schema'

// ── Client ────────────────────────────────────────────────────────────────────

const sqlite = new Database('oauth.sqlite', { create: true })
sqlite.run('PRAGMA journal_mode = WAL')
sqlite.run('PRAGMA foreign_keys = ON')

const db = drizzle(sqlite, { schema })

// ── Types ─────────────────────────────────────────────────────────────────────

export type User = typeof schema.users.$inferSelect
export type OAuthCode = typeof schema.oauthCodes.$inferSelect
export type OAuthToken = typeof schema.oauthTokens.$inferSelect

// ── User queries ──────────────────────────────────────────────────────────────

export function createUser(
  user: Omit<typeof schema.users.$inferInsert, 'created_at'>,
): void {
  db.insert(schema.users).values(user).run()
}

export function findUserByEmail(email: string): User | null {
  return (
    db.select().from(schema.users).where(eq(schema.users.email, email)).get() ??
    null
  )
}

export function findUserById(id: string): User | null {
  return (
    db.select().from(schema.users).where(eq(schema.users.id, id)).get() ?? null
  )
}

// ── Auth code queries ─────────────────────────────────────────────────────────

export function createCode(
  code: Omit<typeof schema.oauthCodes.$inferInsert, never>,
): void {
  db.insert(schema.oauthCodes).values(code).run()
}

export function findCode(code: string): OAuthCode | null {
  return (
    db
      .select()
      .from(schema.oauthCodes)
      .where(eq(schema.oauthCodes.code, code))
      .get() ?? null
  )
}

export function deleteCode(code: string): void {
  db.delete(schema.oauthCodes).where(eq(schema.oauthCodes.code, code)).run()
}

// ── Token queries ─────────────────────────────────────────────────────────────

export function createToken(
  token: Omit<typeof schema.oauthTokens.$inferInsert, 'created_at'>,
): void {
  db.insert(schema.oauthTokens).values(token).run()
}
