import { bigint, integer, pgTable, text } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  name: text('name').notNull(),
  avatar_url: text('avatar_url'),
  created_at: integer('created_at')
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
})

export const oauthCodes = pgTable('oauth_codes', {
  code: text('code').primaryKey(),
  user_id: text('user_id')
    .notNull()
    .references(() => users.id),
  client_id: text('client_id').notNull(),
  redirect_uri: text('redirect_uri').notNull(),
  code_challenge: text('code_challenge').notNull(),
  scope: text('scope').notNull(),
  expires_at: bigint('expires_at', { mode: 'number' }).notNull(),
})

export const oauthTokens = pgTable('oauth_tokens', {
  access_token: text('access_token').primaryKey(),
  refresh_token: text('refresh_token').notNull().unique(),
  user_id: text('user_id')
    .notNull()
    .references(() => users.id),
  client_id: text('client_id').notNull(),
  scope: text('scope').notNull(),
  expires_at: bigint('expires_at', { mode: 'number' }).notNull(),
  created_at: integer('created_at')
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
})

export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  user_id: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  storage_path: text('storage_path').notNull().unique(),
  content_type: text('content_type').notNull(),
  size_bytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  created_at: integer('created_at')
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
})

export const passwordResetTokens = pgTable('password_reset_tokens', {
  token: text('token').primaryKey(),
  user_id: text('user_id')
    .notNull()
    .references(() => users.id),
  expires_at: bigint('expires_at', { mode: 'number' }).notNull(),
  used_at: integer('used_at'),
  created_at: integer('created_at')
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
})
