import { describe, expect, test } from 'vitest'
import { parseXmppUri, isMucJid } from './xmppUri'

describe('parseXmppUri', () => {
  test('parses simple JID', () => {
    const result = parseXmppUri('xmpp:romeo@montague.net')
    expect(result).toEqual({
      jid: 'romeo@montague.net',
      action: undefined,
      params: {},
    })
  })

  test('parses JID with message action', () => {
    const result = parseXmppUri('xmpp:romeo@montague.net?message')
    expect(result).toEqual({
      jid: 'romeo@montague.net',
      action: 'message',
      params: {},
    })
  })

  test('parses JID with message action and body', () => {
    const result = parseXmppUri('xmpp:romeo@montague.net?message;body=Hello%20World')
    expect(result).toEqual({
      jid: 'romeo@montague.net',
      action: 'message',
      params: { body: 'Hello World' },
    })
  })

  test('parses MUC JID with join action', () => {
    const result = parseXmppUri('xmpp:coven@chat.shakespeare.lit?join')
    expect(result).toEqual({
      jid: 'coven@chat.shakespeare.lit',
      action: 'join',
      params: {},
    })
  })

  test('parses MUC JID with join action and password', () => {
    const result = parseXmppUri('xmpp:coven@chat.shakespeare.lit?join;password=secret')
    expect(result).toEqual({
      jid: 'coven@chat.shakespeare.lit',
      action: 'join',
      params: { password: 'secret' },
    })
  })

  test('parses MUC JID with join action and nick', () => {
    const result = parseXmppUri('xmpp:coven@conference.example.org?join;nick=macbeth')
    expect(result).toEqual({
      jid: 'coven@conference.example.org',
      action: 'join',
      params: { nick: 'macbeth' },
    })
  })

  test('parses JID with resource', () => {
    const result = parseXmppUri('xmpp:romeo@montague.net/home')
    expect(result).toEqual({
      jid: 'romeo@montague.net/home',
      action: undefined,
      params: {},
    })
  })

  test('decodes URL-encoded JID', () => {
    const result = parseXmppUri('xmpp:user%40example.org@gateway.example.com')
    expect(result).toEqual({
      jid: 'user@example.org@gateway.example.com',
      action: undefined,
      params: {},
    })
  })

  test('handles subscribe action', () => {
    const result = parseXmppUri('xmpp:romeo@montague.net?subscribe')
    expect(result).toEqual({
      jid: 'romeo@montague.net',
      action: 'subscribe',
      params: {},
    })
  })

  test('handles multiple parameters', () => {
    const result = parseXmppUri('xmpp:room@conference.example.org?join;nick=user;password=secret')
    expect(result).toEqual({
      jid: 'room@conference.example.org',
      action: 'join',
      params: { nick: 'user', password: 'secret' },
    })
  })

  test('returns null for non-xmpp scheme', () => {
    expect(parseXmppUri('http://example.com')).toBeNull()
    expect(parseXmppUri('mailto:user@example.com')).toBeNull()
  })

  test('returns null for invalid JID without @', () => {
    expect(parseXmppUri('xmpp:invalid')).toBeNull()
  })

  test('handles authority (rarely used)', () => {
    const result = parseXmppUri('xmpp://gateway.example.org/user@foreign.org')
    expect(result).toEqual({
      jid: 'user@foreign.org',
      action: undefined,
      params: {},
    })
  })
})

describe('isMucJid', () => {
  test('identifies conference.* as MUC', () => {
    expect(isMucJid('room@conference.example.org')).toBe(true)
  })

  test('identifies muc.* as MUC', () => {
    expect(isMucJid('room@muc.example.org')).toBe(true)
  })

  test('identifies chat.* as MUC', () => {
    expect(isMucJid('room@chat.shakespeare.lit')).toBe(true)
  })

  test('identifies rooms.* as MUC', () => {
    expect(isMucJid('room@rooms.example.org')).toBe(true)
  })

  test('identifies groupchat.* as MUC', () => {
    expect(isMucJid('room@groupchat.example.org')).toBe(true)
  })

  test('does not identify regular JID as MUC', () => {
    expect(isMucJid('user@example.org')).toBe(false)
  })

  test('handles JID with resource', () => {
    expect(isMucJid('room@conference.example.org/nick')).toBe(true)
  })
})
