import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  type Auth,
  connectAuthEmulator,
  getAuth,
  signInWithCustomToken,
} from 'firebase/auth'
import {
  connectStorageEmulator,
  type FirebaseStorage,
  getStorage,
} from 'firebase/storage'

let storageSingleton: FirebaseStorage | null = null
let authSingleton: Auth | null = null
let storageEmulatorConnected = false
let authEmulatorConnected = false
let signInPromise: Promise<void> | null = null

function getFirebaseConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const appId = import.meta.env.VITE_FIREBASE_APP_ID
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET

  if (!apiKey || !appId || !projectId || !storageBucket) {
    throw new Error('Firebase Storage is not configured for the IDP')
  }

  return {
    apiKey,
    appId,
    projectId,
    storageBucket,
    authDomain:
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ??
      `${projectId}.firebaseapp.com`,
  }
}

function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(getFirebaseConfig())
}

export function getFirebaseStorageClient(): FirebaseStorage {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Storage is only available in the browser')
  }

  if (storageSingleton) return storageSingleton

  const storage = getStorage(getFirebaseApp())

  if (import.meta.env.DEV && !storageEmulatorConnected) {
    const emulator = import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST
    const [host, rawPort] = (emulator ?? '127.0.0.1:9199').split(':')
    const port = Number(rawPort)

    if (host && Number.isFinite(port)) {
      connectStorageEmulator(storage, host, port)
      storageEmulatorConnected = true
    }
  }

  storageSingleton = storage
  return storage
}

function getFirebaseAuthClient(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth is only available in the browser')
  }

  if (authSingleton) return authSingleton

  const auth = getAuth(getFirebaseApp())

  if (import.meta.env.DEV && !authEmulatorConnected) {
    const emulator = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST
    const url = emulator ?? 'http://127.0.0.1:9099'
    connectAuthEmulator(auth, url, { disableWarnings: true })
    authEmulatorConnected = true
  }

  authSingleton = auth
  return auth
}

/**
 * Ensure the browser is signed in to Firebase Auth as the current IDP user.
 *
 * Fetches a short-lived custom token from /firebase-token (resource route on
 * the IDP) and exchanges it via signInWithCustomToken. Storage rules then see
 * request.auth.uid = our internal user id, which gates avatars/{uid} and
 * documents/{uid}.
 *
 * Safe to call repeatedly: a successful sign-in is cached, and concurrent
 * callers share the same in-flight promise.
 */
export async function ensureFirebaseSignedIn(): Promise<void> {
  const auth = getFirebaseAuthClient()
  if (auth.currentUser) return

  if (!signInPromise) {
    signInPromise = (async () => {
      const res = await fetch('/idp/firebase-token', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) {
        throw new Error('Could not authenticate with Firebase')
      }
      const { firebaseToken } = (await res.json()) as { firebaseToken: string }
      await signInWithCustomToken(auth, firebaseToken)
    })().finally(() => {
      signInPromise = null
    })
  }

  await signInPromise
}
