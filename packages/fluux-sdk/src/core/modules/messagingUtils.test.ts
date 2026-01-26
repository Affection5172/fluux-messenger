import { describe, it, expect } from 'vitest'
import { applyRetraction, applyCorrection, parseOobData } from './messagingUtils'
import { createMockElement } from '../test-utils'

describe('messagingUtils', () => {
  describe('applyRetraction', () => {
    it('should return retraction data when sender matches', () => {
      const result = applyRetraction(true)

      expect(result).not.toBeNull()
      expect(result?.isRetracted).toBe(true)
      expect(result?.retractedAt).toBeInstanceOf(Date)
    })

    it('should return null when sender does not match', () => {
      const result = applyRetraction(false)

      expect(result).toBeNull()
    })

    it('should set retractedAt to current time', () => {
      const before = new Date()
      const result = applyRetraction(true)
      const after = new Date()

      expect(result?.retractedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(result?.retractedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('applyCorrection', () => {
    it('should return correction data with processed body', () => {
      const messageEl = createMockElement('message', { id: 'msg-1' }, [
        { name: 'body', text: 'Corrected text' },
      ])

      const result = applyCorrection(messageEl, 'Corrected text', 'Original text')

      expect(result.body).toBe('Corrected text')
      expect(result.isEdited).toBe(true)
      expect(result.originalBody).toBe('Original text')
    })

    it('should preserve original body from first message', () => {
      const messageEl = createMockElement('message', { id: 'msg-1' }, [
        { name: 'body', text: 'Second correction' },
      ])

      // Simulating a message that was already corrected once
      const result = applyCorrection(messageEl, 'Second correction', 'Very first text')

      expect(result.originalBody).toBe('Very first text')
    })

    it('should include attachment when present in correction', () => {
      const messageEl = createMockElement('message', { id: 'msg-1' }, [
        { name: 'body', text: 'Check this file' },
        {
          name: 'x',
          attrs: { xmlns: 'jabber:x:oob' },
          children: [
            { name: 'url', text: 'https://example.com/file.pdf' },
          ],
        },
      ])

      const result = applyCorrection(messageEl, 'Check this file', 'Original text')

      expect(result.attachment).toBeDefined()
      expect(result.attachment?.url).toBe('https://example.com/file.pdf')
    })

    it('should not include attachment when not present', () => {
      const messageEl = createMockElement('message', { id: 'msg-1' }, [
        { name: 'body', text: 'Just text' },
      ])

      const result = applyCorrection(messageEl, 'Just text', 'Original')

      expect(result.attachment).toBeUndefined()
    })

    it('should handle correction with timestamp from delay element', () => {
      const messageEl = createMockElement('message', { id: 'msg-1' }, [
        { name: 'body', text: 'Corrected text' },
        { name: 'delay', attrs: { xmlns: 'urn:xmpp:delay', stamp: '2024-01-15T10:00:00Z' } },
      ])

      const result = applyCorrection(messageEl, 'Corrected text', 'Original text')

      // applyCorrection doesn't return timestamp, that's part of the message metadata
      expect(result.body).toBe('Corrected text')
      expect(result.isEdited).toBe(true)
    })
  })

  describe('parseOobData', () => {
    it('should detect video mediaType from extension even with image thumbnail', () => {
      // This is a regression test: videos with thumbnails were incorrectly
      // detected as images because thumbnail.mediaType (image/jpeg) was used
      const stanza = createMockElement('message', { id: 'msg-1' }, [
        {
          name: 'x',
          attrs: { xmlns: 'jabber:x:oob' },
          children: [
            { name: 'url', text: 'https://example.com/uploads/video.mp4' },
            {
              name: 'thumbnail',
              attrs: {
                xmlns: 'urn:xmpp:thumbs:1',
                uri: 'cid:sha1+abc123@bob.xmpp.org',
                'media-type': 'image/jpeg',
                width: '320',
                height: '240',
              },
            },
          ],
        },
      ])

      const result = parseOobData(stanza)

      expect(result).toBeDefined()
      expect(result?.mediaType).toBe('video/mp4')
      expect(result?.thumbnail).toBeDefined()
      expect(result?.thumbnail?.mediaType).toBe('image/jpeg')
    })

    it('should detect webm video with thumbnail', () => {
      const stanza = createMockElement('message', { id: 'msg-1' }, [
        {
          name: 'x',
          attrs: { xmlns: 'jabber:x:oob' },
          children: [
            { name: 'url', text: 'https://example.com/video.webm' },
            {
              name: 'thumbnail',
              attrs: {
                xmlns: 'urn:xmpp:thumbs:1',
                uri: 'cid:sha1+xyz@bob.xmpp.org',
                'media-type': 'image/png',
                width: '160',
                height: '120',
              },
            },
          ],
        },
      ])

      const result = parseOobData(stanza)

      expect(result?.mediaType).toBe('video/webm')
    })

    it('should detect mov video with thumbnail', () => {
      const stanza = createMockElement('message', { id: 'msg-1' }, [
        {
          name: 'x',
          attrs: { xmlns: 'jabber:x:oob' },
          children: [
            { name: 'url', text: 'https://example.com/movie.mov' },
            {
              name: 'thumbnail',
              attrs: {
                xmlns: 'urn:xmpp:thumbs:1',
                uri: 'cid:thumb@xmpp.org',
                'media-type': 'image/jpeg',
                width: '640',
                height: '480',
              },
            },
          ],
        },
      ])

      const result = parseOobData(stanza)

      expect(result?.mediaType).toBe('video/quicktime')
    })

    it('should detect image mediaType correctly', () => {
      const stanza = createMockElement('message', { id: 'msg-1' }, [
        {
          name: 'x',
          attrs: { xmlns: 'jabber:x:oob' },
          children: [
            { name: 'url', text: 'https://example.com/photo.jpg' },
          ],
        },
      ])

      const result = parseOobData(stanza)

      expect(result?.mediaType).toBe('image/jpeg')
    })

    it('should detect audio mediaType correctly', () => {
      const stanza = createMockElement('message', { id: 'msg-1' }, [
        {
          name: 'x',
          attrs: { xmlns: 'jabber:x:oob' },
          children: [
            { name: 'url', text: 'https://example.com/song.mp3' },
          ],
        },
      ])

      const result = parseOobData(stanza)

      expect(result?.mediaType).toBe('audio/mpeg')
    })

    it('should return undefined mediaType for unknown extension', () => {
      const stanza = createMockElement('message', { id: 'msg-1' }, [
        {
          name: 'x',
          attrs: { xmlns: 'jabber:x:oob' },
          children: [
            { name: 'url', text: 'https://example.com/file.xyz' },
          ],
        },
      ])

      const result = parseOobData(stanza)

      expect(result).toBeDefined()
      expect(result?.mediaType).toBeUndefined()
    })

    it('should return undefined when no OOB element', () => {
      const stanza = createMockElement('message', { id: 'msg-1' }, [
        { name: 'body', text: 'No attachment' },
      ])

      const result = parseOobData(stanza)

      expect(result).toBeUndefined()
    })

    it('should extract filename from URL', () => {
      const stanza = createMockElement('message', { id: 'msg-1' }, [
        {
          name: 'x',
          attrs: { xmlns: 'jabber:x:oob' },
          children: [
            { name: 'url', text: 'https://example.com/uploads/my-document.pdf' },
          ],
        },
      ])

      const result = parseOobData(stanza)

      expect(result?.name).toBe('my-document.pdf')
      expect(result?.mediaType).toBe('application/pdf')
    })

    it('should use description as name when provided', () => {
      const stanza = createMockElement('message', { id: 'msg-1' }, [
        {
          name: 'x',
          attrs: { xmlns: 'jabber:x:oob' },
          children: [
            { name: 'url', text: 'https://example.com/file.pdf' },
            { name: 'desc', text: 'Important Document' },
          ],
        },
      ])

      const result = parseOobData(stanza)

      expect(result?.name).toBe('Important Document')
    })
  })
})
