/**
 * Tests for XEP-0428 Fallback Utilities
 */
import { describe, it, expect } from 'vitest'
import { getFallbackElement, processFallback } from './fallbackUtils'
import { createMockElement } from '../core/test-utils'

describe('fallbackUtils', () => {
  describe('getFallbackElement', () => {
    it('should return null when no fallback element exists', () => {
      const stanza = createMockElement('message', {}, [
        { name: 'body', text: 'Hello' },
      ])
      expect(getFallbackElement(stanza)).toBeNull()
    })

    it('should find fallback element with standard namespace', () => {
      const stanza = createMockElement('message', {}, [
        { name: 'body', text: 'Hello' },
        {
          name: 'fallback',
          attrs: { xmlns: 'urn:xmpp:fallback:0', for: 'urn:xmpp:reply:0' },
          children: [],
        },
      ])
      const result = getFallbackElement(stanza)
      expect(result).not.toBeNull()
      expect(result?.namespace).toBe('urn:xmpp:fallback:0')
    })

    it('should find fallback element with legacy namespace', () => {
      const stanza = createMockElement('message', {}, [
        { name: 'body', text: 'Hello' },
        {
          name: 'fallback',
          attrs: { xmlns: 'urn:xmpp:feature-fallback:0', for: 'urn:xmpp:reply:0' },
          children: [],
        },
      ])
      const result = getFallbackElement(stanza)
      expect(result).not.toBeNull()
      expect(result?.namespace).toBe('urn:xmpp:feature-fallback:0')
    })

    it('should prefer standard namespace over legacy', () => {
      const stanza = createMockElement('message', {}, [
        {
          name: 'fallback',
          attrs: { xmlns: 'urn:xmpp:fallback:0', for: 'urn:xmpp:reply:0' },
          children: [],
        },
      ])
      const result = getFallbackElement(stanza)
      expect(result?.namespace).toBe('urn:xmpp:fallback:0')
    })
  })

  describe('processFallback', () => {
    it('should return original body when no fallback element exists', () => {
      const stanza = createMockElement('message', {}, [
        { name: 'body', text: 'Hello world' },
      ])
      const result = processFallback(stanza, 'Hello world', {
        validTargets: ['urn:xmpp:reply:0'],
      })
      expect(result.processedBody).toBe('Hello world')
    })

    it('should return original body when fallback target not in validTargets', () => {
      const stanza = createMockElement('message', {}, [
        {
          name: 'fallback',
          attrs: { xmlns: 'urn:xmpp:fallback:0', for: 'urn:xmpp:other:0' },
          children: [
            { name: 'body', attrs: { xmlns: 'urn:xmpp:fallback:0', start: '0', end: '5' } },
          ],
        },
      ])
      const result = processFallback(stanza, 'Hello world', {
        validTargets: ['urn:xmpp:reply:0'],
      })
      expect(result.processedBody).toBe('Hello world')
    })

    it('should strip fallback text for correction', () => {
      const stanza = createMockElement('message', {}, [
        {
          name: 'fallback',
          attrs: { xmlns: 'urn:xmpp:fallback:0', for: 'urn:xmpp:message-correct:0' },
          children: [
            { name: 'body', attrs: { xmlns: 'urn:xmpp:fallback:0', start: '0', end: '12' } },
          ],
        },
      ])
      const result = processFallback(stanza, '[Corrected] Actual text', {
        validTargets: ['urn:xmpp:message-correct:0'],
        trimMode: 'leading-newlines',
      })
      expect(result.processedBody).toBe('Actual text')
    })

    it('should strip fallback text for reply', () => {
      const stanza = createMockElement('message', {}, [
        {
          name: 'fallback',
          attrs: { xmlns: 'urn:xmpp:fallback:0', for: 'urn:xmpp:reply:0' },
          children: [
            // '> Bob: quoted text\n' is 19 characters
            { name: 'body', attrs: { xmlns: 'urn:xmpp:fallback:0', start: '0', end: '19' } },
          ],
        },
      ])
      const result = processFallback(stanza, '> Bob: quoted text\nMy reply', {
        validTargets: ['urn:xmpp:reply:0'],
      })
      expect(result.processedBody).toBe('My reply')
    })

    it('should extract fallbackBody for replies when replyTo provided', () => {
      const stanza = createMockElement('message', {}, [
        {
          name: 'fallback',
          attrs: { xmlns: 'urn:xmpp:fallback:0', for: 'urn:xmpp:reply:0' },
          children: [
            // '> Bob: quoted text\n' is 19 characters
            { name: 'body', attrs: { xmlns: 'urn:xmpp:fallback:0', start: '0', end: '19' } },
          ],
        },
      ])
      const result = processFallback(
        stanza,
        '> Bob: quoted text\nMy reply',
        { validTargets: ['urn:xmpp:reply:0'] },
        { id: 'original-msg-id', to: 'bob@example.com' }
      )
      expect(result.fallbackBody).toBe('quoted text')
    })

    it('should handle invalid range gracefully', () => {
      const stanza = createMockElement('message', {}, [
        {
          name: 'fallback',
          attrs: { xmlns: 'urn:xmpp:fallback:0', for: 'urn:xmpp:reply:0' },
          children: [
            { name: 'body', attrs: { xmlns: 'urn:xmpp:fallback:0', start: '100', end: '200' } },
          ],
        },
      ])
      const result = processFallback(stanza, 'Short text', {
        validTargets: ['urn:xmpp:reply:0'],
      })
      // Should return original body when range is invalid
      expect(result.processedBody).toBe('Short text')
    })

    it('should use full trim mode by default', () => {
      const stanza = createMockElement('message', {}, [
        {
          name: 'fallback',
          attrs: { xmlns: 'urn:xmpp:fallback:0', for: 'urn:xmpp:reply:0' },
          children: [
            { name: 'body', attrs: { xmlns: 'urn:xmpp:fallback:0', start: '0', end: '10' } },
          ],
        },
      ])
      const result = processFallback(stanza, '> quoted\n\n  My reply  \n', {
        validTargets: ['urn:xmpp:reply:0'],
      })
      expect(result.processedBody).toBe('My reply')
    })

    it('should use leading-newlines trim mode when specified', () => {
      const stanza = createMockElement('message', {}, [
        {
          name: 'fallback',
          attrs: { xmlns: 'urn:xmpp:fallback:0', for: 'urn:xmpp:message-correct:0' },
          children: [
            { name: 'body', attrs: { xmlns: 'urn:xmpp:fallback:0', start: '0', end: '12' } },
          ],
        },
      ])
      const result = processFallback(stanza, '[Corrected]\nActual text  ', {
        validTargets: ['urn:xmpp:message-correct:0'],
        trimMode: 'leading-newlines',
      })
      // Only leading newlines trimmed, trailing space preserved
      expect(result.processedBody).toBe('Actual text  ')
    })

    it('should work with legacy namespace', () => {
      const stanza = createMockElement('message', {}, [
        {
          name: 'fallback',
          attrs: { xmlns: 'urn:xmpp:feature-fallback:0', for: 'urn:xmpp:message-correct:0' },
          children: [
            { name: 'body', attrs: { xmlns: 'urn:xmpp:feature-fallback:0', start: '0', end: '12' } },
          ],
        },
      ])
      const result = processFallback(stanza, '[Corrected] Fixed text', {
        validTargets: ['urn:xmpp:message-correct:0'],
        trimMode: 'leading-newlines',
      })
      expect(result.processedBody).toBe('Fixed text')
    })
  })
})
