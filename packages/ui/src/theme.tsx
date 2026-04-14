import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'
export type EffectiveTheme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'oauth-sample-theme-mode'

type ThemeContextValue = {
  effectiveTheme: EffectiveTheme
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark'
}

function getSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined') return 'light'

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function getStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system'

  const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isThemeMode(storedMode) ? storedMode : 'system'
}

function applyTheme(theme: EffectiveTheme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => getStoredMode())
  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>(() =>
    getSystemTheme(),
  )

  const effectiveTheme = mode === 'system' ? systemTheme : mode

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode)
  }, [mode])

  useEffect(() => {
    applyTheme(effectiveTheme)
  }, [effectiveTheme])

  return (
    <ThemeContext.Provider value={{ effectiveTheme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
