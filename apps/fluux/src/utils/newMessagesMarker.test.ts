import { describe, it, expect } from 'vitest'
import { findFirstNewMessageId, type MarkerMessage } from './newMessagesMarker'

describe('findFirstNewMessageId', () => {
  // Helper to create test messages
  function createMessage(
    id: string,
    timestamp: Date,
    options: { isOutgoing?: boolean; isDelayed?: boolean } = {}
  ): MarkerMessage {
    return {
      id,
      timestamp,
      isOutgoing: options.isOutgoing ?? false,
      isDelayed: options.isDelayed,
    }
  }

  describe('when lastReadAt is undefined', () => {
    it('should return null', () => {
      const messages = [
        createMessage('msg1', new Date('2025-01-15T10:00:00Z')),
        createMessage('msg2', new Date('2025-01-15T10:01:00Z')),
      ]

      expect(findFirstNewMessageId(messages, undefined)).toBeNull()
    })

    it('should return null even with messages present', () => {
      const messages = [
        createMessage('msg1', new Date('2025-01-15T10:00:00Z')),
      ]

      expect(findFirstNewMessageId(messages, undefined)).toBeNull()
    })
  })

  describe('when no messages are after lastReadAt', () => {
    it('should return null when all messages are before lastReadAt', () => {
      const lastReadAt = new Date('2025-01-15T10:30:00Z')
      const messages = [
        createMessage('msg1', new Date('2025-01-15T10:00:00Z')),
        createMessage('msg2', new Date('2025-01-15T10:15:00Z')),
      ]

      expect(findFirstNewMessageId(messages, lastReadAt)).toBeNull()
    })

    it('should return null when messages array is empty', () => {
      const lastReadAt = new Date('2025-01-15T10:30:00Z')

      expect(findFirstNewMessageId([], lastReadAt)).toBeNull()
    })

    it('should return null when message timestamp equals lastReadAt', () => {
      const lastReadAt = new Date('2025-01-15T10:30:00Z')
      const messages = [
        createMessage('msg1', new Date('2025-01-15T10:30:00Z')), // Same time
      ]

      expect(findFirstNewMessageId(messages, lastReadAt)).toBeNull()
    })
  })

  describe('when there are new incoming messages', () => {
    it('should return the first message after lastReadAt', () => {
      const lastReadAt = new Date('2025-01-15T10:00:00Z')
      const messages = [
        createMessage('msg1', new Date('2025-01-15T09:55:00Z')),
        createMessage('msg2', new Date('2025-01-15T10:05:00Z')), // First new
        createMessage('msg3', new Date('2025-01-15T10:10:00Z')),
      ]

      expect(findFirstNewMessageId(messages, lastReadAt)).toBe('msg2')
    })

    it('should return the first message when all are after lastReadAt', () => {
      const lastReadAt = new Date('2025-01-15T09:00:00Z')
      const messages = [
        createMessage('msg1', new Date('2025-01-15T10:00:00Z')),
        createMessage('msg2', new Date('2025-01-15T10:05:00Z')),
      ]

      expect(findFirstNewMessageId(messages, lastReadAt)).toBe('msg1')
    })

    it('should work with epoch lastReadAt (Date(0))', () => {
      const lastReadAt = new Date(0) // Epoch - all messages should be "new"
      const messages = [
        createMessage('msg1', new Date('2025-01-15T10:00:00Z')),
        createMessage('msg2', new Date('2025-01-15T10:05:00Z')),
      ]

      expect(findFirstNewMessageId(messages, lastReadAt)).toBe('msg1')
    })
  })

  describe('when filtering out outgoing messages', () => {
    it('should skip outgoing messages and return first incoming message', () => {
      const lastReadAt = new Date('2025-01-15T10:00:00Z')
      const messages = [
        createMessage('msg1', new Date('2025-01-15T10:05:00Z'), { isOutgoing: true }),
        createMessage('msg2', new Date('2025-01-15T10:10:00Z'), { isOutgoing: true }),
        createMessage('msg3', new Date('2025-01-15T10:15:00Z')), // First incoming
      ]

      expect(findFirstNewMessageId(messages, lastReadAt)).toBe('msg3')
    })

    it('should return null when all new messages are outgoing', () => {
      const lastReadAt = new Date('2025-01-15T10:00:00Z')
      const messages = [
        createMessage('msg1', new Date('2025-01-15T09:55:00Z')), // Before lastReadAt
        createMessage('msg2', new Date('2025-01-15T10:05:00Z'), { isOutgoing: true }),
        createMessage('msg3', new Date('2025-01-15T10:10:00Z'), { isOutgoing: true }),
      ]

      expect(findFirstNewMessageId(messages, lastReadAt)).toBeNull()
    })

    it('should handle mixed outgoing and incoming messages', () => {
      const lastReadAt = new Date('2025-01-15T10:00:00Z')
      const messages = [
        createMessage('msg1', new Date('2025-01-15T10:01:00Z'), { isOutgoing: true }),
        createMessage('msg2', new Date('2025-01-15T10:02:00Z')), // First incoming after lastReadAt
        createMessage('msg3', new Date('2025-01-15T10:03:00Z'), { isOutgoing: true }),
        createMessage('msg4', new Date('2025-01-15T10:04:00Z')),
      ]

      expect(findFirstNewMessageId(messages, lastReadAt)).toBe('msg2')
    })
  })

  describe('when filtering out delayed messages', () => {
    it('should skip delayed messages and return first non-delayed message', () => {
      const lastReadAt = new Date('2025-01-15T10:00:00Z')
      const messages = [
        createMessage('msg1', new Date('2025-01-15T10:05:00Z'), { isDelayed: true }),
        createMessage('msg2', new Date('2025-01-15T10:10:00Z'), { isDelayed: true }),
        createMessage('msg3', new Date('2025-01-15T10:15:00Z')), // First non-delayed
      ]

      expect(findFirstNewMessageId(messages, lastReadAt)).toBe('msg3')
    })

    it('should return null when all new messages are delayed', () => {
      const lastReadAt = new Date('2025-01-15T10:00:00Z')
      const messages = [
        createMessage('msg1', new Date('2025-01-15T10:05:00Z'), { isDelayed: true }),
        createMessage('msg2', new Date('2025-01-15T10:10:00Z'), { isDelayed: true }),
      ]

      expect(findFirstNewMessageId(messages, lastReadAt)).toBeNull()
    })

    it('should treat isDelayed: false same as undefined', () => {
      const lastReadAt = new Date('2025-01-15T10:00:00Z')
      const messages = [
        createMessage('msg1', new Date('2025-01-15T10:05:00Z'), { isDelayed: false }),
      ]

      // isDelayed: false is falsy, so message should be found
      expect(findFirstNewMessageId(messages, lastReadAt)).toBe('msg1')
    })
  })

  describe('when combining all filters', () => {
    it('should skip both outgoing and delayed messages', () => {
      const lastReadAt = new Date('2025-01-15T10:00:00Z')
      const messages = [
        createMessage('msg1', new Date('2025-01-15T10:01:00Z'), { isOutgoing: true }),
        createMessage('msg2', new Date('2025-01-15T10:02:00Z'), { isDelayed: true }),
        createMessage('msg3', new Date('2025-01-15T10:03:00Z'), { isOutgoing: true, isDelayed: true }),
        createMessage('msg4', new Date('2025-01-15T10:04:00Z')), // First valid
      ]

      expect(findFirstNewMessageId(messages, lastReadAt)).toBe('msg4')
    })

    it('should return null when all new messages are filtered out', () => {
      const lastReadAt = new Date('2025-01-15T10:00:00Z')
      const messages = [
        createMessage('msg1', new Date('2025-01-15T09:55:00Z')), // Before lastReadAt
        createMessage('msg2', new Date('2025-01-15T10:01:00Z'), { isOutgoing: true }),
        createMessage('msg3', new Date('2025-01-15T10:02:00Z'), { isDelayed: true }),
      ]

      expect(findFirstNewMessageId(messages, lastReadAt)).toBeNull()
    })

    it('should handle complex real-world scenario', () => {
      const lastReadAt = new Date('2025-01-15T10:00:00Z')
      const messages = [
        // Before lastReadAt - ignored
        createMessage('old1', new Date('2025-01-15T09:50:00Z')),
        createMessage('old2', new Date('2025-01-15T09:55:00Z')),
        // After lastReadAt
        createMessage('delayed1', new Date('2025-01-15T10:01:00Z'), { isDelayed: true }),
        createMessage('outgoing1', new Date('2025-01-15T10:02:00Z'), { isOutgoing: true }),
        createMessage('delayed2', new Date('2025-01-15T10:03:00Z'), { isDelayed: true }),
        createMessage('new1', new Date('2025-01-15T10:04:00Z')), // First valid new message
        createMessage('outgoing2', new Date('2025-01-15T10:05:00Z'), { isOutgoing: true }),
        createMessage('new2', new Date('2025-01-15T10:06:00Z')),
      ]

      expect(findFirstNewMessageId(messages, lastReadAt)).toBe('new1')
    })
  })

  describe('edge cases', () => {
    it('should handle single message that qualifies', () => {
      const lastReadAt = new Date('2025-01-15T10:00:00Z')
      const messages = [
        createMessage('msg1', new Date('2025-01-15T10:05:00Z')),
      ]

      expect(findFirstNewMessageId(messages, lastReadAt)).toBe('msg1')
    })

    it('should handle millisecond precision timestamps', () => {
      const lastReadAt = new Date('2025-01-15T10:00:00.500Z')
      const messages = [
        createMessage('msg1', new Date('2025-01-15T10:00:00.499Z')), // Before
        createMessage('msg2', new Date('2025-01-15T10:00:00.500Z')), // Equal - not new
        createMessage('msg3', new Date('2025-01-15T10:00:00.501Z')), // After - new
      ]

      expect(findFirstNewMessageId(messages, lastReadAt)).toBe('msg3')
    })

    it('should work with very old lastReadAt', () => {
      const lastReadAt = new Date('2020-01-01T00:00:00Z')
      const messages = [
        createMessage('msg1', new Date('2025-01-15T10:00:00Z')),
      ]

      expect(findFirstNewMessageId(messages, lastReadAt)).toBe('msg1')
    })
  })
})
