import { Link, Outlet } from 'react-router'
import { type ThemeMode, useTheme } from '../theme'

const themeOptions: Array<{ label: string; value: ThemeMode }> = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

export default function AppLayout() {
  const { mode, setMode } = useTheme()

  return (
    <div className="app-shell">
      <header className="app-header px-4 py-4 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

          <div className="app-theme-toggle self-start sm:self-auto">
            <div className="app-toggle-track inline-flex rounded-2xl p-1">
              {themeOptions.map((option) => {
                const isActive = mode === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={isActive}
                    className={`app-toggle-option rounded-xl px-3 py-2 text-sm font-medium ${
                      isActive ? 'app-toggle-option-active' : ''
                    }`}
                    onClick={() => setMode(option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
