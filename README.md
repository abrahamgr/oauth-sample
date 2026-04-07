# OAuth 2.0 Demo

A hands-on implementation of the **Authorization Code + PKCE** flow built from scratch to learn how OAuth 2.0 works under the hood. Three separate services simulate the real-world roles of an OAuth client, an authorization server, and an identity provider.

## Services

| Service | Port | Description |
|---|---|---|
| **app** | 3000 | Vite + React SPA — the OAuth client (relying party) |
| **api** | 3001 | Fastify — OAuth Authorization Server (token issuance) |
| **idp** | 3002 | React Router v7 SSR — Identity Provider (login/register UI) |
| **ui** | — | Shared component library (components, theme, CSS) |

## Stack

- **Runtime**: Bun
- **API**: Fastify, SQLite via Drizzle ORM
- **IDP**: React Router v7 (SSR framework mode), react-hook-form + Zod
- **App**: Vite, React Router v7 (SPA mode)
- **UI**: Shared component library (`@ui`) — AppHeader, AppShell, form components, theme system
- **Styling**: Tailwind CSS v4
- **Email**: Nodemailer + Mailpit (Docker — SMTP testing UI at localhost:8025)
- **Linting/Formatting**: BiomeJS

## Getting Started

```bash
bun install
docker compose up -d  # start Mailpit (needed for password reset emails)
bun run dev
```

Then open [http://localhost:3000](http://localhost:3000). Password reset emails can be inspected at [http://localhost:8025](http://localhost:8025) (Mailpit UI).

## The Flow

```
┌─────────────────────────────────────────────────────────┐
│                      packages/app                        │
│                   http://localhost:3000                  │
└────────────────────────┬────────────────────────────────┘
                         │ 1. Click "Login with OAuth"
                         │    generate PKCE verifier + challenge
                         │    store verifier in sessionStorage
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      packages/api                        │
│         GET /authorize?code_challenge=...               │
│                   http://localhost:3001                  │
└────────────────────────┬────────────────────────────────┘
                         │ 2. No session cookie → redirect to IDP
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      packages/idp                        │
│                  GET /login?redirect=...                 │
│                   http://localhost:3002                  │
└────────────────────────┬────────────────────────────────┘
                         │ 3. User submits credentials
                         │    API verifies via /internal/verify
                         │    IDP sets idp_session cookie
                         │    Redirect back to /authorize
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      packages/api                        │
│         GET /authorize (session cookie present)         │
└────────────────────────┬────────────────────────────────┘
                         │ 4. Issue auth code
                         │    Redirect to app /callback?code=...
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      packages/app                        │
│                     GET /callback                        │
└────────────────────────┬────────────────────────────────┘
                         │ 5. Exchange code + verifier
                         │    POST /token → JWT access token
                         │    Store token in sessionStorage
                         ▼
                   Logged in ✓
              Access /profile → GET /userinfo
```

### PKCE

The app generates a random `code_verifier`, computes `code_challenge = base64url(SHA-256(verifier))` using the Web Crypto API, and sends the challenge to the authorization server. When exchanging the code for a token, the server verifies `SHA-256(verifier) === stored_challenge` — proving the token request came from the same client that initiated the login.

### Session Cookie

After the user logs in on the IDP, it sets an `idp_session` cookie containing a short-lived (10 min) signed JWT. The API verifies this cookie on the `/authorize` endpoint using a shared `SESSION_SECRET`. Because cookies are scoped to the `localhost` hostname (not port), the browser sends the cookie to both :3001 and :3002.

## Project Structure

```
packages/
├── api/
│   ├── drizzle/               # tracked migration SQL files
│   └── src/
│       ├── config.ts          # env vars (incl. SMTP), registered OAuth clients
│       ├── schemas.ts         # Zod validation schemas for all routes
│       ├── crypto.ts          # PKCE verification (Bun.CryptoHasher)
│       ├── email.ts           # Nodemailer transport + sendPasswordResetEmail()
│       ├── db/
│       │   ├── schema.ts      # Drizzle table definitions (incl. passwordResetTokens)
│       │   └── index.ts       # query helpers (createUser, findCode, …)
│       ├── emails/
│       │   └── password-reset.ts  # HTML email template
│       └── routes/
│           ├── authorize.ts       # GET /authorize
│           ├── token.ts           # POST /token
│           ├── userinfo.ts        # GET /userinfo
│           ├── register.ts        # POST /register (internal)
│           ├── internal.ts        # POST /internal/verify (internal)
│           └── password-reset.ts  # POST /password-reset/request + /confirm
├── idp/
│   └── app/
│       ├── sessions.server.ts # sign/build idp_session cookie
│       ├── lib/
│       │   ├── api-client.ts  # server-to-server calls to packages/api
│       │   └── schemas.ts     # Zod schemas for login/register/password-reset forms
│       └── routes/
│           ├── login.tsx
│           ├── register.tsx
│           ├── forgot-password.tsx  # email submission form
│           ├── reset-password.tsx   # new password form (token from query param)
│           └── logout.ts      # clears idp_session cookie
├── app/
│   └── src/
│       ├── pkce.ts            # generateVerifier / generateChallenge
│       ├── oauth.ts           # startLogin, exchangeCode, fetchUserInfo, logout
│       └── pages/
│           ├── Home.tsx
│           ├── Callback.tsx
│           ├── Success.tsx
│           └── Profile.tsx
└── ui/
    └── src/
        ├── index.ts           # package entry — exports all components + theme
        ├── index.css          # CSS custom properties, base & component styles
        ├── theme.tsx          # ThemeProvider + useTheme (light / dark / system)
        ├── components/        # AppHeader, Button, Input, Label, FormField
        └── layout/
            └── AppShell.tsx   # root layout wrapper
```

## Environment Variables

All variables have working defaults for local development — no `.env` file is required to get started.

**`packages/api`**
| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | API server port |
| `JWT_SECRET` | *(insecure default)* | Signs access tokens |
| `SESSION_SECRET` | *(insecure default)* | Verifies idp_session cookies — must match IDP |
| `INTERNAL_SECRET` | `internal-api-secret` | Guards `/register` and `/internal/*` |
| `IDP_URL` | `http://localhost:3002` | Where to redirect unauthenticated users |
| `APP_URL` | `http://localhost:3000` | Allowed CORS origin |
| `SMTP_HOST` | `localhost` | Mailpit SMTP host |
| `SMTP_PORT` | `1025` | Mailpit SMTP port |
| `SMTP_FROM` | `noreply@oauth-sample.local` | From address for password reset emails |

**`packages/idp`**
| Variable | Default | Description |
|---|---|---|
| `SESSION_SECRET` | *(insecure default)* | Signs idp_session cookies — must match API |
| `INTERNAL_SECRET` | `internal-api-secret` | Sent as `X-Internal-Secret` to the API |
| `API_URL` | `http://localhost:3001` | API base URL |

**`packages/app`**
| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001` | API base URL |
| `VITE_IDP_URL` | `http://localhost:3002` | IDP base URL (used for logout redirect) |
| `VITE_CLIENT_ID` | `oauth-sample-app` | Registered client ID |
| `VITE_REDIRECT_URI` | `http://localhost:3000/callback` | OAuth callback URL |
