/**
 * Shared utility for creating fetchOlderHistory callbacks.
 *
 * This factory function generates the fetchOlderHistory callback used by both
 * useChat and useRoom hooks, reducing code duplication while allowing for
 * store-specific customization.
 */

import type { MAMQueryState } from '../../core/types'
import { connectionStore } from '../../stores'

/**
 * Dependencies required to create the fetchOlderHistory callback.
 */
export interface FetchOlderHistoryDeps {
  /**
   * Get the active conversation/room ID from the store.
   */
  getActiveId: () => string | null

  /**
   * Validate that the target exists and is valid for fetching.
   * Returns true if valid, false otherwise.
   */
  isValidTarget: (id: string) => boolean

  /**
   * Get the MAM query state for the target.
   */
  getMAMState: (id: string) => MAMQueryState

  /**
   * Set the MAM loading state for the target.
   */
  setMAMLoading: (id: string, isLoading: boolean) => void

  /**
   * Load older messages from IndexedDB cache.
   * Returns the loaded messages array.
   */
  loadFromCache: (id: string, limit: number) => Promise<unknown[]>

  /**
   * Get the stanza ID of the oldest message currently in memory.
   * Used as the pagination cursor when querying MAM for older messages.
   * Returns undefined if no messages exist or oldest message has no stanza ID.
   */
  getOldestMessageId: (id: string) => string | undefined

  /**
   * Query the MAM archive for older messages.
   * Called when cache is exhausted and MAM is not complete.
   */
  queryMAM: (id: string, beforeId: string) => Promise<void>

  /**
   * Error message prefix for logging.
   */
  errorLogPrefix: string
}

/**
 * Creates a fetchOlderHistory callback with the given dependencies.
 *
 * The returned function implements the cache-first-then-MAM pattern:
 * 1. Check if MAM query is already loading or complete
 * 2. Set loading state
 * 3. Try to load older messages from IndexedDB cache
 * 4. If cache is empty/exhausted, fall back to MAM query
 * 5. Always clear loading state in finally block
 *
 * @param deps - Store-specific dependencies
 * @returns The fetchOlderHistory callback function
 */
export function createFetchOlderHistory(
  deps: FetchOlderHistoryDeps
): (targetId?: string) => Promise<void> {
  const {
    getActiveId,
    isValidTarget,
    getMAMState,
    setMAMLoading,
    loadFromCache,
    getOldestMessageId,
    queryMAM,
    errorLogPrefix,
  } = deps

  return async (targetId?: string): Promise<void> => {
    // Guard: Don't attempt MAM query if not connected
    // This prevents errors when socket is dead (e.g., after sleep)
    const connectionStatus = connectionStore.getState().status
    if (connectionStatus !== 'online') return

    const id = targetId ?? getActiveId()
    if (!id) return

    // Validate target exists and is ready for fetching
    if (!isValidTarget(id)) return

    // Check MAM state - don't fetch if already loading
    const mamState = getMAMState(id)
    if (mamState.isLoading) return

    // Show loading indicator for both cache and MAM paths
    setMAMLoading(id, true)

    try {
      // First try to load older messages from IndexedDB cache
      const cachedMessages = await loadFromCache(id, 50)

      // If we got messages from cache, we're done
      if (cachedMessages.length > 0) {
        return
      }

      // Cache exhausted - fall back to MAM if not complete
      if (mamState.isHistoryComplete) return

      // Use the oldest in-memory message's stanza ID as the pagination cursor.
      // This is more reliable than mamState.oldestFetchedId because:
      // 1. The initial MAM query may have used 'start' filter to only fetch NEW messages
      // 2. We need to paginate from the actual oldest message we have, not what MAM returned
      const beforeId = getOldestMessageId(id) || ''

      // For chat MAM, we need a valid cursor to paginate backwards
      // For room MAM, empty string means "get latest" which is valid for first query
      if (!beforeId && errorLogPrefix.includes('chat')) return

      await queryMAM(id, beforeId)
    } catch (error) {
      console.error(`${errorLogPrefix}:`, error)
    } finally {
      // Always clear loading state
      setMAMLoading(id, false)
    }
  }
}
