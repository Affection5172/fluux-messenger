import { useState, useEffect } from 'react'

/**
 * Detects if the app is running as a mobile web/PWA (not Tauri desktop app).
 *
 * Returns true when:
 * - NOT running in Tauri (native desktop app)
 * - Viewport width is below the mobile breakpoint (768px)
 *
 * This is used to disable desktop-specific behaviors like auto-selecting
 * the first conversation, since mobile users need to see the sidebar first.
 */

const MOBILE_BREAKPOINT = 768 // Tailwind 'md' breakpoint

/**
 * Check if running inside Tauri (desktop app)
 */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * Hook that returns true when running as mobile web/PWA.
 * Reactive - updates when viewport crosses the breakpoint.
 */
export function useIsMobileWeb(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    // On Tauri, never consider it mobile (desktop app)
    if (isTauri()) return false
    return window.innerWidth < MOBILE_BREAKPOINT
  })

  useEffect(() => {
    // Tauri apps are never considered mobile web
    if (isTauri()) return

    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    // Set initial value (handles SSR hydration)
    setIsMobile(mediaQuery.matches)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isMobile
}

/**
 * Non-reactive check for mobile web.
 * Use this in callbacks where you need the current value without subscribing to updates.
 */
export function isMobileWeb(): boolean {
  if (typeof window === 'undefined') return false
  if (isTauri()) return false
  return window.innerWidth < MOBILE_BREAKPOINT
}

/**
 * Non-reactive check for small screen (regardless of platform).
 * Returns true when viewport width is below the mobile breakpoint.
 * Use this for layout decisions that depend on screen size, not platform.
 */
export function isSmallScreen(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < MOBILE_BREAKPOINT
}
