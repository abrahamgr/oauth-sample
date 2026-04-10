import { AppHeader, AppShell, useTheme } from '@oauth-sample/ui'
import { Outlet } from 'react-router'

function IdpBrand() {
  const { mode } = useTheme()

  return (
    <div className="flex items-center gap-3">
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
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-[color:var(--text)]">
          Identity Provider
        </p>
        <p className="app-muted text-sm">
          Theme follows {mode === 'system' ? 'your system' : mode}
        </p>
      </div>
    </div>
  )
}

export default function IdpLayout() {
  return (
    <AppShell>
      <AppHeader brand={<IdpBrand />} />
      <main className="app-main">
        <Outlet />
      </main>
    </AppShell>
  )
}
