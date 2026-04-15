import { useState } from 'react'
import { Link } from 'react-router'
import { IDP_URL } from '../oauth'
import { useProfile } from '../profile-context'

const itemClass =
  'block px-3 py-2 rounded-lg text-sm font-medium text-[color:var(--text-muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--bg-accent)] transition-colors cursor-pointer'

function NavItems({ onAction }: { onAction?: () => void }) {
  const { loggedIn, logout } = useProfile()

  return (
    <>
      <Link to="/" className={itemClass} onClick={onAction}>
        Home
      </Link>
      {loggedIn && (
        <>
          <Link to="/profile" className={itemClass} onClick={onAction}>
            Profile
          </Link>
          <a
            href={`${IDP_URL}/forgot-password`}
            className={itemClass}
            onClick={onAction}
          >
            Reset Password
          </a>
          <button
            type="button"
            className={itemClass}
            onClick={() => {
              logout()
              onAction?.()
            }}
          >
            Logout
          </button>
        </>
      )}
    </>
  )
}

export default function NavMenu() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden sm:flex items-center gap-1">
        <NavItems />
      </nav>

      {/* Mobile hamburger */}
      <div className="relative sm:hidden">
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-[color:var(--text-muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--bg-accent)] transition-colors"
        >
          {open ? (
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-2 w-44 z-50 app-panel-strong rounded-xl shadow-lg overflow-hidden">
            <nav className="flex flex-col p-1">
              <NavItems onAction={() => setOpen(false)} />
            </nav>
          </div>
        )}
      </div>
    </>
  )
}
