/**
 * Platform Detection
 *
 * Detects the runtime platform to customize client identification.
 * Supports: web browser, Tauri desktop, Tauri mobile
 */

export type Platform = 'web' | 'desktop' | 'mobile'

let cachedPlatform: Platform | null = null

/**
 * Check if running in Tauri (v2 uses __TAURI_INTERNALS__)
 */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * Detect the current platform.
 * Results are cached after first detection.
 */
export async function detectPlatform(): Promise<Platform> {
  if (cachedPlatform) {
    return cachedPlatform
  }

  // Check if running in Tauri
  if (isTauri()) {
    try {
      // Dynamic import using variable to prevent static analysis
      // This prevents bundlers from trying to resolve the module at build time
      const tauriOsModule = '@tauri-apps/plugin-os'
      const { type } = await import(/* @vite-ignore */ tauriOsModule)
      const osType = await type()

      // iOS and Android are mobile platforms
      if (osType === 'ios' || osType === 'android') {
        cachedPlatform = 'mobile'
      } else {
        // Windows, macOS, Linux are desktop platforms
        cachedPlatform = 'desktop'
      }
    } catch {
      // Fallback to desktop if Tauri API fails
      cachedPlatform = 'desktop'
    }
  } else {
    // No Tauri = web browser
    cachedPlatform = 'web'
  }

  return cachedPlatform
}

/**
 * Get the cached platform synchronously.
 * If detectPlatform() hasn't been called yet, uses synchronous detection.
 * Falls back to 'desktop' for Tauri (async OS check only needed for mobile distinction).
 */
export function getCachedPlatform(): Platform | null {
  if (cachedPlatform) {
    return cachedPlatform
  }

  // Synchronous fallback: if Tauri detected, assume desktop
  // (The async detectPlatform is only needed to distinguish mobile vs desktop)
  if (isTauri()) {
    return 'desktop'
  }

  return null
}

/**
 * Get the caps node URL for the current platform.
 */
export function getCapsNodeForPlatform(platform: Platform): string {
  switch (platform) {
    case 'mobile':
      return 'https://fluux.io/mobile'
    case 'desktop':
      return 'https://fluux.io/desktop'
    case 'web':
    default:
      return 'https://fluux.io/web'
  }
}

/**
 * Get the client identity name for the current platform.
 */
export function getClientNameForPlatform(platform: Platform): string {
  switch (platform) {
    case 'mobile':
      return 'Fluux Mobile'
    case 'desktop':
      return 'Fluux Desktop'
    case 'web':
    default:
      return 'Fluux Web'
  }
}
