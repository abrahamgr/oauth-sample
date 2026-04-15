import { Link } from 'react-router'

export default function NotFound() {
  return (
    <div className="page-shell page-center">
      <div className="app-panel-strong w-full max-w-md rounded-2xl p-8 text-center">
        <p className="app-kicker mb-3 text-sm font-semibold uppercase tracking-[0.2em]">
          404
        </p>
        <h1 className="mb-2 text-2xl font-semibold text-[color:var(--text)]">
          Page not found
        </h1>
        <p className="app-muted mb-6 text-sm">
          The route does not exist in the OAuth sample app.
        </p>
        <Link to="/" className="app-link text-sm font-medium">
          Return home
        </Link>
      </div>
    </div>
  )
}
