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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg
              aria-hidden="true"
              className="w-7 h-7 text-red-600"
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication failed
          </h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <a
            href="/"
            className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
          >
            Try again
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Exchanging authorization code…</p>
      </div>
    </div>
  )
}
