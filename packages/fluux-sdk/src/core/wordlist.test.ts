import { describe, it, expect } from 'vitest'
import { generateQuickChatSlug } from './wordlist'

describe('wordlist', () => {
  describe('generateQuickChatSlug', () => {
    it('should generate a slug in the format adjective-noun-suffix', () => {
      const slug = generateQuickChatSlug()

      // Should have 3 parts separated by dashes
      const parts = slug.split('-')
      expect(parts.length).toBe(3)

      // Each part should be non-empty
      expect(parts[0].length).toBeGreaterThan(0)
      expect(parts[1].length).toBeGreaterThan(0)
      expect(parts[2].length).toBe(4) // 4-char suffix
    })

    it('should generate alphanumeric suffixes', () => {
      const slug = generateQuickChatSlug()
      const suffix = slug.split('-')[2]

      // Suffix should only contain alphanumeric characters (base36)
      expect(suffix).toMatch(/^[a-z0-9]+$/)
    })

    it('should generate unique slugs', () => {
      const slugs = new Set<string>()

      // Generate 100 slugs and check they're all unique
      for (let i = 0; i < 100; i++) {
        slugs.add(generateQuickChatSlug())
      }

      // All 100 should be unique (very unlikely to collide)
      expect(slugs.size).toBe(100)
    })

    it('should use lowercase words', () => {
      const slug = generateQuickChatSlug()

      // All characters should be lowercase or numbers
      expect(slug).toBe(slug.toLowerCase())
    })

    it('should generate slugs with reasonable length', () => {
      const slug = generateQuickChatSlug()

      // Slug should be between 10 and 30 characters
      // (shortest: "calm-sun-a1b2" = 13, longest: "bright-meadow-a1b2" = 18)
      expect(slug.length).toBeGreaterThanOrEqual(10)
      expect(slug.length).toBeLessThanOrEqual(30)
    })
  })
})
