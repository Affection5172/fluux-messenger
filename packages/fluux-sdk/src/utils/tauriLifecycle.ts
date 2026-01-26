/**
 * Tauri Application Lifecycle Utilities
 *
 * Provides utilities for handling app close/shutdown in Tauri desktop applications.
 * These are separated from XMPPProvider to keep the SDK provider thin and allow
 * apps to customize their shutdown behavior.
 *
 * @packageDocumentation
 * @module Utils/TauriLifecycle
 */

import type { XMPPClient } from '../core/XMPPClient'

/**
 * Options for setting up Tauri app close handlers.
 */
export interface TauriCloseHandlerOptions {
  /** The XMPPClient instance to disconnect on close */
  client: XMPPClient
  /** Optional callback before disconnect */
  onBeforeDisconnect?: () => Promise<void> | void
  /** Optional callback after disconnect */
  onAfterDisconnect?: () => Promise<void> | void
}

/**
 * Set up Tauri app close handlers for graceful XMPP disconnect.
 *
 * This function handles:
 * - macOS Command-Q (graceful-shutdown event)
 * - Windows/Linux close button (onCloseRequested)
 *
 * @param options - Configuration options
 * @returns Cleanup function to remove listeners
 *
 * @example
 * ```typescript
 * import { setupTauriCloseHandlers } from '@fluux/sdk'
 *
 * // In your app initialization
 * useEffect(() => {
 *   const cleanup = setupTauriCloseHandlers({ client })
 *   return cleanup
 * }, [client])
 * ```
 *
 * @remarks
 * This function is a no-op in non-Tauri environments (web browsers).
 * It's safe to call unconditionally.
 */
export function setupTauriCloseHandlers(options: TauriCloseHandlerOptions): () => void {
  const { client, onBeforeDisconnect, onAfterDisconnect } = options

  let unlistenTauri: (() => void) | null = null
  let unlistenShutdown: (() => void) | null = null
  let isClosing = false

  const setup = async () => {
    try {
      // Dynamic import to avoid issues in non-Tauri environments
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const { listen } = await import('@tauri-apps/api/event')
      const { invoke } = await import('@tauri-apps/api/core')
      const currentWindow = getCurrentWindow()

      const isMacOS = navigator.platform.toLowerCase().includes('mac')

      // Listen for graceful shutdown event (macOS Command-Q)
      if (isMacOS) {
        unlistenShutdown = await listen('graceful-shutdown', async () => {
          if (isClosing) return
          isClosing = true

          await onBeforeDisconnect?.()
          await client.disconnect()
          await onAfterDisconnect?.()
          await invoke('exit_app')
        })
      } else {
        // Windows/Linux: Handle close button
        unlistenTauri = await currentWindow.onCloseRequested(async (event) => {
          if (isClosing) return
          isClosing = true
          event.preventDefault()

          await onBeforeDisconnect?.()
          await client.disconnect()
          await onAfterDisconnect?.()
          await currentWindow.destroy()
        })
      }
    } catch {
      // Not in Tauri environment, ignore
    }
  }

  void setup()

  return () => {
    unlistenTauri?.()
    unlistenShutdown?.()
  }
}
