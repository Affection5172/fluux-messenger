import { describe, it, expect } from 'vitest'
import { findLastEditableMessage, findLastEditableMessageId } from './messageUtils'

// Minimal message type for testing
interface TestMessage {
  id: string
  isOutgoing: boolean
  isRetracted?: boolean
}

describe('messageUtils', () => {
  describe('findLastEditableMessage', () => {
    it('should return the last outgoing message', () => {
      const messages: TestMessage[] = [
        { id: '1', isOutgoing: false },
        { id: '2', isOutgoing: true },
        { id: '3', isOutgoing: false },
      ]

      const result = findLastEditableMessage(messages)
      expect(result?.id).toBe('2')
    })

    it('should skip retracted messages', () => {
      const messages: TestMessage[] = [
        { id: '1', isOutgoing: true },
        { id: '2', isOutgoing: true, isRetracted: true },
        { id: '3', isOutgoing: false },
      ]

      const result = findLastEditableMessage(messages)
      expect(result?.id).toBe('1')
    })

    it('should return the last non-retracted outgoing message', () => {
      const messages: TestMessage[] = [
        { id: '1', isOutgoing: true },
        { id: '2', isOutgoing: true },
        { id: '3', isOutgoing: true, isRetracted: true },
      ]

      const result = findLastEditableMessage(messages)
      expect(result?.id).toBe('2')
    })

    it('should return undefined when all outgoing messages are retracted', () => {
      const messages: TestMessage[] = [
        { id: '1', isOutgoing: true, isRetracted: true },
        { id: '2', isOutgoing: true, isRetracted: true },
        { id: '3', isOutgoing: false },
      ]

      const result = findLastEditableMessage(messages)
      expect(result).toBeUndefined()
    })

    it('should return undefined when no outgoing messages exist', () => {
      const messages: TestMessage[] = [
        { id: '1', isOutgoing: false },
        { id: '2', isOutgoing: false },
      ]

      const result = findLastEditableMessage(messages)
      expect(result).toBeUndefined()
    })

    it('should return undefined for empty messages array', () => {
      const result = findLastEditableMessage([])
      expect(result).toBeUndefined()
    })

    it('should treat isRetracted: false same as undefined', () => {
      const messages: TestMessage[] = [
        { id: '1', isOutgoing: true },
        { id: '2', isOutgoing: true, isRetracted: false },
      ]

      const result = findLastEditableMessage(messages)
      expect(result?.id).toBe('2')
    })

    it('should handle mixed scenario with multiple retracted messages', () => {
      const messages: TestMessage[] = [
        { id: '1', isOutgoing: true },                      // editable
        { id: '2', isOutgoing: false },                     // incoming
        { id: '3', isOutgoing: true, isRetracted: true },   // retracted
        { id: '4', isOutgoing: true },                      // editable - should be returned
        { id: '5', isOutgoing: true, isRetracted: true },   // retracted
        { id: '6', isOutgoing: false },                     // incoming
      ]

      const result = findLastEditableMessage(messages)
      expect(result?.id).toBe('4')
    })
  })

  describe('findLastEditableMessageId', () => {
    it('should return the ID of the last editable message', () => {
      const messages: TestMessage[] = [
        { id: 'msg-1', isOutgoing: true },
        { id: 'msg-2', isOutgoing: true },
      ]

      const result = findLastEditableMessageId(messages)
      expect(result).toBe('msg-2')
    })

    it('should return null when no editable message exists', () => {
      const messages: TestMessage[] = [
        { id: 'msg-1', isOutgoing: false },
        { id: 'msg-2', isOutgoing: true, isRetracted: true },
      ]

      const result = findLastEditableMessageId(messages)
      expect(result).toBeNull()
    })

    it('should return null for empty array', () => {
      const result = findLastEditableMessageId([])
      expect(result).toBeNull()
    })

    it('should skip retracted messages and return previous editable one', () => {
      const messages: TestMessage[] = [
        { id: 'msg-1', isOutgoing: true },
        { id: 'msg-2', isOutgoing: true, isRetracted: true },
        { id: 'msg-3', isOutgoing: true, isRetracted: true },
      ]

      const result = findLastEditableMessageId(messages)
      expect(result).toBe('msg-1')
    })
  })
})
