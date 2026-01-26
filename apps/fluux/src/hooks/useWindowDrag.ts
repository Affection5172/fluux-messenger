import { useFullscreen } from './useFullscreen'

// Tauri detection
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

// macOS detection (for title bar overlay - only applies on macOS)
const isMacOS = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)

/**
 * Props to spread on an element to make it a window drag region in Tauri.
 * Harmless in web (data attributes are ignored).
 */
export interface DragRegionProps {
  'data-tauri-drag-region': boolean
}

/**
 * Hook that returns props to make an element a window drag region.
 * Uses data-tauri-drag-region for Tauri native dragging.
 * Also provides titleBarClass for top margin (only in Tauri on macOS, hidden in fullscreen).
 */
export function useWindowDrag() {
  const isFullscreen = useFullscreen()

  return {
    // Top margin class - only needed in Tauri on macOS for traffic light spacing
    // Windows and Linux use native title bars
    titleBarClass: isTauri && isMacOS && !isFullscreen ? 'mt-5' : '',
    // Drag region props to spread on elements (harmless in web, enables dragging in Tauri)
    dragRegionProps: {
      'data-tauri-drag-region': true,
    } as DragRegionProps,
  }
}
