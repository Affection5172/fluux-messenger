import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEffect, useRef } from 'react'

/**
 * These tests verify the new message marker clearing behavior:
 * - Marker stays visible while user stays in the same conversation
 * - Marker is cleared 1 second after switching to a different conversation
 * - Returning to the conversation within 1 second prevents clearing
 *
 * The implementation uses a ref to track the current conversation and
 * a cleanup effect with setTimeout to delay clearing.
 */

// Props type for the hook - explicitly typed to allow undefined
interface MarkerClearingProps {
  conversationId: string
  firstNewMessageId: string | undefined
}

// Extract the marker clearing logic into a testable hook
function useMarkerClearing(
  conversationId: string,
  firstNewMessageId: string | undefined,
  clearFirstNewMessageId: () => void
) {
  // Track conversation ID to detect when user switches away
  const currentConversationRef = useRef(conversationId)
  currentConversationRef.current = conversationId

  // Clear the new message marker 1 second after switching away from conversation
  useEffect(() => {
    if (!firstNewMessageId) return

    const markerConversationId = conversationId

    return () => {
      // Only clear if we actually switched away (conversation changed)
      setTimeout(() => {
        // If we're still in a different conversation, clear the marker
        if (currentConversationRef.current !== markerConversationId) {
          clearFirstNewMessageId()
        }
      }, 1000)
    }
  }, [conversationId, firstNewMessageId, clearFirstNewMessageId])
}

