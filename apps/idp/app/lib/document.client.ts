import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage'
import { getFirebaseStorageClient } from './firebase.client'

export const DOCUMENT_MAX_SIZE_BYTES = 100 * 1024 * 1024

export interface UploadedDocument {
  storagePath: string
  contentType: string
  sizeBytes: number
}

export async function uploadDocument(
  userId: string,
  file: File,
): Promise<UploadedDocument> {
  if (file.size > DOCUMENT_MAX_SIZE_BYTES) {
    throw new Error('File exceeds the 100 MB upload limit')
  }

  const storage = getFirebaseStorageClient()
  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80)
  const storagePath = `documents/${userId}/${crypto.randomUUID()}-${safeName}`
  const objectRef = ref(storage, storagePath)
  const contentType = file.type || 'application/octet-stream'

  await uploadBytes(objectRef, file, { contentType })

  return {
    storagePath,
    contentType,
    sizeBytes: file.size,
  }
}

export async function getDocumentDownloadUrl(
  storagePath: string,
): Promise<string> {
  const storage = getFirebaseStorageClient()
  return getDownloadURL(ref(storage, storagePath))
}

export async function deleteDocumentObject(storagePath: string): Promise<void> {
  const storage = getFirebaseStorageClient()
  try {
    await deleteObject(ref(storage, storagePath))
  } catch {
    // Best-effort: the DB row is already gone; orphans don't block the user.
  }
}
