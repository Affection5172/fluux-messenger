import { useRef, useEffect } from 'react'

/**
 * Hook for managing the "new messages" marker in message lists.
 *
 * The marker shows the first unread message when you return to a conversation.
 * It stays visible while viewing the conversation, but clears immediately
 * when switching to a different conversation.
 *
 * @param conversationId - The current conversation/room ID
 * @param firstNewMessageId - The ID of the first new message (or undefined)
 * @param clearFirstNewMessageId - Function to clear the marker
 */
export function useNewMessageMarker(
  conversationId: string,
  firstNewMessageId: string | undefined,
  clearFirstNewMessageId: () => void
): void {
  // Track conversation ID to detect when user switches away
  const currentConversationRef = useRef(conversationId)
  currentConversationRef.current = conversationId

  // Clear the new message marker immediately when switching away
  useEffect(() => {
    if (!firstNewMessageId) return

    const markerConversationId = conversationId

    return () => {
      // Clear marker immediately when switching to a different conversation
      if (currentConversationRef.current !== markerConversationId) {
        clearFirstNewMessageId()
      }
    }
  }, [conversationId, firstNewMessageId, clearFirstNewMessageId])
}
