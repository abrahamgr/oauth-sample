import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  name: text('name').notNull(),
  created_at: integer('created_at')
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
})

export const oauthCodes = sqliteTable('oauth_codes', {
  code: text('code').primaryKey(),
  user_id: text('user_id')
    .notNull()
    .references(() => users.id),
  client_id: text('client_id').notNull(),
  redirect_uri: text('redirect_uri').notNull(),
  code_challenge: text('code_challenge').notNull(),
  scope: text('scope').notNull(),
  expires_at: integer('expires_at').notNull(),
})

export const oauthTokens = sqliteTable('oauth_tokens', {
  access_token: text('access_token').primaryKey(),
  refresh_token: text('refresh_token').notNull().unique(),
  user_id: text('user_id')
    .notNull()
    .references(() => users.id),
  client_id: text('client_id').notNull(),
  scope: text('scope').notNull(),
  expires_at: integer('expires_at').notNull(),
  created_at: integer('created_at')
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
})

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  token: text('token').primaryKey(),
  user_id: text('user_id')
    .notNull()
    .references(() => users.id),
  expires_at: integer('expires_at').notNull(),
  used_at: integer('used_at'),
  created_at: integer('created_at')
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
})
