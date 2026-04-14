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

- **Runtime**: Node.js
- **API**: Fastify, PostgreSQL via Drizzle ORM
- **IDP**: React Router v7 (SSR framework mode), react-hook-form + Zod
- **App**: Vite, React Router v7 (SPA mode)
- **UI**: Shared component library (`@ui`) — AppHeader, AppShell, form components, theme system
- **Styling**: Tailwind CSS v4
- **Email**: Nodemailer + Mailpit (Docker — SMTP testing UI at localhost:8025)
- **Linting/Formatting**: BiomeJS

## Getting Started

```bash
pnpm install
docker compose up -d  # start Mailpit (needed for password reset emails)
pnpm run dev
```

Then open [http://localhost:3000](http://localhost:3000). Password reset emails can be inspected at [http://localhost:8025](http://localhost:8025) (Mailpit UI).

## The Flow

```
┌─────────────────────────────────────────────────────────┐
│                      apps/app                        │
│                   http://localhost:3000                  │
└────────────────────────┬────────────────────────────────┘
                         │ 1. Click "Login with OAuth"
                         │    generate PKCE verifier + challenge
                         │    store verifier in sessionStorage
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      apps/api                        │
│         GET /authorize?code_challenge=...               │
│                   http://localhost:3001                  │
└────────────────────────┬────────────────────────────────┘
                         │ 2. No session cookie → redirect to IDP
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      apps/idp                        │
│                  GET /login?redirect=...                 │
│                   http://localhost:3002                  │
└────────────────────────┬────────────────────────────────┘
                         │ 3. User submits credentials
                         │    API verifies via /internal/verify
                         │    IDP sets __session cookie
                         │    Redirect back to /authorize
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      apps/api                        │
│         GET /authorize (session cookie present)         │
└────────────────────────┬────────────────────────────────┘
                         │ 4. Issue auth code
                         │    Redirect to app /callback?code=...
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      apps/app                        │
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

After the user logs in on the IDP, it sets an `__session` cookie containing a short-lived (10 min) signed JWT. The API verifies this cookie on the `/authorize` endpoint using a shared `SESSION_SECRET`. Because cookies are scoped to the `localhost` hostname (not port), the browser sends the cookie to both :3001 and :3002.

## Project Structure

```
apps/
├── api/
│   ├── drizzle/               # tracked migration SQL files
│   └── src/
│       ├── config.ts          # env vars (incl. SMTP), registered OAuth clients
│       ├── schemas.ts         # Zod validation schemas for all routes
│       ├── crypto.ts          # PKCE verification
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
│       ├── sessions.server.ts # sign/build __session cookie
│       ├── lib/
│       │   ├── api-client.ts  # server-to-server calls to apps/api
│       │   └── schemas.ts     # Zod schemas for login/register/password-reset forms
│       └── routes/
│           ├── login.tsx
│           ├── register.tsx
│           ├── forgot-password.tsx  # email submission form
│           ├── reset-password.tsx   # new password form (token from query param)
│           └── logout.ts      # clears __session cookie
└── app/
    └── src/
        ├── pkce.ts            # generateVerifier / generateChallenge
        ├── oauth.ts           # startLogin, exchangeCode, fetchUserInfo, logout
        └── pages/
            ├── Home.tsx
            ├── Callback.tsx
            ├── Success.tsx
            └── Profile.tsx

packages/
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

**`apps/api`**
| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | API server port |
| `JWT_SECRET` | *(insecure default)* | Signs access tokens |
| `SESSION_SECRET` | *(insecure default)* | Verifies __session cookies — must match IDP |
| `INTERNAL_SECRET` | `internal-api-secret` | Guards `/register` and `/internal/*` |
| `IDP_URL` | `http://localhost:3000/idp` | Where to redirect unauthenticated users |
| `APP_URL` | `http://localhost:3000` | Allowed CORS origin |
| `SMTP_HOST` | `localhost` | Mailpit SMTP host |
| `SMTP_PORT` | `1025` | Mailpit SMTP port |
| `SMTP_FROM` | `noreply@oauth-sample.local` | From address for password reset emails |

**`apps/idp`**
| Variable | Default | Description |
|---|---|---|
| `SESSION_SECRET` | *(insecure default)* | Signs __session cookies — must match API |
| `INTERNAL_SECRET` | `internal-api-secret` | Sent as `X-Internal-Secret` to the API |
| `API_URL` | `http://localhost:3000/api` | API base URL |

**`apps/app`**
| Variable | Default | Description |
|---|---|---|
| `VITE_IDP_URL` | `http://localhost:3000/idp` | IDP base URL (used for logout redirect) |
| `VITE_CLIENT_ID` | `oauth-sample-app` | Registered client ID |

## Deployment

Deployments are triggered manually from GitHub Actions (Actions → Deploy to Firebase → Run workflow). You can deploy all services or a subset via the `services` input (e.g. `db,api` to only migrate and redeploy the API).

| Service | Target |
|---|---|
| `app` | Firebase Hosting (static SPA) |
| `idp` | Firebase App Hosting (SSR) |
| `api` | Firebase App Hosting (Node.js, via Dockerfile) |
| DB | Neon — Drizzle migrations run in CI |

### One-Time Firebase Setup

1. **Install Firebase CLI and login**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Set your Firebase project** (run from repo root)
   ```bash
   # Replace YOUR_PROJECT_ID in .firebaserc, then:
   firebase use default
   ```

3. **Create App Hosting backends** (once per environment)
   ```bash
   # IDP backend — React Router v7 SSR
   firebase apphosting:backends:create --project YOUR_PROJECT_ID
   # When prompted: name it "idp", root directory → apps/idp

   # API backend — Fastify (Node.js, Dockerfile)
   firebase apphosting:backends:create --project YOUR_PROJECT_ID
   # When prompted: name it "api", root directory → apps/api
   ```

4. **Note the backend IDs**
   ```bash
   firebase apphosting:backends:list --project YOUR_PROJECT_ID
   ```

5. **Store secrets in Firebase Secret Manager** (for App Hosting env vars)
   ```bash
   firebase apphosting:secrets:set DATABASE_URL
   firebase apphosting:secrets:set JWT_SECRET
   firebase apphosting:secrets:set SESSION_SECRET
   firebase apphosting:secrets:set INTERNAL_SECRET
   firebase apphosting:secrets:set IDP_URL
   firebase apphosting:secrets:set APP_URL
   firebase apphosting:secrets:set API_URL
   ```

6. **Set up Workload Identity Federation** (keyless — no JSON credentials stored)
   ```bash
   PROJECT_ID=oauth-sample-7fe4b
   PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
   REPO=abrahamgr/oauth-sample   # e.g. abraham/oauth-sample

   # Create the WIF pool
   gcloud iam workload-identity-pools create "github-pool" \
     --project=$PROJECT_ID \
     --location="global" \
     --display-name="GitHub Actions Pool"

   # Create the OIDC provider (scoped to your repo)
   gcloud iam workload-identity-pools providers create-oidc "github-provider" \
     --project=$PROJECT_ID \
     --location="global" \
     --workload-identity-pool="github-pool" \
     --display-name="GitHub Provider" \
     --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor" \
     --issuer-uri="https://token.actions.githubusercontent.com" \
     --attribute-condition="assertion.repository=='$REPO'"

   # Create the service account (no key file generated)
   gcloud iam service-accounts create github-actions-deploy \
     --display-name="GitHub Actions Deploy" \
     --project=$PROJECT_ID

   # Allow the WIF provider to impersonate the service account
   gcloud iam service-accounts add-iam-policy-binding \
     github-actions-deploy@$PROJECT_ID.iam.gserviceaccount.com \
     --project=$PROJECT_ID \
     --role="roles/iam.workloadIdentityUser" \
     --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/$REPO"

   # Grant deploy roles
    gcloud projects add-iam-policy-binding $PROJECT_ID \
      --member="serviceAccount:github-actions-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
      --role=roles/firebase.editor

    gcloud projects add-iam-policy-binding $PROJECT_ID \
      --member="serviceAccount:github-actions-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
      --role=roles/iam.serviceAccountTokenCreator

   # Print the WIF provider resource name — copy this as your WIF_PROVIDER secret
   echo "projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
   ```

7. **Add GitHub Secrets** (Settings → Secrets and variables → Actions)

   | Secret | Value |
   |---|---|
   | `WIF_PROVIDER` | Output of the last `echo` above |
   | `SERVICE_ACCOUNT_EMAIL` | `github-actions-deploy@oauth-sample-7fe4b.iam.gserviceaccount.com` |
   | `FIREBASE_PROJECT_ID` | Your Firebase project ID |
   | `FIREBASE_IDP_BACKEND_ID` | Backend ID from step 4 (idp) |
   | `FIREBASE_API_BACKEND_ID` | Backend ID from step 4 (api) |
   | `DATABASE_URL` | Neon connection string (for Drizzle migrations) |
   | `VITE_CLIENT_ID` | OAuth client ID |

   > Per-service secrets (`JWT_SECRET`, `SESSION_SECRET`, etc.) live in Firebase Secret Manager — no need to duplicate them in GitHub secrets.

8. ** Make API public **

```bash
# Replace PROJECT_ID and REGION with your values
gcloud run services add-iam-policy-binding api \
  --project=$PROJECT_ID \
  --region=us-east4 \
  --member="allUsers" \
  --role="roles/run.invoker"

gcloud run services add-iam-policy-binding idp \
  --project=$PROJECT_ID \
  --region=us-east4 \
  --member="allUsers" \
  --role="roles/run.invoker"
```
