import { type App, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

let adminApp: App | null = null

function getAdminApp(): App {
  if (adminApp) return adminApp

  const existingApps = getApps()
  if (existingApps.length > 0) {
    adminApp = existingApps[0]
    return adminApp
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  // AppHosting / .env stores newlines as the literal "\n" sequence.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  // When the Auth emulator is active, the Admin SDK skips real signing —
  // a project id alone is enough.
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    if (!projectId) {
      throw new Error(
        'FIREBASE_PROJECT_ID is required when FIREBASE_AUTH_EMULATOR_HOST is set',
      )
    }
    adminApp = initializeApp({ projectId })
    return adminApp
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin is not configured: set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY',
    )
  }

  adminApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  })
  return adminApp
}

export function createFirebaseCustomToken(userId: string): Promise<string> {
  return getAuth(getAdminApp()).createCustomToken(userId)
}
