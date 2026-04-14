import { zodResolver } from '@hookform/resolvers/zod'
import { Button, FormField, Input } from '@oauth-sample/ui'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import {
  data,
  Link,
  useActionData,
  useLoaderData,
  useSubmit,
} from 'react-router'
import { requestPasswordReset } from '../lib/api-client'
import { type ForgotPasswordFields, forgotPasswordSchema } from '../lib/schemas'

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email') ?? ''
  return { email }
}

// ── Action ────────────────────────────────────────────────────────────────────

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData()
  const email = form.get('email') as string

  await requestPasswordReset(email)

  return data({ sent: true })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const { email: defaultEmail } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const submit = useSubmit()
  const formRef = useRef<HTMLFormElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFields>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: defaultEmail },
  })

  function onValid() {
    if (formRef.current) submit(formRef.current, { method: 'post' })
  }

  if (actionData && 'sent' in actionData) {
    return (
      <div className="page-shell page-center">
        <div className="w-full max-w-md">
          <div className="app-panel-strong rounded-2xl p-8 text-center">
            <div className="app-success mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-[color:var(--text)]">
              Check your email
            </h2>
            <p className="app-muted mb-6 text-sm leading-relaxed">
              If that address is registered, you'll receive a reset link
              shortly. The link expires in 15 minutes.
            </p>
            <Link to="/login" className="app-link text-sm font-medium">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell page-center">
      <div className="w-full max-w-md">
        <div className="app-panel-strong rounded-2xl p-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-[color:var(--text)]">
              Forgot password?
            </h2>
            <p className="app-muted mt-1 text-sm">
              Enter your email and we'll send a reset link.
            </p>
          </div>

          <form
            ref={formRef}
            method="post"
            onSubmit={handleSubmit(onValid)}
            className="space-y-5"
            noValidate
          >
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

            <Button
              type="submit"
              className="mt-2 flex w-full cursor-pointer justify-center rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              Send reset link
            </Button>

            <p className="text-center text-sm text-[color:var(--text-muted)]">
              Remembered it?{' '}
              <Link to="/login" className="app-link font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
