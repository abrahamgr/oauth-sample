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
import { ApiClientError, resetPassword } from '../lib/api-client'
import { type ResetPasswordFields, resetPasswordSchema } from '../lib/schemas'
import { clearSessionCookie } from '../sessions.server'

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) return redirect('/forgot-password')

  return { token }
}

// ── Action ────────────────────────────────────────────────────────────────────

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData()
  const token = form.get('token') as string
  const password = form.get('password') as string

  try {
    await resetPassword(token, password)
  } catch (err) {
    const message =
      err instanceof ApiClientError || err instanceof Error
        ? err.message
        : 'Reset failed'
    return data({ error: message }, { status: 400 })
  }

  // Clear IDP session and force re-login with new password
  const clearedCookie = await clearSessionCookie()

  return redirect('/login?message=password-reset', {
    headers: { 'Set-Cookie': clearedCookie },
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  const { token } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'
  const submit = useSubmit()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFields>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const apiError = actionData && 'error' in actionData ? actionData.error : null
  const isExpired = typeof apiError === 'string' && apiError.includes('expired')
  const isUsed =
    typeof apiError === 'string' && apiError.includes('already used')

  return (
    <div className="page-shell page-center">
      <div className="w-full max-w-md">
        <div className="app-panel-strong rounded-2xl p-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-[color:var(--text)]">
              Set new password
            </h2>
            <p className="app-muted mt-1 text-sm">
              Choose a strong password for your account.
            </p>
          </div>

          {apiError && (
            <div className="app-danger mb-5 rounded-lg p-3">
              <p className="text-sm">
                {isExpired
                  ? 'This reset link has expired.'
                  : isUsed
                    ? 'This reset link has already been used.'
                    : 'Something went wrong. Please try again.'}
              </p>
              {(isExpired || isUsed) && (
                <Link
                  to="/forgot-password"
                  className="mt-1 block text-sm font-medium underline"
                >
                  Request a new link
                </Link>
              )}
            </div>
          )}

          <Form
            method="post"
            onSubmit={handleSubmit((_data, event) => {
              submit(event?.target as HTMLFormElement)
            })}
            className="space-y-5"
            noValidate
          >
            <input type="hidden" name="token" value={token} />

            <FormField
              label="New password"
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

            <FormField
              label="Confirm new password"
              htmlFor="confirmPassword"
              error={errors.confirmPassword?.message}
            >
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                error={!!errors.confirmPassword}
                {...register('confirmPassword')}
              />
            </FormField>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full cursor-pointer justify-center rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              {isSubmitting ? 'Updating password…' : 'Update password'}
            </Button>

            <p className="text-center text-sm text-[color:var(--text-muted)]">
              <Link to="/login" className="app-link font-medium">
                Back to sign in
              </Link>
            </p>
          </Form>
        </div>
      </div>
    </div>
  )
}

export function meta() {
  return [{ title: 'Reset Password | OAuth Sample IDP' }]
}

export function ErrorBoundary() {
  return (
    <RouteErrorCard
      heading="Unable to update your password"
      fallbackMessage="The password reset page could not be loaded."
    />
  )
}
