import { redirect } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const redirectTo = url.searchParams.get('redirect') ?? 'http://localhost:3000'

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': 'idp_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    },
  })
}
