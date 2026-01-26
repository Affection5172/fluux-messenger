import { useEffect } from 'react'
import { connectionStore } from '@fluux/sdk'

/**
 * Hook to track window visibility and update the SDK store.
 *
 * When the window is not visible (e.g., user switched to another app),
 * new messages in the active conversation will show the "new messages"
 * marker when the user returns.
 *
 * This hook is intentionally minimal and doesn't return any values
 * to avoid causing re-renders.
 */
export function useWindowVisibility(): void {
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Update store directly without going through React state
      connectionStore.getState().setWindowVisible(!document.hidden)
    }

    // Set initial state
    handleVisibilityChange()

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}
