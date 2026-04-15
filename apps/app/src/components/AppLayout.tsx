import { AppHeader, AppShell, UserIdentity } from '@oauth-sample/ui'
import { Outlet } from 'react-router'
import { useProfile } from '../profile-context'
import NavMenu from './NavMenu'

function AppIcon() {
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
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  )
}

export default function AppLayout() {
  const { user } = useProfile()

  return (
    <AppShell>
      <AppHeader icon={<AppIcon />} title="OAuth Sample">
        {user ? (
          <a href="/idp/profile" className="ui-profile-chip">
            <UserIdentity
              name={user.name}
              avatarUrl={user.avatar_url}
              subtitle="Edit in IDP"
            />
          </a>
        ) : null}
        <NavMenu />
      </AppHeader>
      <main className="app-main">
        <Outlet />
      </main>
    </AppShell>
  )
}
