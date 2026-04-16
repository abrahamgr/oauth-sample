import { zodResolver } from '@hookform/resolvers/zod'
import { Button, FormField, Input } from '@oauth-sample/ui'
import { useForm } from 'react-hook-form'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import {
  data,
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from 'react-router'
import { RouteErrorCard } from '../components/RouteErrorCard'
import { registerUser } from '../lib/api-client'
import { getClientIp, isRateLimited } from '../lib/rate-limit.server'
import { getDefaultAppRedirect, sanitizeRedirectTarget } from '../lib/redirects'
import { type RegisterFields, registerSchema } from '../lib/schemas'
import {
  buildSessionCookie,
  signSession,
  verifySession,
} from '../sessions.server'

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const redirectTo = sanitizeRedirectTarget(
    request,
    url.searchParams.get('redirect'),
  )

  const userId = await verifySession(request)
  if (userId) return redirect(redirectTo || getDefaultAppRedirect())

  return { redirectTo }
}

// ── Action ────────────────────────────────────────────────────────────────────

export async function action({ request }: ActionFunctionArgs) {
  const ip = getClientIp(request)
  if (isRateLimited(`register:${ip}`, { max: 5, windowMs: 60 * 60 * 1000 })) {
    return data(
      {
        error: 'Too many registration attempts. Please try again later.',
        redirectTo: '',
      },
      { status: 429 },
    )
  }

  const form = await request.formData()
  const name = form.get('name') as string
  const email = form.get('email') as string
  const password = form.get('password') as string
  const redirectTo = sanitizeRedirectTarget(
    request,
    form.get('redirect') as string,
  )

  try {
    const user = await registerUser(email, password, name)

    const sessionToken = await signSession(user.id)
    const cookie = await buildSessionCookie(sessionToken)

    return redirect(redirectTo, {
      headers: { 'Set-Cookie': cookie },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed'
    return data({ error: message, redirectTo }, { status: 400 })
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const { redirectTo } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'
  const submit = useSubmit()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFields>({ resolver: zodResolver(registerSchema) })

  return (
    <div className="page-shell page-center">
      <div className="w-full max-w-md">
        <div className="app-panel-strong rounded-2xl p-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-[color:var(--text)]">
              Create an account
            </h2>
            <p className="app-muted mt-1 text-sm">
              Identity Provider — OAuth 2.0 Demo
            </p>
          </div>

          <Form
            method="post"
            onSubmit={handleSubmit((_data, event) => {
              submit(event?.target as HTMLFormElement)
            })}
            className="space-y-5"
            noValidate
          >
            <input type="hidden" name="redirect" value={redirectTo} />

            {actionData && 'error' in actionData && (
              <div className="app-danger rounded-lg p-3">
                <p className="text-sm">{actionData.error}</p>
              </div>
            )}

            <FormField
              label="Full name"
              htmlFor="name"
              error={errors.name?.message}
            >
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                error={!!errors.name}
                {...register('name')}
              />
            </FormField>

            <FormField
              label="Email address"
              htmlFor="email"
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={!!errors.email}
                {...register('email')}
              />
            </FormField>

            <FormField
              label="Password"
              htmlFor="password"
              error={errors.password?.message}
            >
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                error={!!errors.password}
                {...register('password')}
              />
            </FormField>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full cursor-pointer justify-center rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>

            <p className="text-center text-sm text-[color:var(--text-muted)]">
              Already have an account?{' '}
              <Link
                to={`/login?redirect=${encodeURIComponent(redirectTo)}`}
                className="app-link font-medium"
              >
                Sign in
              </Link>
            </p>
          </Form>
        </div>
      </div>
    </div>
  )
}

export function meta() {
  return [{ title: 'Register | OAuth Sample IDP' }]
}

export function ErrorBoundary() {
  return (
    <RouteErrorCard
      heading="Unable to register"
      fallbackMessage="The registration page could not be loaded."
    />
  )
}
