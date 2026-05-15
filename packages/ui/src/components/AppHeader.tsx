interface NavItem {
  label: string
  to: string
  external?: boolean
}

interface AppHeaderProps {
  icon?: React.ReactNode
  title: string
  brandHref?: string
  nav?: NavItem[]
  children?: React.ReactNode
}

function DefaultIcon() {
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

export function AppHeader({
  icon,
  title,
  brandHref = '/',
  nav,
  children,
}: AppHeaderProps) {
  return (
    <header className="app-header px-4 py-3 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4">
        <a
          href={brandHref}
          className="app-brand-link flex items-center gap-3 min-w-0"
        >
          <div className="app-brand-mark flex h-10 w-10 items-center justify-center rounded-2xl shrink-0">
            {icon ?? <DefaultIcon />}
          </div>
          <span className="text-sm font-semibold text-(--text) truncate">
            {title}
          </span>
        </a>

        {nav && nav.length > 0 ? (
          <nav
            aria-label="Primary"
            className="hidden sm:flex items-center gap-1 ml-2"
          >
            {nav.map((item) => (
              <a
                key={`${item.label}:${item.to}`}
                href={item.to}
                className="app-nav-link"
                {...(item.external
                  ? { target: '_blank', rel: 'noreferrer noopener' }
                  : {})}
              >
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}

        <div className="ml-auto flex items-center gap-2">{children}</div>
      </div>
    </header>
  )
}
