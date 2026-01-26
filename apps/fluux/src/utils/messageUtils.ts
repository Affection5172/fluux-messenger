import type { BaseMessage } from '@fluux/sdk'

/**
 * Find the last outgoing message that can be edited (not retracted/deleted).
 * Returns the message or undefined if none found.
 *
 * Works with any message type (chat or groupchat) by using shared fields
 * from {@link BaseMessage}.
 *
 * @param messages - Array of messages to search
 * @returns The last editable message or undefined
 */
export function findLastEditableMessage<T extends Pick<BaseMessage, 'isOutgoing' | 'isRetracted'>>(
  messages: T[]
): T | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.isOutgoing && !msg.isRetracted) {
      return msg
    }
  }
  return undefined
}

/**
 * Find the ID of the last outgoing message that can be edited (not retracted/deleted).
 * Returns the message ID or null if none found.
 *
 * Works with any message type (chat or groupchat) by using shared fields
 * from {@link BaseMessage}.
 *
 * @param messages - Array of messages to search
 * @returns The message ID or null if none found
 */
export function findLastEditableMessageId<T extends Pick<BaseMessage, 'id' | 'isOutgoing' | 'isRetracted'>>(
  messages: T[]
): string | null {
  const msg = findLastEditableMessage(messages)
  return msg?.id ?? null
}
