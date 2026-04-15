import { useState } from 'react'

interface UserAvatarProps {
  name: string
  avatarUrl?: string | null
  className?: string
  imageClassName?: string
  fallbackClassName?: string
}

export function UserAvatar({
  name,
  avatarUrl,
  className = '',
  imageClassName = '',
  fallbackClassName = '',
}: UserAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const shouldShowImage = Boolean(avatarUrl) && avatarUrl !== failedUrl

  return (
    <div
      className={`ui-avatar flex items-center justify-center overflow-hidden rounded-full ${className}`}
    >
      {shouldShowImage ? (
        <img
          src={avatarUrl ?? undefined}
          alt={`${name} avatar`}
          className={`h-full w-full object-cover ${imageClassName}`}
          onError={() => setFailedUrl(avatarUrl ?? null)}
        />
      ) : (
        <div
          className={`ui-avatar-fallback flex h-full w-full items-center justify-center ${fallbackClassName}`}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-[60%] w-[60%]"
            stroke="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0ZM4.5 19.125a7.5 7.5 0 1115 0"
            />
          </svg>
        </div>
      )}
    </div>
  )
}
