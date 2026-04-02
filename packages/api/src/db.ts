import { Database } from 'bun:sqlite'

// Open (or create) the SQLite database file
const db = new Database('oauth.sqlite', { create: true })

// Enable WAL mode for better concurrent read performance
db.run('PRAGMA journal_mode = WAL')
db.run('PRAGMA foreign_keys = ON')

// ─── Schema ──────────────────────────────────────────────────────────────────

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,
    email        TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name         TEXT NOT NULL,
    created_at   INTEGER NOT NULL DEFAULT (unixepoch())
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS oauth_codes (
    code            TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    client_id       TEXT NOT NULL,
    redirect_uri    TEXT NOT NULL,
    code_challenge  TEXT NOT NULL,
    scope           TEXT NOT NULL,
    expires_at      INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS oauth_tokens (
    access_token   TEXT PRIMARY KEY,
    refresh_token  TEXT UNIQUE NOT NULL,
    user_id        TEXT NOT NULL,
    client_id      TEXT NOT NULL,
    scope          TEXT NOT NULL,
    expires_at     INTEGER NOT NULL,
    created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`)

// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  password_hash: string
  name: string
}

export interface OAuthCode {
  code: string
  user_id: string
  client_id: string
  redirect_uri: string
  code_challenge: string
  scope: string
  expires_at: number
}

export interface OAuthToken {
  access_token: string
  refresh_token: string
  user_id: string
  client_id: string
  scope: string
  expires_at: number
}

// ─── User queries ─────────────────────────────────────────────────────────────

export function createUser(user: Omit<User, 'id'> & { id: string }): void {
  db.run(
    'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
    [user.id, user.email, user.password_hash, user.name],
  )
}

export function findUserByEmail(email: string): User | null {
  return db
    .query<User, string>('SELECT * FROM users WHERE email = ?')
    .get(email)
}

export function findUserById(id: string): User | null {
  return db.query<User, string>('SELECT * FROM users WHERE id = ?').get(id)
}

// ─── Auth code queries ────────────────────────────────────────────────────────

export function createCode(code: OAuthCode): void {
  db.run(
    `INSERT INTO oauth_codes
       (code, user_id, client_id, redirect_uri, code_challenge, scope, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      code.code,
      code.user_id,
      code.client_id,
      code.redirect_uri,
      code.code_challenge,
      code.scope,
      code.expires_at,
    ],
  )
}

export function findCode(code: string): OAuthCode | null {
  return db
    .query<OAuthCode, string>('SELECT * FROM oauth_codes WHERE code = ?')
    .get(code)
}

export function deleteCode(code: string): void {
  db.run('DELETE FROM oauth_codes WHERE code = ?', [code])
}

// ─── Token queries ────────────────────────────────────────────────────────────

export function createToken(token: OAuthToken): void {
  db.run(
    `INSERT INTO oauth_tokens
       (access_token, refresh_token, user_id, client_id, scope, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      token.access_token,
      token.refresh_token,
      token.user_id,
      token.client_id,
      token.scope,
      token.expires_at,
    ],
  )
}
