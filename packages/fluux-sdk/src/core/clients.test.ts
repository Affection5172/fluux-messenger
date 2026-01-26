import { describe, it, expect } from 'vitest'
import { getClientName, getClientType } from './clients'

describe('getClientName', () => {
  describe('known clients', () => {
    it('should return Conversations for conversations.im node', () => {
      expect(getClientName('https://conversations.im')).toBe('Conversations')
      expect(getClientName('http://conversations.im')).toBe('Conversations')
    })

    it('should return Gajim for gajim.org node', () => {
      expect(getClientName('https://gajim.org')).toBe('Gajim')
      expect(getClientName('http://gajim.org')).toBe('Gajim')
    })

    it('should return Dino for dino.im node', () => {
      expect(getClientName('https://dino.im')).toBe('Dino')
    })

    it('should return Monal for monal nodes', () => {
      expect(getClientName('https://monal-im.org')).toBe('Monal')
      expect(getClientName('https://monal.im')).toBe('Monal')
    })

    it('should return platform-specific Fluux names', () => {
      expect(getClientName('https://fluux.io/web')).toBe('Fluux Web')
      expect(getClientName('https://fluux.io/desktop')).toBe('Fluux Desktop')
      expect(getClientName('https://fluux.io/mobile')).toBe('Fluux Mobile')
    })

    it('should return Converse.js for conversejs.org node', () => {
      expect(getClientName('https://conversejs.org')).toBe('Converse.js')
    })
  })

  describe('unknown clients', () => {
    it('should extract readable name from unknown URL', () => {
      expect(getClientName('https://example.com')).toBe('Example.com')
      expect(getClientName('https://myclient.org')).toBe('Myclient.org')
    })

    it('should strip www. prefix', () => {
      expect(getClientName('https://www.example.com')).toBe('Example.com')
    })

    it('should handle URLs with trailing slash', () => {
      expect(getClientName('https://gajim.org/')).toBe('Gajim')
    })
  })

  describe('edge cases', () => {
    it('should return undefined for undefined input', () => {
      expect(getClientName(undefined)).toBeUndefined()
    })

    it('should return undefined for empty string', () => {
      expect(getClientName('')).toBeUndefined()
    })

    it('should handle non-URL strings reasonably', () => {
      expect(getClientName('SomeClient')).toBe('SomeClient')
    })

    it('should return undefined for very long non-URL strings', () => {
      const longString = 'a'.repeat(60)
      expect(getClientName(longString)).toBeUndefined()
    })
  })
})

describe('getClientType', () => {
  describe('mobile clients', () => {
    it('should return mobile for Conversations', () => {
      expect(getClientType('Conversations')).toBe('mobile')
    })

    it('should return mobile for Monal', () => {
      expect(getClientType('Monal')).toBe('mobile')
    })

    it('should return mobile for Siskin', () => {
      expect(getClientType('Siskin')).toBe('mobile')
    })
  })

  describe('desktop clients', () => {
    it('should return desktop for Gajim', () => {
      expect(getClientType('Gajim')).toBe('desktop')
    })

    it('should return desktop for Dino', () => {
      expect(getClientType('Dino')).toBe('desktop')
    })

    it('should return desktop for Psi+', () => {
      expect(getClientType('Psi+')).toBe('desktop')
    })
  })

  describe('web clients', () => {
    it('should return web for Fluux', () => {
      expect(getClientType('Fluux')).toBe('web')
    })

    it('should return web for Converse.js', () => {
      expect(getClientType('Converse.js')).toBe('web')
    })

    it('should return web for Movim', () => {
      expect(getClientType('Movim')).toBe('web')
    })
  })

  describe('unknown clients', () => {
    it('should return unknown for undefined', () => {
      expect(getClientType(undefined)).toBe('unknown')
    })

    it('should return unknown for unrecognized client', () => {
      expect(getClientType('SomeRandomClient')).toBe('unknown')
    })
  })
})
