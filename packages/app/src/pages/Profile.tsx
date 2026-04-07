import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { type UserInfo, fetchUserInfo, isLoggedIn, logout } from '../oauth'

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/')
      return
    }

    fetchUserInfo()
      .then(setUser)
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Failed to load profile'
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [navigate])

  if (loading) {
    return (
      <div className="page-shell page-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[color:var(--border)] border-t-indigo-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-shell page-center">
        <div className="app-panel-strong w-full max-w-md rounded-2xl p-8 text-center">
          <div className="app-danger mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
            <svg
              aria-hidden="true"
              className="h-7 w-7"
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
          </div>
          <p className="mb-4 text-[color:var(--danger)]">{error}</p>
          <Link to="/" className="app-link text-sm font-medium">
            Go home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell page-center">
      <div className="w-full max-w-md">
        <div className="app-panel-strong overflow-hidden rounded-2xl">
          <div className="app-profile-hero px-8 py-10 text-center">
            <div className="app-profile-avatar mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
              <span className="text-3xl font-bold text-white">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
            <p className="mt-1 text-sm text-indigo-100/80">{user?.email}</p>
          </div>

          <div className="p-8">
            <h2 className="app-kicker mb-4 text-sm font-semibold uppercase tracking-[0.2em]">
              /userinfo claims
            </h2>
            <dl className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <dt className="app-muted flex-shrink-0 text-sm font-medium">
                  sub
                </dt>
                <dd className="break-all text-right font-mono text-sm text-[color:var(--text)]">
                  {user?.sub}
                </dd>
              </div>
              <div className="flex justify-between items-start gap-4">
                <dt className="app-muted flex-shrink-0 text-sm font-medium">
                  email
                </dt>
                <dd className="text-right text-sm text-[color:var(--text)]">
                  {user?.email}
                </dd>
              </div>
              <div className="flex justify-between items-start gap-4">
                <dt className="app-muted flex-shrink-0 text-sm font-medium">
                  name
                </dt>
                <dd className="text-right text-sm text-[color:var(--text)]">
                  {user?.name}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex gap-3 px-8 pb-8">
            <Link
              to="/"
              className="app-button-secondary flex flex-1 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={logout}
              className="app-button-primary flex flex-1 cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
