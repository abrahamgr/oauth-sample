import { z } from 'zod'

// ── Shared primitives ─────────────────────────────────────────────────────────

const emailField = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
const nameField = z.string().min(2, 'Name must be at least 2 characters')
const requiredString = z.string().min(1, 'Required')
const avatarUrlField = z
  .string()
  .url('Avatar URL must be a valid URL')
  .nullable()

// ── Route schemas ─────────────────────────────────────────────────────────────

export const authorizeQuerySchema = z.object({
  response_type: z.literal('code'),
  client_id: requiredString,
  redirect_uri: z.string().url('Invalid redirect_uri'),
  code_challenge: requiredString,
  code_challenge_method: z.literal('S256'),
  scope: z.string().optional().default('openid profile email'),
  state: z.string().optional().default(''),
})

const authCodeBodySchema = z.object({
  grant_type: z.literal('authorization_code'),
  code: requiredString,
  code_verifier: requiredString,
  client_id: requiredString,
  redirect_uri: z.string().url('Invalid redirect_uri'),
})

const refreshTokenBodySchema = z.object({
  grant_type: z.literal('refresh_token'),
  refresh_token: requiredString,
  client_id: requiredString,
})

export const tokenBodySchema = z.discriminatedUnion('grant_type', [
  authCodeBodySchema,
  refreshTokenBodySchema,
])

export const registerBodySchema = z.object({
  email: emailField,
  password: passwordField,
  name: nameField,
})

export const internalVerifyBodySchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
})

export const internalProfileHeadersSchema = z.object({
  'x-user-id': requiredString,
})

export const updateProfileBodySchema = z.object({
  name: nameField,
  avatar_url: avatarUrlField,
})

export const forgotPasswordSchema = z.object({ email: emailField })

export const resetPasswordSchema = z.object({
  token: requiredString,
  password: passwordField,
})

// ── Inferred types ────────────────────────────────────────────────────────────

export type AuthorizeQuery = z.infer<typeof authorizeQuerySchema>
export type TokenBody = z.infer<typeof tokenBodySchema>
export type RegisterBody = z.infer<typeof registerBodySchema>
export type InternalVerifyBody = z.infer<typeof internalVerifyBodySchema>
export type InternalProfileHeaders = z.infer<
  typeof internalProfileHeadersSchema
>
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>
