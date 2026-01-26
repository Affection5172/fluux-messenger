import { createStore } from 'zustand/vanilla'
import type { XmppPacket } from '../core'
import { generateUUID } from '../utils/uuid'

const MAX_ENTRIES = 500
const DEFAULT_HEIGHT = 300

/**
 * Console state interface for the XMPP debug console.
 *
 * Manages the debug console visibility, height, and packet log entries.
 * Captures all incoming and outgoing XMPP stanzas for debugging purposes.
 * Entries are limited to MAX_ENTRIES (500) to prevent memory issues.
 *
 * @remarks
 * Most applications should use the `useConsole` hook instead of accessing this
 * store directly. The hook provides a cleaner API with memoized actions.
 *
 * @example Direct store access (advanced)
 * ```ts
 * import { useConsoleStore } from '@fluux/sdk'
 *
 * // Toggle console visibility
 * useConsoleStore.getState().toggle()
 *
 * // Add a packet entry (typically called by the SDK internals)
 * useConsoleStore.getState().addPacket('outgoing', '<message>...</message>')
 *
 * // Subscribe to new entries
 * useConsoleStore.subscribe(
 *   (state) => state.entries,
 *   (entries) => console.log('New entry:', entries[entries.length - 1])
 * )
 * ```
 *
 * @category Stores
 */
interface ConsoleState {
  isOpen: boolean
  height: number
  entries: XmppPacket[]

  // Actions
  toggle: () => void
  setOpen: (open: boolean) => void
  setHeight: (height: number) => void
  addPacket: (direction: 'incoming' | 'outgoing', xml: string) => void
  addEvent: (message: string, category?: 'connection' | 'error' | 'sm' | 'presence') => void
  clearEntries: () => void
  reset: () => void
}

const initialState = {
  isOpen: false,
  height: DEFAULT_HEIGHT,
  entries: [] as XmppPacket[],
}

export const consoleStore = createStore<ConsoleState>((set) => ({
  ...initialState,

  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  setOpen: (open) => set({ isOpen: open }),

  setHeight: (height) => set({ height }),

  addPacket: (direction, xml) => {
    const entry: XmppPacket = {
      id: generateUUID(),
      type: direction,
      content: xml,
      timestamp: new Date(),
    }

    set((state) => {
      const newEntries = [...state.entries, entry]
      if (newEntries.length > MAX_ENTRIES) {
        return { entries: newEntries.slice(-MAX_ENTRIES) }
      }
      return { entries: newEntries }
    })
  },

  addEvent: (message, category) => {
    const entry: XmppPacket = {
      id: generateUUID(),
      type: 'event',
      content: message,
      timestamp: new Date(),
      eventCategory: category,
    }

    set((state) => {
      const newEntries = [...state.entries, entry]
      if (newEntries.length > MAX_ENTRIES) {
        return { entries: newEntries.slice(-MAX_ENTRIES) }
      }
      return { entries: newEntries }
    })
  },

  clearEntries: () => set({ entries: [] }),

  reset: () => set(initialState),
}))

export type { ConsoleState }
