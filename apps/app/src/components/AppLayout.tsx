import { AppHeader, AppShell, ThemeToggle, UserMenu } from '@oauth-sample/ui'
import { Link, Outlet } from 'react-router'
import { IDP_URL } from '../oauth'
import { useProfile } from '../profile-context'

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
  const { user, logout } = useProfile()

  return (
    <AppShell>
      <AppHeader
        icon={<AppIcon />}
        title="OAuth Sample"
        nav={[{ label: 'Home', to: '/' }]}
      >
        <ThemeToggle />
        {user ? (
          <UserMenu
            name={user.name}
            avatarUrl={user.avatar_url}
            subtitle={user.email}
          >
            <UserMenu.Item asChild className="sm:hidden">
              <Link to="/">Home</Link>
            </UserMenu.Item>
            <UserMenu.Item asChild>
              <Link to="/profile">Profile</Link>
            </UserMenu.Item>
            <UserMenu.Item asChild>
              <a href={`${IDP_URL}/forgot-password`}>Reset password</a>
            </UserMenu.Item>
            <UserMenu.Item onSelect={logout}>Log out</UserMenu.Item>
          </UserMenu>
        ) : null}
      </AppHeader>
      <main className="app-main">
        <Outlet />
      </main>
    </AppShell>
  )
}
