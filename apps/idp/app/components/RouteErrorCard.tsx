import { isRouteErrorResponse, useRouteError } from 'react-router'

interface RouteErrorCardProps {
  heading: string
  fallbackMessage: string
}

export function RouteErrorCard({
  heading,
  fallbackMessage,
}: RouteErrorCardProps) {
  const error = useRouteError()

  let message = fallbackMessage

  if (isRouteErrorResponse(error)) {
    if (typeof error.data === 'string') {
      message = error.data
    } else if (
      error.data &&
      typeof error.data === 'object' &&
      'message' in error.data &&
      typeof error.data.message === 'string'
    ) {
      message = error.data.message
    } else {
      message = `${error.status} ${error.statusText}`
    }
  } else if (error instanceof Error) {
    message = error.message
  }

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
              d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
            />
          </svg>
        </div>
        <h1 className="mb-2 text-xl font-semibold text-[color:var(--text)]">
          {heading}
        </h1>
        <p className="app-muted text-sm">{message}</p>
      </div>
    </div>
  )
}