describe('New Message Marker Clearing Behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('when staying in the same conversation', () => {
    it('should NOT clear the marker when conversationId stays the same', () => {
      const clearFirstNewMessageId = vi.fn()

      const { rerender } = renderHook<void, MarkerClearingProps>(
        ({ conversationId, firstNewMessageId }) =>
          useMarkerClearing(conversationId, firstNewMessageId, clearFirstNewMessageId),
        {
          initialProps: {
            conversationId: 'alice@example.com',
            firstNewMessageId: 'msg-123',
          },
        }
      )

      // Re-render with same conversationId (simulating other state changes)
      rerender({
        conversationId: 'alice@example.com',
        firstNewMessageId: 'msg-123',
      })

      // Advance timers past the 1 second delay
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // Marker should NOT be cleared - we stayed in the same conversation
      expect(clearFirstNewMessageId).not.toHaveBeenCalled()
    })

    it('should NOT clear when firstNewMessageId changes within same conversation', () => {
      const clearFirstNewMessageId = vi.fn()

      const { rerender } = renderHook<void, MarkerClearingProps>(
        ({ conversationId, firstNewMessageId }) =>
          useMarkerClearing(conversationId, firstNewMessageId, clearFirstNewMessageId),
        {
          initialProps: {
            conversationId: 'alice@example.com',
            firstNewMessageId: 'msg-123',
          },
        }
      )

      // firstNewMessageId changes but conversationId stays the same
      rerender({
        conversationId: 'alice@example.com',
        firstNewMessageId: 'msg-456',
      })

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // The cleanup runs but the ref check should prevent clearing
      // because currentConversationRef.current === markerConversationId
      expect(clearFirstNewMessageId).not.toHaveBeenCalled()
    })
  })

  describe('when switching to a different conversation', () => {
    it('should clear the marker 1 second after switching away', () => {
      const clearFirstNewMessageId = vi.fn()

      const { rerender } = renderHook<void, MarkerClearingProps>(
        ({ conversationId, firstNewMessageId }) =>
          useMarkerClearing(conversationId, firstNewMessageId, clearFirstNewMessageId),
        {
          initialProps: {
            conversationId: 'alice@example.com',
            firstNewMessageId: 'msg-123',
          },
        }
      )

      // Switch to a different conversation
      rerender({
        conversationId: 'bob@example.com',
        firstNewMessageId: undefined,
      })

      // Should not clear immediately
      expect(clearFirstNewMessageId).not.toHaveBeenCalled()

      // Advance time by 500ms - still should not clear
      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(clearFirstNewMessageId).not.toHaveBeenCalled()

      // Advance remaining 500ms to complete the 1 second delay
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // NOW the marker should be cleared
      expect(clearFirstNewMessageId).toHaveBeenCalledTimes(1)
    })

    it('should clear marker even when new conversation has its own marker', () => {
      const clearFirstNewMessageId = vi.fn()

      const { rerender } = renderHook<void, MarkerClearingProps>(
        ({ conversationId, firstNewMessageId }) =>
          useMarkerClearing(conversationId, firstNewMessageId, clearFirstNewMessageId),
        {
          initialProps: {
            conversationId: 'alice@example.com',
            firstNewMessageId: 'msg-alice-123',
          },
        }
      )

      // Switch to bob's conversation which also has a marker
      rerender({
        conversationId: 'bob@example.com',
        firstNewMessageId: 'msg-bob-456',
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Alice's marker should be cleared
      expect(clearFirstNewMessageId).toHaveBeenCalledTimes(1)
    })
  })

  describe('when returning to conversation within 1 second', () => {
    it('should NOT clear marker if returning before timeout', () => {
      const clearFirstNewMessageId = vi.fn()

      const { rerender } = renderHook<void, MarkerClearingProps>(
        ({ conversationId, firstNewMessageId }) =>
          useMarkerClearing(conversationId, firstNewMessageId, clearFirstNewMessageId),
        {
          initialProps: {
            conversationId: 'alice@example.com',
            firstNewMessageId: 'msg-123',
          },
        }
      )

      // Switch away
      rerender({
        conversationId: 'bob@example.com',
        firstNewMessageId: undefined,
      })

      // Wait 500ms (less than the 1 second delay)
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // Return to original conversation BEFORE the 1 second timeout
      rerender({
        conversationId: 'alice@example.com',
        firstNewMessageId: 'msg-123',
      })

      // Wait for the remaining time and more
      act(() => {
        vi.advanceTimersByTime(1500)
      })

      // Marker should NOT be cleared because we returned in time
      // The ref now points to alice@example.com, which matches markerConversationId
      expect(clearFirstNewMessageId).not.toHaveBeenCalled()
    })

    it('should NOT clear marker if returning exactly at 1 second', () => {
      const clearFirstNewMessageId = vi.fn()

      const { rerender } = renderHook<void, MarkerClearingProps>(
        ({ conversationId, firstNewMessageId }) =>
          useMarkerClearing(conversationId, firstNewMessageId, clearFirstNewMessageId),
        {
          initialProps: {
            conversationId: 'alice@example.com',
            firstNewMessageId: 'msg-123',
          },
        }
      )

      // Switch away
      rerender({
        conversationId: 'bob@example.com',
        firstNewMessageId: undefined,
      })

      // Wait 999ms
      act(() => {
        vi.advanceTimersByTime(999)
      })

      // Return at the last moment
      rerender({
        conversationId: 'alice@example.com',
        firstNewMessageId: 'msg-123',
      })

      // Now let the timeout fire
      act(() => {
        vi.advanceTimersByTime(10)
      })

      // Should NOT clear - ref was updated before timeout callback ran
      expect(clearFirstNewMessageId).not.toHaveBeenCalled()
    })
  })

  describe('when no marker exists', () => {
    it('should not set up cleanup when firstNewMessageId is undefined', () => {
      const clearFirstNewMessageId = vi.fn()

      const { rerender } = renderHook<void, MarkerClearingProps>(
        ({ conversationId, firstNewMessageId }) =>
          useMarkerClearing(conversationId, firstNewMessageId, clearFirstNewMessageId),
        {
          initialProps: {
            conversationId: 'alice@example.com',
            firstNewMessageId: undefined,
          },
        }
      )

      // Switch conversations
      rerender({
        conversationId: 'bob@example.com',
        firstNewMessageId: undefined,
      })

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // No cleanup should run because firstNewMessageId was undefined
      expect(clearFirstNewMessageId).not.toHaveBeenCalled()
    })

    it('should not clear when marker is removed before switching', () => {
      const clearFirstNewMessageId = vi.fn()

      const { rerender } = renderHook<void, MarkerClearingProps>(
        ({ conversationId, firstNewMessageId }) =>
          useMarkerClearing(conversationId, firstNewMessageId, clearFirstNewMessageId),
        {
          initialProps: {
            conversationId: 'alice@example.com',
            firstNewMessageId: 'msg-123',
          },
        }
      )

      // Marker is cleared (e.g., user scrolled past it or read messages)
      rerender({
        conversationId: 'alice@example.com',
        firstNewMessageId: undefined,
      })

      // The effect cleanup runs because firstNewMessageId changed
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // But we're still in the same conversation, so it shouldn't clear again
      // (actually the cleanup was registered when msg-123 was present,
      // and it will fire, but we're still in alice's conversation)
      expect(clearFirstNewMessageId).not.toHaveBeenCalled()
    })
  })

  describe('multiple rapid conversation switches', () => {
    it('should only clear markers for conversations actually left', () => {
      const clearFirstNewMessageId = vi.fn()

      const { rerender } = renderHook<void, MarkerClearingProps>(
        ({ conversationId, firstNewMessageId }) =>
          useMarkerClearing(conversationId, firstNewMessageId, clearFirstNewMessageId),
        {
          initialProps: {
            conversationId: 'alice@example.com',
            firstNewMessageId: 'msg-alice',
          },
        }
      )

      // Rapid switches: alice -> bob -> charlie -> alice
      rerender({ conversationId: 'bob@example.com', firstNewMessageId: undefined })
      act(() => { vi.advanceTimersByTime(100) })

      rerender({ conversationId: 'charlie@example.com', firstNewMessageId: undefined })
      act(() => { vi.advanceTimersByTime(100) })

      rerender({ conversationId: 'alice@example.com', firstNewMessageId: 'msg-alice' })
      act(() => { vi.advanceTimersByTime(100) })

      // Wait for all timeouts to complete
      act(() => { vi.advanceTimersByTime(2000) })

      // Alice's marker should NOT be cleared because we returned to her conversation
      // The ref points to alice, so the setTimeout check passes
      expect(clearFirstNewMessageId).not.toHaveBeenCalled()
    })

    it('should clear marker when ending on different conversation', () => {
      const clearFirstNewMessageId = vi.fn()

      const { rerender } = renderHook<void, MarkerClearingProps>(
        ({ conversationId, firstNewMessageId }) =>
          useMarkerClearing(conversationId, firstNewMessageId, clearFirstNewMessageId),
        {
          initialProps: {
            conversationId: 'alice@example.com',
            firstNewMessageId: 'msg-alice',
          },
        }
      )

      // alice -> bob -> charlie (stay on charlie)
      rerender({ conversationId: 'bob@example.com', firstNewMessageId: undefined })
      rerender({ conversationId: 'charlie@example.com', firstNewMessageId: undefined })

      act(() => { vi.advanceTimersByTime(2000) })

      // Alice's marker should be cleared because we ended on charlie
      expect(clearFirstNewMessageId).toHaveBeenCalledTimes(1)
    })
  })

  describe('component unmount', () => {
    it('should trigger cleanup on unmount', () => {
      const clearFirstNewMessageId = vi.fn()

      const { unmount } = renderHook<void, MarkerClearingProps>(
        ({ conversationId, firstNewMessageId }) =>
          useMarkerClearing(conversationId, firstNewMessageId, clearFirstNewMessageId),
        {
          initialProps: {
            conversationId: 'alice@example.com',
            firstNewMessageId: 'msg-123',
          },
        }
      )

      // Unmount the component
      unmount()

      // The cleanup should schedule a timeout
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Since the component unmounted, the ref is no longer being updated
      // The marker will be cleared because currentConversationRef.current
      // (still 'alice@example.com') !== markerConversationId ('alice@example.com')
      // Actually, they ARE equal, so it should NOT clear
      // Wait - on unmount, the ref is not updated, so they should still match
      expect(clearFirstNewMessageId).not.toHaveBeenCalled()
    })
  })
})
