import { UserAvatar } from './UserAvatar'

interface UserIdentityProps {
  name: string
  avatarUrl?: string | null
  subtitle?: string
  className?: string
}

export function UserIdentity({
  name,
  avatarUrl,
  subtitle,
  className = '',
}: UserIdentityProps) {
  return (
    <div className={`ui-identity inline-flex items-center gap-3 ${className}`}>
      <UserAvatar name={name} avatarUrl={avatarUrl} className="h-10 w-10" />
      <div className="min-w-0 text-left">
        <p className="truncate text-sm font-semibold text-[color:var(--text)]">
          {name}
        </p>
        {subtitle ? (
          <p className="app-muted truncate text-xs">{subtitle}</p>
        ) : null}
      </div>
    </div>
  )
}
