import type { LoaderFunctionArgs } from 'react-router'
import { data } from 'react-router'
import { getFirebaseCustomToken } from '../lib/api-client'
import { verifySession } from '../sessions.server'

// Resource route: the browser fetches `/firebase-token` to obtain a short-lived
// Firebase custom token (uid = session user id) that it then exchanges via
// signInWithCustomToken before any Storage upload/delete.
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await verifySession(request)
  if (!userId) {
    return data({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const firebaseToken = await getFirebaseCustomToken(userId)
    return data({ firebaseToken })
  } catch {
    return data({ error: 'firebase_token_failed' }, { status: 500 })
  }
}
