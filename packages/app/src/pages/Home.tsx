import { startLogin } from '../oauth.js'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
            <svg
              aria-hidden="true"
              className="w-9 h-9 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            OAuth 2.0 Demo
          </h1>
          <p className="text-gray-500 text-lg">
            Authorization Code + PKCE flow
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            How it works
          </h2>
          <ol className="text-left text-sm text-gray-600 space-y-3">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-xs">
                1
              </span>
              App generates a PKCE{' '}
              <code className="bg-gray-100 px-1 rounded">code_verifier</code>{' '}
              &amp;{' '}
              <code className="bg-gray-100 px-1 rounded">code_challenge</code>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-xs">
                2
              </span>
              Browser redirects to the Authorization Server (
              <code className="bg-gray-100 px-1 rounded">:3001/authorize</code>)
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-xs">
                3
              </span>
              Auth server redirects to the Identity Provider (
              <code className="bg-gray-100 px-1 rounded">:3002/login</code>)
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-xs">
                4
              </span>
              After login, auth server issues a <strong>code</strong> and
              redirects back
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-xs">
                5
              </span>
              App exchanges code + verifier for a{' '}
              <strong>JWT access token</strong>
            </li>
          </ol>
        </div>

        <button
          type="button"
          onClick={() => startLogin()}
          className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow transition-colors cursor-pointer"
        >
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
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
          Login with OAuth
        </button>
      </div>
    </div>
  )
}
