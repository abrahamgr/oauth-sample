# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
# Start all three services in parallel
pnpm run dev

# Lint (read-only)
pnpm run lint

# Lint + auto-fix
pnpm run check

# Format only
pnpm run format

# Run a single package
pnpm --filter api run dev
pnpm --filter idp run dev
pnpm --filter app run dev

# Push Drizzle schema to Postgres (api package only, no migration history)
cd packages/api && pnpm run db:push

# Run tracked Drizzle migrations (api package only)
cd packages/api && pnpm run db:migrate

# Start Mailpit SMTP server (required for password reset emails)
docker compose up -d
```

No test suite exists yet. There are no test commands.

## Code Style

BiomeJS enforces: single quotes, double quotes in JSX attributes, no semicolons, trailing commas, 2-space indent. Running `pnpm run check` auto-fixes formatting. Do not add `.js` extensions to relative imports — all packages use `moduleResolution: bundler`.

Consumer packages (`app`, `idp`) must include a `@source` directive in their CSS entry point so Tailwind v4 scans `@ui` component files for utility classes (`@source "../../ui/src"` from `app/src/`, `@source "../../ui/src"` from `idp/app/`). Do not use `@apply` inside `packages/ui/src/index.css` — it is imported as a plain CSS file and Tailwind does not process `@apply` in non-entry stylesheets.

## Architecture

Three packages in a pnpm workspace, each running on a fixed port:

| Package | Port | Role |
|---|---|---|
| `packages/api` | 3001 | Fastify OAuth Authorization Server |
| `packages/idp` | 3002 | React Router v7 SSR Identity Provider (login/register UI) |
| `packages/app` | 3000 | Vite + React SPA (OAuth client) |
| `packages/ui` | — | Shared component library (components, theme, CSS) |

### OAuth 2.0 PKCE Flow

```
app (3000) → api/authorize (3001) → idp/login (3002) → api/authorize → app/callback → api/token → app/success
```

1. `app/src/oauth.ts:startLogin()` — generates PKCE verifier/challenge, stores in `sessionStorage`, redirects to `api:3001/authorize`
2. `api/routes/authorize.ts` — if no `__session` cookie, redirects to `idp:3002/login?redirect=<authorize_url>`
3. `idp/routes/login.tsx` — user submits credentials → `lib/api-client.ts` calls `api:3001/internal/verify` → sets `__session` cookie → redirects back to `api:3001/authorize`
4. `api/routes/authorize.ts` — verifies `__session` JWT, issues auth code, redirects to `app:3000/callback`
5. `app/src/pages/Callback.tsx` — exchanges code + verifier via `api:3001/token` (PKCE verified), stores access token in `sessionStorage`
6. `app/src/pages/Profile.tsx` — calls `api:3001/userinfo` with Bearer token

### Session Cookie

The `__session` cookie is a short-lived (10 min) HS256 JWT signed with `SESSION_SECRET`. This secret is **shared between api and idp** — the API verifies the cookie the IDP sets. Cookies scope to `localhost` hostname (not port), so the browser sends them to both :3001 and :3002.

Logout: `app/src/oauth.ts:logout()` clears `sessionStorage` then redirects to `idp:3002/logout`, which sets `Max-Age=0` on the `__session` cookie before redirecting back to the app.

### API Package (`packages/api`)

- `src/config.ts` — env vars + static OAuth client registry (`registeredClients`)
- `src/config.ts` — env vars (including SMTP config) + static OAuth client registry
- `src/db/schema.ts` — Drizzle table definitions (`users`, `oauthCodes`, `oauthTokens`, `passwordResetTokens`)
- `src/db/index.ts` — Drizzle client (postgres.js) + all query helper functions
- `src/schemas.ts` — Zod schemas for all route inputs; import from here for validation
- `src/crypto.ts` — `verifyPKCE(verifier, challenge)`
- `src/email.ts` — Nodemailer transport + `sendPasswordResetEmail(to, token)`
- `src/emails/password-reset.ts` — HTML email template for password reset
- `src/routes/password-reset.ts` — `POST /password-reset/request` (sends email) and `POST /password-reset/confirm` (validates token, updates password)
- `drizzle/` — tracked migration SQL files; apply with `db:migrate`
- Routes are protected by `X-Internal-Secret` header for `/register` and `/internal/*`

### IDP Package (`packages/idp`)

- Framework mode React Router v7 (SSR). Routes are defined in `app/routes.ts`.
- `app/sessions.server.ts` — `signSession(userId)` / `buildSessionCookie(token)` — signs the `__session` JWT
- `app/lib/api-client.ts` — server-side fetch wrapper to `packages/api` with `X-Internal-Secret`
- `app/lib/schemas.ts` — Zod schemas (`loginSchema`, `registerSchema`, `forgotPasswordSchema`, `resetPasswordSchema`) shared between server actions and react-hook-form
- `app/routes/forgot-password.tsx` — email submission form; calls `POST /password-reset/request`
- `app/routes/reset-password.tsx` — new password form; calls `POST /password-reset/confirm` with token from URL query param
- Forms use react-hook-form with `zodResolver` for client-side validation. Form submission uses `useSubmit(formRef.current, { method: 'post' })` (submits the actual DOM form element, not a plain object) so React Router's action receives proper `FormData`.

### App Package (`packages/app`)

- SPA mode (no SSR). Uses `createBrowserRouter` in `src/App.tsx`.
- `src/pkce.ts` — generates PKCE verifier/challenge using Web Crypto API (`window.crypto.subtle`)
- `src/oauth.ts` — all OAuth flow functions; PKCE state and access token stored in `sessionStorage`

### UI Package (`packages/ui`)

- `src/index.ts` — exports all components, `ThemeProvider`, `useTheme`
- `src/theme.tsx` — `ThemeProvider` + `useTheme` hook; persists mode to `localStorage`; sets `data-theme` on `<html>`
- `src/index.css` — all shared CSS custom properties, `@layer base`, and `@layer components` styles; no `@apply`
- `src/components/` — `AppHeader`, `Button`, `Input`, `Label`, `FormField`
- `src/layout/AppShell.tsx` — root shell wrapper

### Validation

All API route inputs are validated with Zod via `schema.safeParse()`. On failure, routes return:
```json
{ "error": "invalid_request", "details": { "<field>": ["<message>"] } }
```
IDP form actions fall back to server-side errors displayed in the UI banner; client-side validation via `zodResolver` prevents most invalid submissions from reaching the server.
