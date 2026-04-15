import {
  createContext,
  use,
  useCallback,
  useEffect,
  useEffectEvent,
  useState,
} from 'react'
import { fetchUserInfo, isLoggedIn, type UserInfo } from './oauth'

interface ProfileContextValue {
  user: UserInfo | null
  loading: boolean
  error: string | null
  refreshProfile: () => Promise<void>
  clearProfile: () => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

async function loadProfile(): Promise<UserInfo | null> {
  if (!isLoggedIn()) {
    return null
  }

  return fetchUserInfo()
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    setLoading(true)

    try {
      const nextUser = await loadProfile()
      setUser(nextUser)
      setError(null)
    } catch (err) {
      setUser(null)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  const clearProfile = useCallback(() => {
    setUser(null)
    setError(null)
    setLoading(false)
  }, [])

  const handleProfileChange = useEffectEvent(() => {
    void refreshProfile()
  })

  useEffect(() => {
    void refreshProfile()

    window.addEventListener('oauth-profile-changed', handleProfileChange)

    return () => {
      window.removeEventListener('oauth-profile-changed', handleProfileChange)
    }
  }, [refreshProfile])

  return (
    <ProfileContext
      value={{ user, loading, error, refreshProfile, clearProfile }}
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
