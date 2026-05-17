import { AppHeader, AppShell, ThemeToggle, UserMenu } from '@oauth-sample/ui'
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
      <AppHeader
        icon={<IdpIcon />}
        title="Identity Provider"
        nav={user ? [{ label: 'Profile', to: '/profile' }] : []}
      >
        <ThemeToggle />
        {user ? (
          <UserMenu
            name={user.name}
            avatarUrl={user.avatar_url}
            subtitle={user.email}
          >
            <UserMenu.Item asChild className="sm:hidden">
              <Link to="/profile">Profile</Link>
            </UserMenu.Item>
            <UserMenu.Item asChild>
              <Link to="/forgot-password">Reset password</Link>
            </UserMenu.Item>
            <UserMenu.Item asChild>
              <a href="/logout">Log out</a>
            </UserMenu.Item>
          </UserMenu>
        ) : null}
      </AppHeader>
      <main className="app-main">
        <Outlet />
      </main>
    </AppShell>
  )
}

export async function loader({ request }: LoaderFunctionArgs) {
  const pathname = new URL(request.url).pathname
  if (pathname.endsWith('/logout')) {
    return { user: null as UserResult | null }
  }

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
