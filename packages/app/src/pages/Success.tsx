import { Link } from 'react-router'
import { useNavigate } from 'react-router'
import { logout } from '../oauth'

export default function Success() {
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <svg
            aria-hidden="true"
            className="w-9 h-9 text-green-600"
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

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          You're logged in!
        </h1>
        <p className="text-gray-500 mb-8">
          The OAuth 2.0 Authorization Code + PKCE flow completed successfully.
          Your access token is stored in{' '}
          <code className="bg-gray-100 px-1 rounded text-sm">
            sessionStorage
          </code>
          .
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 text-left">
          <h3 className="font-semibold text-gray-800 mb-3">
            What just happened?
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              Auth server verified your PKCE code challenge
            </li>
            <li className="flex gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              Authorization code exchanged for a JWT access token
            </li>
            <li className="flex gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              Refresh token stored for later use
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Link
            to="/profile"
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow transition-colors"
          >
            View Profile
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl shadow-sm border border-gray-200 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
