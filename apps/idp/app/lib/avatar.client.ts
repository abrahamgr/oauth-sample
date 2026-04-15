import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage'
import { getFirebaseStorageClient } from './firebase.client'

const AVATAR_SIZE = 256

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load selected image'))
    image.src = url
  })
}

async function resizeAvatar(file: File): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await loadImage(objectUrl)
    const canvas = document.createElement('canvas')
    canvas.width = AVATAR_SIZE
    canvas.height = AVATAR_SIZE

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Could not prepare the avatar image')
    }

    const sourceSize = Math.min(image.width, image.height)
    const sourceX = (image.width - sourceSize) / 2
    const sourceY = (image.height - sourceSize) / 2

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE,
    )

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.9)
    })

    if (!blob) {
      throw new Error('Could not encode the avatar image')
    }

    return blob
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function uploadUserAvatar(
  userId: string,
  file: File,
  previousAvatarUrl?: string | null,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choose an image file')
  }

  const storage = getFirebaseStorageClient()
  const blob = await resizeAvatar(file)
  const avatarRef = ref(storage, `avatars/${userId}/${crypto.randomUUID()}.jpg`)

  await uploadBytes(avatarRef, blob, {
    contentType: 'image/jpeg',
    cacheControl: 'public,max-age=3600',
  })

  const nextAvatarUrl = await getDownloadURL(avatarRef)

  if (previousAvatarUrl && previousAvatarUrl !== nextAvatarUrl) {
    try {
      await deleteObject(ref(storage, previousAvatarUrl))
    } catch {
      // The new upload succeeded; leave orphan cleanup as best-effort.
    }
  }

  return nextAvatarUrl
}
