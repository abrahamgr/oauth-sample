import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { exchangeCode } from '../oauth'

export default function Callback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (errorParam) {
      setError(
        errorDescription
          ? `Authorization denied: ${errorDescription}`
          : `Authorization denied: ${errorParam}`,
      )
      return undefined
    }

    if (!code || !state) {
      setError('Missing code or state in callback URL')
      return undefined
    }

    exchangeCode(code, state)
      .then(() => {
        if (active) {
          navigate('/success', { replace: true })
        }
      })
      .catch((err: unknown) => {
        if (!active) {
          return
        }

        const message =
          err instanceof Error ? err.message : 'Token exchange failed'
        setError(message)
      })

    return () => {
      active = false
    }
  }, [navigate, searchParams])

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
          <Link to="/" className="app-link text-sm font-medium">
            Try again
          </Link>
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
