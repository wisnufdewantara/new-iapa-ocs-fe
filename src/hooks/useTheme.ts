import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('newocs-theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage bisa nggak tersedia (private mode dll), fallback ke light
  }
  return 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('newocs-theme', theme)
    } catch {
      // abaikan kalau localStorage nggak bisa dipakai
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
