import { Button } from '@ui'
import { isLoggedIn, startLogin } from '../oauth'

export default function Home() {
  const loggedIn = isLoggedIn()

  return (
    <div className="page-shell page-center">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500 shadow-[0_20px_45px_rgba(99,102,241,0.35)]">
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
          <h1 className="mb-2 text-4xl font-bold text-[color:var(--text)]">
            OAuth 2.0 Demo
          </h1>
          <p className="app-muted text-lg">Authorization Code + PKCE flow</p>
        </div>

        <div className="app-panel-strong mb-6 rounded-2xl p-8">
          <h2 className="mb-4 text-lg font-semibold text-[color:var(--text)]">
            How it works
          </h2>
          <ol className="app-muted space-y-3 text-left text-sm">
            <li className="flex gap-3">
              <span className="app-step flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                1
              </span>
              App generates a PKCE{' '}
              <code className="app-code">code_verifier</code> &amp;{' '}
              <code className="app-code">code_challenge</code>
            </li>
            <li className="flex gap-3">
              <span className="app-step flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                2
              </span>
              Browser redirects to the Authorization Server (
              <code className="app-code">:3001/authorize</code>)
            </li>
            <li className="flex gap-3">
              <span className="app-step flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                3
              </span>
              Auth server redirects to the Identity Provider (
              <code className="app-code">:3002/login</code>)
            </li>
            <li className="flex gap-3">
              <span className="app-step flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                4
              </span>
              After login, auth server issues a <strong>code</strong> and
              redirects back
            </li>
            <li className="flex gap-3">
              <span className="app-step flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                5
              </span>
              App exchanges code + verifier for a{' '}
              <strong>JWT access token</strong>
            </li>
          </ol>
        </div>

        {!loggedIn && (
          <Button
            onClick={() => startLogin()}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl px-6 py-3 font-semibold"
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
          </Button>
        )}
      </div>
    </div>
  )
}
