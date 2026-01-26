import { describe, it, expect } from 'vitest'
import { createMessageLookup, findMessageById } from './messageLookup'

describe('createMessageLookup', () => {
  it('should index messages by client id', () => {
    const messages = [
      { id: 'msg-1', body: 'Hello' },
      { id: 'msg-2', body: 'World' },
    ]

    const lookup = createMessageLookup(messages)

    expect(lookup.get('msg-1')).toEqual(messages[0])
    expect(lookup.get('msg-2')).toEqual(messages[1])
  })

  it('should index messages by stanza-id when present', () => {
    const messages = [
      { id: 'client-id-1', stanzaId: '1766999538188692', body: 'Hello' },
      { id: 'client-id-2', body: 'No stanza-id' },
    ]

    const lookup = createMessageLookup(messages)

    // Can find by client id
    expect(lookup.get('client-id-1')).toEqual(messages[0])
    // Can also find by stanza-id
    expect(lookup.get('1766999538188692')).toEqual(messages[0])
    // Message without stanza-id only findable by client id
    expect(lookup.get('client-id-2')).toEqual(messages[1])
  })

  it('should allow reply lookup by stanza-id (MAM archive ID)', () => {
    // Simulate real-world scenario: message has both ids, reply references stanza-id
    const originalMessage = {
      id: '148a9d4f-68ee-4c5c-abca-685bc7981c2b',
      stanzaId: '1766999538188692',
      nick: 'alice',
      body: 'Original message',
    }

    const replyMessage = {
      id: '7283b0f7-d48e-4433-8cb8-644b3e78d823',
      stanzaId: '1766999746428466',
      nick: 'bob',
      body: 'Reply to original',
      replyTo: { id: '1766999538188692' }, // References stanza-id, not client id
    }

    const lookup = createMessageLookup([originalMessage, replyMessage])

    // Reply can find original by stanza-id
    const found = lookup.get(replyMessage.replyTo.id)
    expect(found).toEqual(originalMessage)
    expect(found?.nick).toBe('alice')
    expect(found?.body).toBe('Original message')
  })

  it('should handle empty message array', () => {
    const lookup = createMessageLookup([])
    expect(lookup.size).toBe(0)
  })

  it('should handle messages with undefined stanzaId', () => {
    const messages = [
      { id: 'msg-1', stanzaId: undefined, body: 'Test' },
    ]

    const lookup = createMessageLookup(messages)

    expect(lookup.size).toBe(1)
    expect(lookup.get('msg-1')).toEqual(messages[0])
    expect(lookup.get('undefined')).toBeUndefined()
  })
})

describe('findMessageById', () => {
  it('should find message by client id', () => {
    const messages = [
      { id: 'msg-1', body: 'Hello' },
      { id: 'msg-2', body: 'World' },
    ]

    const found = findMessageById(messages, 'msg-1')
    expect(found).toEqual(messages[0])
  })

  it('should find message by stanza-id', () => {
    const messages = [
      { id: 'client-id', stanzaId: 'mam-archive-id', body: 'Hello' },
    ]

    const found = findMessageById(messages, 'mam-archive-id')
    expect(found).toEqual(messages[0])
  })

  it('should return undefined when not found', () => {
    const messages = [
      { id: 'msg-1', body: 'Hello' },
    ]

    const found = findMessageById(messages, 'nonexistent')
    expect(found).toBeUndefined()
  })

  it('should prefer id match over stanzaId (returns first match)', () => {
    const messages = [
      { id: 'id-1', stanzaId: 'stanza-1', body: 'First' },
      { id: 'stanza-1', body: 'Second has id matching first stanzaId' },
    ]

    // Looking for 'stanza-1' should find first message (by stanzaId)
    // because find() returns the first match
    const found = findMessageById(messages, 'stanza-1')
    expect(found?.body).toBe('First')
  })
})
