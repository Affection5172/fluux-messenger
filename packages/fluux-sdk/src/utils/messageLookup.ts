/**
 * Creates a lookup map for messages indexed by both client ID and stanza-ID.
 *
 * This is needed because replies and corrections may reference messages by either:
 * - Client-generated message ID (e.g., "148a9d4f-68ee-4c5c-abca-685bc7981c2b")
 * - Server-assigned stanza-ID from MAM (e.g., "1766999538188692")
 *
 * XEP-0461 (Message Replies) and XEP-0308 (Last Message Correction) allow
 * the `id` attribute to reference either, so we index by both to ensure
 * lookups succeed.
 */

interface MessageWithIds {
  id: string
  stanzaId?: string
}

/**
 * Create a lookup map for messages by ID
 * @param messages Array of messages with id and optional stanzaId
 * @returns Map indexed by both id and stanzaId (when present)
 */
export function createMessageLookup<T extends MessageWithIds>(messages: T[]): Map<string, T> {
  const map = new Map<string, T>()
  for (const message of messages) {
    map.set(message.id, message)
    if (message.stanzaId) {
      map.set(message.stanzaId, message)
    }
  }
  return map
}

/**
 * Find a message by ID, checking both id and stanzaId fields.
 * Useful for corrections and replies that may reference either ID format.
 *
 * @param messages Array of messages to search
 * @param messageId The ID to search for (could be client id or stanza-id)
 * @returns The matching message or undefined
 */
export function findMessageById<T extends MessageWithIds>(
  messages: T[],
  messageId: string
): T | undefined {
  return messages.find((m) => m.id === messageId || m.stanzaId === messageId)
}
