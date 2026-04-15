import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  connectStorageEmulator,
  type FirebaseStorage,
  getStorage,
} from 'firebase/storage'

let storageSingleton: FirebaseStorage | null = null
let emulatorConnected = false

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

export function getFirebaseStorageClient(): FirebaseStorage {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Storage is only available in the browser')
  }

  if (storageSingleton) return storageSingleton

  const app = getApps().length ? getApp() : initializeApp(getFirebaseConfig())
  const storage = getStorage(app)

  if (import.meta.env.DEV && !emulatorConnected) {
    const emulator = import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST
    const [host, rawPort] = (emulator ?? '127.0.0.1:9199').split(':')
    const port = Number(rawPort)

    if (host && Number.isFinite(port)) {
      connectStorageEmulator(storage, host, port)
      emulatorConnected = true
    }
  }

  storageSingleton = storage
  return storage
}
