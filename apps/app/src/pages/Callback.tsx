import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { exchangeCode } from '../oauth'

export default function Callback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const errorParam = params.get('error')

    if (errorParam) {
      setError(`Authorization denied: ${errorParam}`)
      return
    }

    if (!code || !state) {
      setError('Missing code or state in callback URL')
      return
    }

    exchangeCode(code, state)
      .then(() => navigate('/success', { replace: true }))
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Token exchange failed'
        setError(message)
      })
  }, [navigate])

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
          <h2 className="mb-2 text-xl font-semibold text-[color:var(--text)]">
            Authentication failed
          </h2>
          <p className="mb-6 text-sm text-[color:var(--danger)]">{error}</p>
          <a href="/" className="app-link text-sm font-medium">
            Try again
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell page-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[color:var(--border)] border-t-indigo-400" />
        <p className="app-muted">Exchanging authorization code…</p>
      </div>
    </div>
  )
}
