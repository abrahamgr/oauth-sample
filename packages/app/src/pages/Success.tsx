import { Link } from 'react-router'
import { logout } from '../oauth'

export default function Success() {
  return (
    <div className="page-shell page-center">
      <div className="w-full max-w-md text-center">
        <div className="app-success mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
          <svg
            aria-hidden="true"
            className="h-9 w-9 text-[color:var(--success)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-[color:var(--text)]">
          You're logged in!
        </h1>
        <p className="app-muted mb-8">
          The OAuth 2.0 Authorization Code + PKCE flow completed successfully.
          Your access token is stored in{' '}
          <code className="app-code">sessionStorage</code>.
        </p>

        <div className="app-panel-strong mb-6 rounded-2xl p-6 text-left">
          <h3 className="mb-3 font-semibold text-[color:var(--text)]">
            What just happened?
          </h3>
          <ul className="app-muted space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="mt-0.5 text-[color:var(--success)]">✓</span>
              Auth server verified your PKCE code challenge
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-[color:var(--success)]">✓</span>
              Authorization code exchanged for a JWT access token
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-[color:var(--success)]">✓</span>
              Refresh token stored for later use
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Link
            to="/profile"
            className="app-button-primary flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold"
          >
            View Profile
          </Link>
          <button
            type="button"
            onClick={logout}
            className="app-button-secondary flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
