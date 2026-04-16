import { ThemeProvider } from '@oauth-sample/ui'
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
  useRouteError,
} from 'react-router'
import './app.css'

export function meta() {
  return [{ title: 'OAuth Sample IDP' }]
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: developer by us
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('oauth-sample-theme-mode');var t=m==='dark'||m==='light'?m:window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})()`,
          }}
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  const navigation = useNavigation()
  const isNavigating = navigation.state !== 'idle'

  return (
    <ThemeProvider>
      {isNavigating ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1 bg-gradient-to-r from-indigo-400 via-indigo-500 to-fuchsia-500"
        />
      ) : null}
      <Outlet />
    </ThemeProvider>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? typeof error.data === 'string'
      ? error.data
      : `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred in the Identity Provider.'

  return (
    <Layout>
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
                d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-semibold text-[color:var(--text)]">
            Identity Provider error
          </h1>
          <p className="app-muted text-sm">{message}</p>
        </div>
      </div>
    </Layout>
  )
}
