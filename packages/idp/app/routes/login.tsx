import { zodResolver } from '@hookform/resolvers/zod'
import { Button, FormField, Input } from '@ui'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Link, data, redirect } from 'react-router'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { useActionData, useLoaderData, useSubmit } from 'react-router'
import { validateCredentials } from '../lib/api-client'
import { type LoginFields, loginSchema } from '../lib/schemas'
import { buildSessionCookie, signSession } from '../sessions.server'

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const redirectTo = url.searchParams.get('redirect') ?? ''
  return { redirectTo }
}

// ── Action ────────────────────────────────────────────────────────────────────

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData()
  const email = form.get('email') as string
  const password = form.get('password') as string
  const redirectTo = form.get('redirect') as string

  const user = await validateCredentials(email, password)

  if (!user) {
    return data(
      { error: 'Invalid email or password.', redirectTo },
      { status: 401 },
    )
  }

  // Sign a short-lived session JWT and set it as an HttpOnly cookie.
  // The API's /authorize route will verify this same cookie.
  const sessionToken = await signSession(user.id)
  const cookie = buildSessionCookie(sessionToken)

  return redirect(redirectTo || 'http://localhost:3000', {
    headers: { 'Set-Cookie': cookie },
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { redirectTo } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const submit = useSubmit()
  const formRef = useRef<HTMLFormElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({ resolver: zodResolver(loginSchema) })

  function onValid() {
    if (formRef.current) submit(formRef.current, { method: 'post' })
  }

  return (
    <div className="page-shell page-center">
      <div className="w-full max-w-md">
        <div className="app-panel-strong rounded-2xl p-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-[color:var(--text)]">
              Sign in
            </h2>
            <p className="app-muted mt-1 text-sm">
              Identity Provider — OAuth 2.0 Demo
            </p>
          </div>

          <form
            ref={formRef}
            method="post"
            onSubmit={handleSubmit(onValid)}
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
                autoComplete="current-password"
                error={!!errors.password}
                {...register('password')}
              />
            </FormField>

            <Button
              type="submit"
              className="mt-2 flex w-full cursor-pointer justify-center rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              Sign in
            </Button>

            <p className="text-center text-sm text-[color:var(--text-muted)]">
              No account?{' '}
              <Link
                to={`/register?redirect=${encodeURIComponent(redirectTo)}`}
                className="app-link font-medium"
              >
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
