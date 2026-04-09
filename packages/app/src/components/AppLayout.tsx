import { AppHeader, AppShell, useTheme } from '@ui'
import { Link, Outlet } from 'react-router'
import NavMenu from './NavMenu'

function AppBrand() {
  const { mode } = useTheme()

  return (
    <Link to="/" className="flex items-center gap-3">
      <div className="app-brand-mark flex h-11 w-11 items-center justify-center rounded-2xl">
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
      </div>
      <div>
        <p className="text-sm font-semibold text-[color:var(--text)]">
          OAuth Sample App
        </p>
        <p className="app-muted text-sm">
          Theme follows {mode === 'system' ? 'your system' : mode}
        </p>
      </div>
    </Link>
  )
}

export default function AppLayout() {
  return (
    <AppShell>
      <AppHeader brand={<AppBrand />}>
        <NavMenu />
      </AppHeader>
      <main className="app-main">
        <Outlet />
      </main>
    </AppShell>
  )
}
