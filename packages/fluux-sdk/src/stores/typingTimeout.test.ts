import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  setTypingTimeout,
  clearTypingTimeout,
  clearAllTypingTimeouts,
  TYPING_TIMEOUT_MS,
} from './typingTimeout'

describe('typingTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearAllTypingTimeouts()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('setTypingTimeout', () => {
    it('should call clearCallback after timeout expires', () => {
      const callback = vi.fn()
      setTypingTimeout('conv1', 'user@example.com', callback)

      expect(callback).not.toHaveBeenCalled()

      // Advance time just before timeout
      vi.advanceTimersByTime(TYPING_TIMEOUT_MS - 1)
      expect(callback).not.toHaveBeenCalled()

      // Advance past timeout
      vi.advanceTimersByTime(2)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should reset timeout when called again for same user', () => {
      const callback = vi.fn()
      setTypingTimeout('conv1', 'user@example.com', callback)

      // Advance halfway
      vi.advanceTimersByTime(TYPING_TIMEOUT_MS / 2)
      expect(callback).not.toHaveBeenCalled()

      // Reset timeout (user still typing)
      setTypingTimeout('conv1', 'user@example.com', callback)

      // Original timeout would have fired, but shouldn't since it was reset
      vi.advanceTimersByTime(TYPING_TIMEOUT_MS / 2 + 1)
      expect(callback).not.toHaveBeenCalled()

      // New timeout should fire after full duration from reset
      vi.advanceTimersByTime(TYPING_TIMEOUT_MS / 2)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple users independently', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      setTypingTimeout('conv1', 'user1@example.com', callback1)
      vi.advanceTimersByTime(10000)
      setTypingTimeout('conv1', 'user2@example.com', callback2)

      // First user's timeout fires
      vi.advanceTimersByTime(TYPING_TIMEOUT_MS - 10000)
      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).not.toHaveBeenCalled()

      // Second user's timeout fires
      vi.advanceTimersByTime(10000)
      expect(callback2).toHaveBeenCalledTimes(1)
    })

    it('should handle different conversations independently', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      setTypingTimeout('conv1', 'user@example.com', callback1)
      setTypingTimeout('conv2', 'user@example.com', callback2)

      vi.advanceTimersByTime(TYPING_TIMEOUT_MS + 1)

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })
  })

  describe('clearTypingTimeout', () => {
    it('should cancel timeout before it fires', () => {
      const callback = vi.fn()
      setTypingTimeout('conv1', 'user@example.com', callback)

      vi.advanceTimersByTime(TYPING_TIMEOUT_MS / 2)
      clearTypingTimeout('conv1', 'user@example.com')

      vi.advanceTimersByTime(TYPING_TIMEOUT_MS)
      expect(callback).not.toHaveBeenCalled()
    })

    it('should handle clearing non-existent timeout gracefully', () => {
      // Should not throw
      expect(() => {
        clearTypingTimeout('conv1', 'nonexistent@example.com')
      }).not.toThrow()
    })
  })

  describe('clearAllTypingTimeouts', () => {
    it('should cancel all pending timeouts', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()

      setTypingTimeout('conv1', 'user1@example.com', callback1)
      setTypingTimeout('conv1', 'user2@example.com', callback2)
      setTypingTimeout('conv2', 'user1@example.com', callback3)

      clearAllTypingTimeouts()

      vi.advanceTimersByTime(TYPING_TIMEOUT_MS + 1)

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
      expect(callback3).not.toHaveBeenCalled()
    })
  })

  describe('TYPING_TIMEOUT_MS constant', () => {
    it('should be 30 seconds', () => {
      expect(TYPING_TIMEOUT_MS).toBe(30_000)
    })
  })
})
