import type { LoaderFunctionArgs } from 'react-router'
import { useLoaderData } from 'react-router'

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const clientId = url.searchParams.get('client_id') ?? 'unknown'
  const scope = url.searchParams.get('scope') ?? 'openid profile email'
  const redirectTo = url.searchParams.get('redirect') ?? ''

  return { clientId, scope: scope.split(' '), redirectTo }
}

// ── Component ─────────────────────────────────────────────────────────────────

// The consent screen shows what scopes the app is requesting.
// For this demo all first-party clients are trusted so the API skips
// the consent step entirely. This page is here for reference.
export default function ConsentPage() {
  const { clientId, scope, redirectTo } = useLoaderData<typeof loader>()

  return (
    <div className="page-shell page-center">
      <div className="w-full max-w-md">
        <div className="app-panel-strong rounded-2xl p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-[color:var(--text)]">
              Authorize Access
            </h2>
            <p className="app-muted mt-1 text-sm">
              <strong>{clientId}</strong> is requesting permission to:
            </p>
          </div>

          <ul className="mb-6 space-y-2">
            {scope.map((s) => (
              <li
                key={s}
                className="flex items-center gap-2 text-sm text-[color:var(--text)]"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 flex-shrink-0 text-[color:var(--success)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {s}
              </li>
            ))}
          </ul>

          <div className="flex gap-3">
            <a
              href={redirectTo}
              className="app-button-primary flex flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              Allow
            </a>
            <a
              href="http://localhost:3000"
              className="app-button-secondary flex flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              Deny
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
