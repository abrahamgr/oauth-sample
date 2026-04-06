import { zodResolver } from '@hookform/resolvers/zod'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { data, redirect } from 'react-router'
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
    <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">
            <svg
              aria-hidden="true"
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Identity Provider — OAuth 2.0 Demo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form
            ref={formRef}
            method="post"
            onSubmit={handleSubmit(onValid)}
            className="space-y-6"
            noValidate
          >
            <input type="hidden" name="redirect" value={redirectTo} />
            {actionData && 'error' in actionData && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{actionData.error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`block w-full appearance-none rounded-md border px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none sm:text-sm ${
                    errors.email
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className={`block w-full appearance-none rounded-md border px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none sm:text-sm ${
                    errors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
              >
                Sign in
              </button>
            </div>

            <p className="text-center text-sm text-gray-600">
              No account?{' '}
              <a
                href={`/register?redirect=${encodeURIComponent(redirectTo)}`}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Create one
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
