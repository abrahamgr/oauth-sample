import { zodResolver } from '@hookform/resolvers/zod'
import { Button, FormField, Input, UserAvatar } from '@oauth-sample/ui'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import {
  data,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from 'react-router'
import { getUserProfile, updateUser } from '../lib/api-client'
import { uploadUserAvatar } from '../lib/avatar.client'
import {
  type ProfileFormFields,
  profileFormSchema,
  profileSchema,
} from '../lib/schemas'
import { verifySession } from '../sessions.server'

const PROFILE_PATH = '/profile'
const LOGIN_PATH = `/login?redirect=${encodeURIComponent(PROFILE_PATH)}`

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await verifySession(request)
  if (!userId) {
    return redirect(LOGIN_PATH)
  }

  const user = await getUserProfile(userId)
  return { user }
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await verifySession(request)
  if (!userId) {
    return redirect(LOGIN_PATH)
  }

  const form = await request.formData()
  const name = form.get('name')
  const avatarUrl = form.get('avatarUrl')

  const parsed = profileSchema.safeParse({
    name: typeof name === 'string' ? name : '',
    avatarUrl:
      typeof avatarUrl === 'string' && avatarUrl.length > 0 ? avatarUrl : null,
  })

  if (!parsed.success) {
    return data(
      {
        error: 'Please fix the highlighted fields.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  }

  try {
    const user = await updateUser(userId, {
      name: parsed.data.name,
      avatar_url: parsed.data.avatarUrl,
    })

    return data({ success: 'Profile updated.', user })
  } catch (err) {
    return data(
      {
        error: err instanceof Error ? err.message : 'Failed to update profile',
        fieldErrors: {},
      },
      { status: 400 },
    )
  }
}

export default function ProfilePage() {
  const { user } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const submit = useSubmit()
  const formRef = useRef<HTMLFormElement>(null)
  const avatarUrlRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState(user.avatar_url)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormFields>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: user.name },
  })

  const savedUser = actionData && 'user' in actionData ? actionData.user : null
  const successMessage =
    actionData && 'success' in actionData ? actionData.success : null
  const errorMessage =
    actionData && 'error' in actionData ? actionData.error : null
  const fieldErrors =
    actionData && 'fieldErrors' in actionData
      ? actionData.fieldErrors
      : undefined

  useEffect(() => {
    const nextUser = savedUser ?? user
    reset({ name: nextUser.name })
    setPreviewUrl(nextUser.avatar_url)
    setSelectedFile(null)
    setUploadError(null)
    setIsUploading(false)
    if (avatarUrlRef.current) {
      avatarUrlRef.current.value = nextUser.avatar_url ?? ''
    }
  }, [reset, savedUser, user])

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  async function onValid() {
    if (!formRef.current || !avatarUrlRef.current) return

    setUploadError(null)

    try {
      setIsUploading(true)

      if (selectedFile) {
        const previousAvatarUrl = avatarUrlRef.current.value || user.avatar_url
        avatarUrlRef.current.value = await uploadUserAvatar(
          user.id,
          selectedFile,
          previousAvatarUrl,
        )
      }

      submit(formRef.current, { method: 'post' })
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Failed to upload avatar',
      )
      setIsUploading(false)
    }
  }

  const isSaving = isUploading || navigation.state === 'submitting'
  const avatarFieldError = fieldErrors?.avatarUrl?.[0]

  return (
    <div className="page-shell">
      <div className="mx-auto w-full max-w-3xl">
        <div className="app-panel-strong overflow-hidden rounded-3xl">
          <div className="app-profile-hero px-8 py-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <UserAvatar
                  name={user.name}
                  avatarUrl={previewUrl}
                  className="h-24 w-24 app-profile-avatar"
                />
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-100/70">
                    Account settings
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-white">
                    {savedUser?.name ?? user.name}
                  </h1>
                  <p className="mt-1 text-sm text-indigo-100/80">
                    {user.email}
                  </p>
                </div>
              </div>
              <p className="max-w-sm text-sm leading-6 text-indigo-100/80">
                Update the display name and avatar shown in the IDP and the
                OAuth client app.
              </p>
            </div>
          </div>

          <form
            ref={formRef}
            method="post"
            onSubmit={handleSubmit(onValid)}
            className="grid gap-8 p-8 lg:grid-cols-[minmax(0,1fr)_20rem]"
            noValidate
          >
            <div className="space-y-5">
              {successMessage ? (
                <div className="app-success rounded-lg p-3 text-sm">
                  {successMessage}
                </div>
              ) : null}

              {errorMessage ? (
                <div className="app-danger rounded-lg p-3 text-sm">
                  {errorMessage}
                </div>
              ) : null}

              {uploadError ? (
                <div className="app-danger rounded-lg p-3 text-sm">
                  {uploadError}
                </div>
              ) : null}

              <FormField
                label="Display name"
                htmlFor="name"
                error={errors.name?.message ?? fieldErrors?.name?.[0]}
              >
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  error={!!errors.name || !!fieldErrors?.name?.[0]}
                  {...register('name')}
                />
              </FormField>

              <input
                ref={avatarUrlRef}
                type="hidden"
                name="avatarUrl"
                defaultValue={user.avatar_url ?? ''}
              />

              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-[color:var(--text)]">
                      Profile picture
                    </h2>
                    <p className="app-muted mt-1 text-sm">
                      Images are cropped to a square and resized to 256px before
                      upload.
                    </p>
                  </div>
                  <UserAvatar
                    name={user.name}
                    avatarUrl={previewUrl}
                    className="h-16 w-16"
                  />
                </div>

                <label className="block cursor-pointer rounded-xl border border-dashed border-[color:var(--border-strong)] bg-[color:var(--bg-accent)] px-4 py-5 text-sm text-[color:var(--text)] transition-colors hover:border-[color:var(--accent)]">
                  <span className="block font-medium">Choose image</span>
                  <span className="app-muted mt-1 block text-xs">
                    PNG, JPEG, WebP, or GIF
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0] ?? null
                      setSelectedFile(file)
                      setUploadError(null)

                      if (!file) {
                        setPreviewUrl(
                          avatarUrlRef.current?.value || user.avatar_url,
                        )
                        return
                      }

                      const nextPreviewUrl = URL.createObjectURL(file)
                      setPreviewUrl((currentPreviewUrl) => {
                        if (currentPreviewUrl?.startsWith('blob:')) {
                          URL.revokeObjectURL(currentPreviewUrl)
                        }
                        return nextPreviewUrl
                      })
                    }}
                  />
                </label>

                <div className="mt-3 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-xl px-4 py-2 text-sm font-semibold"
                    onClick={() => {
                      setSelectedFile(null)
                      setUploadError(null)
                      if (previewUrl?.startsWith('blob:')) {
                        URL.revokeObjectURL(previewUrl)
                      }
                      setPreviewUrl(null)
                      if (avatarUrlRef.current) avatarUrlRef.current.value = ''
                    }}
                  >
                    Use default avatar
                  </Button>
                </div>

                {avatarFieldError ? (
                  <p className="mt-3 text-sm text-[color:var(--danger)]">
                    {avatarFieldError}
                  </p>
                ) : null}
              </div>
            </div>

            <aside className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
              <h2 className="text-base font-semibold text-[color:var(--text)]">
                Where this shows up
              </h2>
              <p className="app-muted mt-2 text-sm leading-6">
                The saved name and avatar appear in the IDP header and in the
                app header after the next profile refresh.
              </p>

              <Button
                type="submit"
                className="mt-6 flex w-full justify-center rounded-xl px-4 py-2.5 text-sm font-semibold"
                disabled={isSaving}
              >
                {isSaving ? 'Saving…' : 'Save profile'}
              </Button>
            </aside>
          </form>
        </div>
      </div>
    </div>
  )
}
