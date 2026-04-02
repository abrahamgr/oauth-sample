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
    <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Authorize Access
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          <strong>{clientId}</strong> is requesting permission to:
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <ul className="mb-6 space-y-2">
            {scope.map((s) => (
              <li
                key={s}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 text-green-500 flex-shrink-0"
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
              className="flex-1 flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Allow
            </a>
            <a
              href="http://localhost:3000"
              className="flex-1 flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Deny
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
