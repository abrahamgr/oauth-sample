import {
  cloneElement,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { UserAvatar } from './UserAvatar'

interface UserMenuProps {
  name: string
  avatarUrl?: string | null
  subtitle?: string
  children: ReactNode
}

interface UserMenuItemProps {
  children: ReactNode
  className?: string
  onSelect?: () => void
  asChild?: boolean
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 text-[color:var(--text-subtle)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 9l6 6 6-6"
      />
    </svg>
  )
}

const MENU_CLOSE_EVENT = 'oauth-sample:user-menu-close'

function Item({
  children,
  className = '',
  onSelect,
  asChild = false,
}: UserMenuItemProps) {
  const classes = `app-menu-item ${className}`.trim()

  function close() {
    window.dispatchEvent(new CustomEvent(MENU_CLOSE_EVENT))
  }

  if (asChild) {
    if (!isValidElement(children)) {
      throw new Error(
        'UserMenu.Item with asChild requires a single element child',
      )
    }
    const child = children as ReactElement<{
      className?: string
      role?: string
      onClick?: (event: MouseEvent) => void
    }>
    return cloneElement(child, {
      className: `${classes} ${child.props.className ?? ''}`.trim(),
      role: 'menuitem',
      onClick: (event: MouseEvent) => {
        child.props.onClick?.(event)
        onSelect?.()
        close()
      },
    })
  }

  return (
    <button
      type="button"
      role="menuitem"
      className={classes}
      onClick={() => {
        onSelect?.()
        close()
      }}
    >
      {children}
    </button>
  )
}

export function UserMenu({
  name,
  avatarUrl,
  subtitle,
  children,
}: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: globalThis.MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    function handleClose() {
      setOpen(false)
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKey)
    window.addEventListener(MENU_CLOSE_EVENT, handleClose)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener(MENU_CLOSE_EVENT, handleClose)
    }
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="app-user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <UserAvatar
          name={name}
          avatarUrl={avatarUrl}
          className="h-8 w-8 text-xs"
        />
        <span className="hidden sm:flex flex-col items-start min-w-0">
          <span className="text-sm font-medium text-[color:var(--text)] truncate max-w-[12rem]">
            {name}
          </span>
          {subtitle ? (
            <span className="text-xs text-[color:var(--text-subtle)] truncate max-w-[12rem]">
              {subtitle}
            </span>
          ) : null}
        </span>
        <ChevronIcon />
      </button>

      {open ? (
        <div
          id={panelId}
          role="menu"
          aria-label={`${name} account menu`}
          className="app-menu-panel"
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

UserMenu.Item = Item
