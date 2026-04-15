import { AppHeader, AppShell, UserIdentity } from '@oauth-sample/ui'
import type { LoaderFunctionArgs } from 'react-router'
import { Link, Outlet, useLoaderData } from 'react-router'
import { getUserProfile, type UserResult } from '../lib/api-client'
import { verifySession } from '../sessions.server'

function IdpIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      />
    </svg>
  )
}

export default function IdpLayout() {
  const { user } = useLoaderData<typeof loader>()

  return (
    <AppShell>
      <AppHeader icon={<IdpIcon />} title="Identity Provider">
        {user ? (
          <Link to="/profile" className="ui-profile-chip">
            <UserIdentity
              name={user.name}
              avatarUrl={user.avatar_url}
              subtitle="Profile settings"
            />
          </Link>
        ) : null}
      </AppHeader>
      <main className="app-main">
        <Outlet />
      </main>
    </AppShell>
  )
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await verifySession(request)
  if (!userId) {
    return { user: null as UserResult | null }
  }

  try {
    const user = await getUserProfile(userId)
    return { user }
  } catch {
    return { user: null as UserResult | null }
  }
}
