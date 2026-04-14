import { eq, lt } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from './schema'

// ── Client ────────────────────────────────────────────────────────────────────

// biome-ignore lint/style/noNonNullAssertion: env variables required
const DATABASE_URL = process.env.DATABASE_URL!

const client = postgres(DATABASE_URL)
export const db = drizzle(client, { schema })

export async function runMigrations() {
  const migrationClient = postgres(DATABASE_URL, { max: 1 })
  await migrate(drizzle(migrationClient), { migrationsFolder: './drizzle' })
  await migrationClient.end()
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type User = typeof schema.users.$inferSelect
export type OAuthCode = typeof schema.oauthCodes.$inferSelect
export type OAuthToken = typeof schema.oauthTokens.$inferSelect
export type PasswordResetToken = typeof schema.passwordResetTokens.$inferSelect

// ── User queries ──────────────────────────────────────────────────────────────

export async function createUser(
  user: Omit<typeof schema.users.$inferInsert, 'created_at'>,
): Promise<void> {
  await db.insert(schema.users).values(user)
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const [row] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
  return row ?? null
}

export async function findUserById(id: string): Promise<User | null> {
  const [row] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
  return row ?? null
}

export async function updateUserPassword(
  id: string,
  passwordHash: string,
): Promise<void> {
  await db
    .update(schema.users)
    .set({ password_hash: passwordHash })
    .where(eq(schema.users.id, id))
}

// ── Auth code queries ─────────────────────────────────────────────────────────

export async function createCode(
  code: Omit<typeof schema.oauthCodes.$inferInsert, never>,
): Promise<void> {
  await db.insert(schema.oauthCodes).values(code)
}

export async function findCode(code: string): Promise<OAuthCode | null> {
  const [row] = await db
    .select()
    .from(schema.oauthCodes)
    .where(eq(schema.oauthCodes.code, code))
  return row ?? null
}

export async function deleteCode(code: string): Promise<void> {
  await db.delete(schema.oauthCodes).where(eq(schema.oauthCodes.code, code))
}

// ── Token queries ─────────────────────────────────────────────────────────────

export async function createToken(
  token: Omit<typeof schema.oauthTokens.$inferInsert, 'created_at'>,
): Promise<void> {
  await db.insert(schema.oauthTokens).values(token)
}

export async function findTokenByRefreshToken(
  refreshToken: string,
): Promise<OAuthToken | null> {
  const [row] = await db
    .select()
    .from(schema.oauthTokens)
    .where(eq(schema.oauthTokens.refresh_token, refreshToken))
  return row ?? null
}

export async function deleteToken(refreshToken: string): Promise<void> {
  await db
    .delete(schema.oauthTokens)
    .where(eq(schema.oauthTokens.refresh_token, refreshToken))
}

// ── Password reset token queries ──────────────────────────────────────────────

export async function createResetToken(
  token: string,
  userId: string,
  expiresAt: number,
): Promise<void> {
  await db
    .insert(schema.passwordResetTokens)
    .values({ token, user_id: userId, expires_at: expiresAt })
}

export async function findResetToken(
  token: string,
): Promise<PasswordResetToken | null> {
  const [row] = await db
    .select()
    .from(schema.passwordResetTokens)
    .where(eq(schema.passwordResetTokens.token, token))
  return row ?? null
}

export async function markResetTokenUsed(token: string): Promise<void> {
  await db
    .update(schema.passwordResetTokens)
    .set({ used_at: Math.floor(Date.now() / 1000) })
    .where(eq(schema.passwordResetTokens.token, token))
}

// ── Cleanup queries ───────────────────────────────────────────────────────────

export async function deleteExpiredCodes(): Promise<void> {
  await db
    .delete(schema.oauthCodes)
    .where(lt(schema.oauthCodes.expires_at, Date.now()))
}

export async function deleteExpiredTokens(): Promise<void> {
  await db
    .delete(schema.oauthTokens)
    .where(lt(schema.oauthTokens.expires_at, Date.now()))
}

export async function deleteUserTokens(userId: string): Promise<void> {
  await db
    .delete(schema.oauthTokens)
    .where(eq(schema.oauthTokens.user_id, userId))
}

export async function deleteExpiredResetTokens(): Promise<void> {
  await db
    .delete(schema.passwordResetTokens)
    .where(lt(schema.passwordResetTokens.expires_at, Date.now()))
}
