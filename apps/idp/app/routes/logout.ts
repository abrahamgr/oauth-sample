import type { LoaderFunctionArgs } from 'react-router'
import { redirect } from 'react-router'
import { getDefaultAppRedirect, sanitizeRedirectTarget } from '../lib/redirects'
import { clearSessionCookie } from '../sessions.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const redirectTo = sanitizeRedirectTarget(
    request,
    url.searchParams.get('redirect'),
    getDefaultAppRedirect(),
  )

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await clearSessionCookie(),
    },
  })
}
