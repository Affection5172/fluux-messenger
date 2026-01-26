import { type ReactNode } from 'react'
import { useMode } from '@/hooks/useMode'
import { useAppearanceSync } from '@/hooks/useAppearanceSync'

interface ThemeProviderProps {
  children: ReactNode
}

/**
 * Initializes theme on mount and applies theme class to document.
 * Also handles PEP sync when connected (via useAppearanceSync).
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  useMode()
  useAppearanceSync()
  return <>{children}</>
}
