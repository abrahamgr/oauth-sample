import type { LoaderFunctionArgs } from 'react-router'
import { Link, useLoaderData } from 'react-router'
import { RouteErrorCard } from '../components/RouteErrorCard'
import { sanitizeRedirectTarget } from '../lib/redirects'
import { clearSessionCookie, getLastRp } from '../sessions.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const rawLastRp = getLastRp(request)
  const lastRpUrl = rawLastRp
    ? sanitizeRedirectTarget(request, rawLastRp, '')
    : ''

  return Response.json(
    { lastRpUrl },
    {
      headers: {
        'Set-Cookie': clearSessionCookie(),
      },
    },
  )
}

export default function LogoutPage() {
  const { lastRpUrl } = useLoaderData<typeof loader>()
  const loginHref = lastRpUrl
    ? `/login?redirect=${encodeURIComponent(lastRpUrl)}`
    : '/login'

  return (
    <div className="page-shell page-center">
      <div className="w-full max-w-md">
        <div className="app-panel-strong rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-(--text)">
            You've been signed out
          </h1>
          <p className="app-muted mt-2 text-sm">
            Your session has ended. Sign back in to pick up where you left off.
          </p>

          <Link
            to={loginHref}
            className="app-button-primary mt-6 flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            Sign in again
          </Link>
        </div>
      </div>
    </div>
  )
}

export function meta() {
  return [{ title: 'Signed out | OAuth Sample IDP' }]
}

export function ErrorBoundary() {
  return (
    <RouteErrorCard
      heading="Unable to sign out"
      fallbackMessage="The sign-out page could not be loaded."
    />
  )
}
