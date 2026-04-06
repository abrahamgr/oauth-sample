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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            to="/"
            className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
          >
            Go home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-10 text-center">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
            <p className="text-indigo-200 text-sm mt-1">{user?.email}</p>
          </div>

          {/* Claims */}
          <div className="p-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              /userinfo claims
            </h2>
            <dl className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <dt className="text-sm font-medium text-gray-500 flex-shrink-0">
                  sub
                </dt>
                <dd className="text-sm text-gray-900 font-mono text-right break-all">
                  {user?.sub}
                </dd>
              </div>
              <div className="flex justify-between items-start gap-4">
                <dt className="text-sm font-medium text-gray-500 flex-shrink-0">
                  email
                </dt>
                <dd className="text-sm text-gray-900 text-right">
                  {user?.email}
                </dd>
              </div>
              <div className="flex justify-between items-start gap-4">
                <dt className="text-sm font-medium text-gray-500 flex-shrink-0">
                  name
                </dt>
                <dd className="text-sm text-gray-900 text-right">
                  {user?.name}
                </dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div className="px-8 pb-8 flex gap-3">
            <Link
              to="/"
              className="flex-1 flex items-center justify-center text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-lg transition-colors"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex-1 flex items-center justify-center text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 py-2 px-4 rounded-lg transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
