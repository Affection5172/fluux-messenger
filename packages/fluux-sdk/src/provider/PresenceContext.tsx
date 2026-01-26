/**
 * PresenceContext - React context for the presence state machine actor.
 *
 * This context provides access to the XState presence actor throughout the
 * component tree. The actor is created in XMPPProvider and shared via context.
 *
 * @module Provider/PresenceContext
 * @internal
 */
import { createContext, useContext } from 'react'
import type { PresenceActor } from '../core/presenceMachine'

/**
 * Value provided by the presence context.
 */
export interface PresenceContextValue {
  /** The running presence state machine actor */
  presenceActor: PresenceActor
}

/**
 * React context for the presence actor.
 * @internal
 */
export const PresenceContext = createContext<PresenceContextValue | null>(null)

/**
 * Hook to access the presence context.
 *
 * @returns The presence context containing the actor
 * @throws Error if used outside of XMPPProvider
 * @internal
 */
export function usePresenceContext(): PresenceContextValue {
  const context = useContext(PresenceContext)
  if (!context) {
    throw new Error('usePresenceContext must be used within XMPPProvider')
  }
  return context
}
