import { useEffect } from 'react'
import { useSettingsStore, type ThemeMode } from '@/stores/settingsStore'

/**
 * Resolves the actual mode (light/dark) based on setting and system preference
 */
function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }
  return mode
}

/**
 * Hook that applies the mode class to document.documentElement
 * and listens for system preference changes when in 'system' mode.
 *
 * Returns:
 * - mode: The current mode setting ('light' | 'dark' | 'system')
 * - setMode: Function to change the mode
 * - resolvedMode: The actual applied mode ('light' | 'dark')
 * - isDark: Convenience boolean for dark mode checks
 */
export function useMode() {
  const mode = useSettingsStore((s) => s.themeMode)
  const setMode = useSettingsStore((s) => s.setThemeMode)

  useEffect(() => {
    const root = document.documentElement

    function applyMode() {
      const resolved = resolveMode(mode)
      root.classList.remove('light', 'dark')
      if (resolved === 'light') {
        root.classList.add('light')
      }
      // No class needed for dark (it's the default in :root)
    }

    applyMode()

    // Listen for system preference changes when in 'system' mode
    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
      const handler = () => applyMode()
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [mode])

  const resolved = resolveMode(mode)
  return { mode, setMode, resolvedMode: resolved, isDark: resolved === 'dark' }
}
