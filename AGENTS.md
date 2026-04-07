# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
# Start all three services in parallel
bun run dev

# Lint (read-only)
bun run lint

# Lint + auto-fix
bun run check

# Format only
bun run format

# Run a single package
bun run --filter=api dev
bun run --filter=idp dev
bun run --filter=app dev

# Push Drizzle schema to SQLite (api package only)
cd packages/api && bun run db:push
```

No test suite exists yet. There are no test commands.

## Code Style

BiomeJS enforces: single quotes, double quotes in JSX attributes, no semicolons, trailing commas, 2-space indent. Running `bun run check` auto-fixes formatting. Do not add `.js` extensions to relative imports — all packages use `moduleResolution: bundler` and Bun/Vite resolve TypeScript natively.

## Architecture

Three Bun packages in a workspace, each running on a fixed port:

| Package | Port | Role |
|---|---|---|
| `packages/api` | 3001 | Fastify OAuth Authorization Server |
| `packages/idp` | 3002 | React Router v7 SSR Identity Provider (login/register UI) |
| `packages/app` | 3000 | Vite + React SPA (OAuth client) |

### OAuth 2.0 PKCE Flow

```
app (3000) → api/authorize (3001) → idp/login (3002) → api/authorize → app/callback → api/token → app/success
```

1. `app/src/oauth.ts:startLogin()` — generates PKCE verifier/challenge, stores in `sessionStorage`, redirects to `api:3001/authorize`
2. `api/routes/authorize.ts` — if no `idp_session` cookie, redirects to `idp:3002/login?redirect=<authorize_url>`
3. `idp/routes/login.tsx` — user submits credentials → `lib/api-client.ts` calls `api:3001/internal/verify` → sets `idp_session` cookie → redirects back to `api:3001/authorize`
4. `api/routes/authorize.ts` — verifies `idp_session` JWT, issues auth code, redirects to `app:3000/callback`
5. `app/src/pages/Callback.tsx` — exchanges code + verifier via `api:3001/token` (PKCE verified), stores access token in `sessionStorage`
6. `app/src/pages/Profile.tsx` — calls `api:3001/userinfo` with Bearer token

### Session Cookie

The `idp_session` cookie is a short-lived (10 min) HS256 JWT signed with `SESSION_SECRET`. This secret is **shared between api and idp** — the API verifies the cookie the IDP sets. Cookies scope to `localhost` hostname (not port), so the browser sends them to both :3001 and :3002.

Logout: `app/src/oauth.ts:logout()` clears `sessionStorage` then redirects to `idp:3002/logout`, which sets `Max-Age=0` on the `idp_session` cookie before redirecting back to the app.

### API Package (`packages/api`)

- `src/config.ts` — env vars + static OAuth client registry (`registeredClients`)
- `src/db/schema.ts` — Drizzle table definitions (`users`, `oauthCodes`, `oauthTokens`)
- `src/db/index.ts` — Drizzle client (bun:sqlite) + all query helper functions
- `src/schemas.ts` — Zod schemas for all route inputs; import from here for validation
- `src/crypto.ts` — `verifyPKCE(verifier, challenge)` using `Bun.CryptoHasher`
- Routes are protected by `X-Internal-Secret` header for `/register` and `/internal/*`

### IDP Package (`packages/idp`)

- Framework mode React Router v7 (SSR). Routes are defined in `app/routes.ts`.
- `app/sessions.server.ts` — `signSession(userId)` / `buildSessionCookie(token)` — signs the `idp_session` JWT
- `app/lib/api-client.ts` — server-side fetch wrapper to `packages/api` with `X-Internal-Secret`
- `app/lib/schemas.ts` — Zod schemas (`loginSchema`, `registerSchema`) shared between server actions and react-hook-form
- Forms use react-hook-form with `zodResolver` for client-side validation. Form submission uses `useSubmit(formRef.current, { method: 'post' })` (submits the actual DOM form element, not a plain object) so React Router's action receives proper `FormData`.

### App Package (`packages/app`)

- SPA mode (no SSR). Uses `createBrowserRouter` in `src/App.tsx`.
- `src/pkce.ts` — generates PKCE verifier/challenge using Web Crypto API (`window.crypto.subtle`)
- `src/oauth.ts` — all OAuth flow functions; PKCE state and access token stored in `sessionStorage`
- `VITE_IDP_URL`, `VITE_API_URL`, `VITE_CLIENT_ID`, `VITE_REDIRECT_URI` are the relevant env vars

### Validation

All API route inputs are validated with Zod via `schema.safeParse()`. On failure, routes return:
```json
{ "error": "invalid_request", "details": { "<field>": ["<message>"] } }
```
IDP form actions fall back to server-side errors displayed in the UI banner; client-side validation via `zodResolver` prevents most invalid submissions from reaching the server.
