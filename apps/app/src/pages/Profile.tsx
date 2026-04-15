import { UserAvatar } from '@oauth-sample/ui'
import { Link } from 'react-router'
import { useProfile } from '../profile-context'

export default function Profile() {
  const { user, loading, error } = useProfile()

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

  if (!user) {
    return (
      <div className="page-shell page-center">
        <div className="app-panel-strong w-full max-w-md rounded-2xl p-8 text-center">
          <p className="mb-4 text-sm text-[color:var(--text-muted)]">
            Profile data is not available right now.
          </p>
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
            <UserAvatar
              name={user?.name ?? 'User'}
              avatarUrl={user?.avatar_url}
              className="app-profile-avatar mx-auto mb-4 h-20 w-20"
            />
            <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
            <p className="mt-1 text-sm text-indigo-100/80">{user?.email}</p>
          </div>

          <div className="p-8">
            <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <div>
                <h2 className="text-base font-semibold text-[color:var(--text)]">
                  Manage your account
                </h2>
                <p className="app-muted mt-1 text-sm">
                  Edit your name and avatar in the Identity Provider.
                </p>
              </div>
              <a
                href="/idp/profile"
                className="app-link text-sm font-semibold whitespace-nowrap"
              >
                Edit in IDP
              </a>
            </div>

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
              <div className="flex justify-between items-start gap-4">
                <dt className="app-muted flex-shrink-0 text-sm font-medium">
                  avatar_url
                </dt>
                <dd className="break-all text-right text-sm text-[color:var(--text)]">
                  {user?.avatar_url ?? 'null'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
