/**
 * Typing indicator timeout management
 *
 * XEP-0085 chat states can get stuck if the "paused" notification is lost.
 * This module provides auto-timeout functionality to clear stale typing indicators.
 */

// Default timeout: 30 seconds (reasonable for missed paused notifications)
export const TYPING_TIMEOUT_MS = 30_000

// Timer storage (module-level, not in zustand state since timers aren't serializable)
// Key format: "conversationId:jid" for 1:1 chats, "roomJid:nick" for MUC
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Creates a typing timeout key from identifiers
 */
function makeKey(contextId: string, userId: string): string {
  return `${contextId}:${userId}`
}

/**
 * Sets or resets a typing timeout. When the timeout fires, clearCallback is invoked.
 * Call this when receiving a "composing" chat state.
 *
 * @param contextId - Conversation ID (1:1) or room JID (MUC)
 * @param userId - JID (1:1) or nickname (MUC)
 * @param clearCallback - Function to call when timeout expires (should clear typing state)
 */
export function setTypingTimeout(
  contextId: string,
  userId: string,
  clearCallback: () => void
): void {
  const key = makeKey(contextId, userId)

  // Clear any existing timer for this user
  const existingTimer = typingTimers.get(key)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  // Set new timer
  const timer = setTimeout(() => {
    typingTimers.delete(key)
    clearCallback()
  }, TYPING_TIMEOUT_MS)

  typingTimers.set(key, timer)
}

/**
 * Clears a typing timeout. Call this when receiving "paused", "active", etc.
 * or when user sends a message.
 *
 * @param contextId - Conversation ID (1:1) or room JID (MUC)
 * @param userId - JID (1:1) or nickname (MUC)
 */
export function clearTypingTimeout(contextId: string, userId: string): void {
  const key = makeKey(contextId, userId)
  const timer = typingTimers.get(key)
  if (timer) {
    clearTimeout(timer)
    typingTimers.delete(key)
  }
}

/**
 * Clears all typing timeouts. Call this on disconnect/reset.
 */
export function clearAllTypingTimeouts(): void {
  for (const timer of typingTimers.values()) {
    clearTimeout(timer)
  }
  typingTimers.clear()
}
