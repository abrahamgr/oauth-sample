import {
  createContext,
  startTransition,
  use,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react'
import {
  AUTH_STATE_CHANGE_EVENT,
  fetchUserInfo,
  getAccessToken,
  logout as performLogout,
  startLogin,
  type UserInfo,
} from './oauth'

interface ProfileContextValue {
  token: string | null
  loggedIn: boolean
  user: UserInfo | null
  loading: boolean
  error: string | null
  login: () => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
  clearProfile: () => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAccessToken())
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(() => Boolean(getAccessToken()))
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const loggedIn = token !== null

  const syncProfile = useEffectEvent(async () => {
    const nextToken = getAccessToken()
    setToken(nextToken)

    if (!nextToken) {
      requestIdRef.current += 1
      startTransition(() => {
        setUser(null)
        setError(null)
        setLoading(false)
      })
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setLoading(true)

    try {
      const nextUser = await fetchUserInfo(nextToken)

      if (requestId !== requestIdRef.current) {
        return
      }

      startTransition(() => {
        setUser(nextUser)
        setError(null)
      })
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return
      }

      startTransition(() => {
        setUser(null)
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      })
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  })

  const refreshProfile = useCallback(async () => {
    await syncProfile()
  }, [])

  const clearProfile = useCallback(() => {
    requestIdRef.current += 1
    setToken(null)
    setUser(null)
    setError(null)
    setLoading(false)
  }, [])

  const handleProfileChange = useEffectEvent(() => {
    void syncProfile()
  })

  const handleStorage = useEffectEvent((event: StorageEvent) => {
    if (event.storageArea !== sessionStorage) {
      return
    }

    if (event.key !== null && event.key !== 'oauth_access_token') {
      return
    }

    void syncProfile()
  })

  useEffect(() => {
    void syncProfile()

    window.addEventListener(AUTH_STATE_CHANGE_EVENT, handleProfileChange)
    window.addEventListener('storage', handleStorage)

    return () => {
      requestIdRef.current += 1
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, handleProfileChange)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return (
    <ProfileContext
      value={{
        token,
        loggedIn,
        user,
        loading,
        error,
        login: startLogin,
        logout: performLogout,
        refreshProfile,
        clearProfile,
      }}
    >
      {children}
    </ProfileContext>
  )
}

export function useProfile() {
  const context = use(ProfileContext)

  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }

  return context
}
