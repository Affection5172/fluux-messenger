import { createStore } from 'zustand/vanilla'

/**
 * Blocking state interface for managing the user's blocklist (XEP-0191).
 *
 * Tracks JIDs that are blocked from communicating with the user.
 * Blocked contacts cannot send messages, see presence, or subscribe.
 *
 * @category Stores
 */
interface BlockingState {
  blockedJids: Set<string>

  // Actions
  setBlocklist: (jids: string[]) => void
  addBlockedJids: (jids: string[]) => void
  removeBlockedJids: (jids: string[]) => void
  clearBlocklist: () => void
  isBlocked: (jid: string) => boolean
  getBlockedJids: () => string[]
  reset: () => void
}

export const blockingStore = createStore<BlockingState>((set, get) => ({
  blockedJids: new Set(),

  setBlocklist: (jids) => {
    set({ blockedJids: new Set(jids) })
  },

  addBlockedJids: (jids) => {
    set((state) => {
      const newSet = new Set(state.blockedJids)
      jids.forEach(jid => newSet.add(jid))
      return { blockedJids: newSet }
    })
  },

  removeBlockedJids: (jids) => {
    set((state) => {
      const newSet = new Set(state.blockedJids)
      jids.forEach(jid => newSet.delete(jid))
      return { blockedJids: newSet }
    })
  },

  clearBlocklist: () => {
    set({ blockedJids: new Set() })
  },

  isBlocked: (jid) => get().blockedJids.has(jid),

  getBlockedJids: () => Array.from(get().blockedJids),

  reset: () => set({ blockedJids: new Set() }),
}))

export type { BlockingState }
