import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useNewMessageMarker } from './useNewMessageMarker'

describe('useNewMessageMarker', () => {
  describe('marker clearing behavior', () => {
    it('should not call clearFirstNewMessageId when unmounting without switching', () => {
      const clearFirstNewMessageId = vi.fn()

      const { unmount } = renderHook(() =>
        useNewMessageMarker('conv-1', 'msg-1', clearFirstNewMessageId)
      )

      unmount()

      // Should not be called when just unmounting (no conversation switch)
      expect(clearFirstNewMessageId).not.toHaveBeenCalled()
    })

    it('should call clearFirstNewMessageId immediately when switching conversations', () => {
      const clearFirstNewMessageId = vi.fn()

      const { rerender } = renderHook(
        ({ conversationId }) =>
          useNewMessageMarker(conversationId, 'msg-1', clearFirstNewMessageId),
        { initialProps: { conversationId: 'conv-1' } }
      )

      // Switch to a different conversation
      rerender({ conversationId: 'conv-2' })

      // Should be called immediately (no delay)
      expect(clearFirstNewMessageId).toHaveBeenCalledTimes(1)
    })

    it('should not do anything when firstNewMessageId is undefined', () => {
      const clearFirstNewMessageId = vi.fn()

      const { rerender, unmount } = renderHook(
        ({ conversationId }) =>
          useNewMessageMarker(conversationId, undefined, clearFirstNewMessageId),
        { initialProps: { conversationId: 'conv-1' } }
      )

      // Switch conversations
      rerender({ conversationId: 'conv-2' })

      // Should never be called when there's no marker
      expect(clearFirstNewMessageId).not.toHaveBeenCalled()

      unmount()
    })

    it('should handle multiple conversation switches correctly', () => {
      const clearFirstNewMessageId = vi.fn()

      const { rerender } = renderHook(
        ({ conversationId, firstNewMessageId }) =>
          useNewMessageMarker(conversationId, firstNewMessageId, clearFirstNewMessageId),
        { initialProps: { conversationId: 'conv-1', firstNewMessageId: 'msg-1' } }
      )

      // Switch to conv-2 - should clear immediately
      rerender({ conversationId: 'conv-2', firstNewMessageId: 'msg-1' })
      expect(clearFirstNewMessageId).toHaveBeenCalledTimes(1)

      // Switch to conv-3 - should clear immediately
      rerender({ conversationId: 'conv-3', firstNewMessageId: 'msg-1' })
      expect(clearFirstNewMessageId).toHaveBeenCalledTimes(2)
    })
  })

  describe('marker visibility', () => {
    it('should keep marker visible while in same conversation', () => {
      const clearFirstNewMessageId = vi.fn()

      renderHook(() =>
        useNewMessageMarker('conv-1', 'msg-1', clearFirstNewMessageId)
      )

      // Marker should still be visible (not cleared) while in same conversation
      expect(clearFirstNewMessageId).not.toHaveBeenCalled()
    })

    it('should not clear marker when re-rendering with same conversation', () => {
      const clearFirstNewMessageId = vi.fn()

      const { rerender } = renderHook(
        ({ conversationId }) =>
          useNewMessageMarker(conversationId, 'msg-1', clearFirstNewMessageId),
        { initialProps: { conversationId: 'conv-1' } }
      )

      // Re-render with same conversation (simulating other state changes)
      rerender({ conversationId: 'conv-1' })
      rerender({ conversationId: 'conv-1' })
      rerender({ conversationId: 'conv-1' })

      // Should not be called when staying in same conversation
      expect(clearFirstNewMessageId).not.toHaveBeenCalled()
    })
  })
})
