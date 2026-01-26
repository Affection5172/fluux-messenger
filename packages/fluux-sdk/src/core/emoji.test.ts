import { describe, it, expect } from 'vitest'
import { shortcodeToEmoji, convertShortcodes } from './emoji'

describe('emoji shortcode conversion', () => {
  describe('shortcodeToEmoji', () => {
    it('should convert common reaction shortcodes', () => {
      expect(shortcodeToEmoji(':smiley:')).toBe('😃')
      expect(shortcodeToEmoji(':thumbsup:')).toBe('👍')
      expect(shortcodeToEmoji(':+1:')).toBe('👍')
      expect(shortcodeToEmoji(':heart:')).toBe('❤️')
      expect(shortcodeToEmoji(':fire:')).toBe('🔥')
      expect(shortcodeToEmoji(':tada:')).toBe('🎉')
      expect(shortcodeToEmoji(':100:')).toBe('💯')
    })

    it('should be case-insensitive', () => {
      expect(shortcodeToEmoji(':SMILEY:')).toBe('😃')
      expect(shortcodeToEmoji(':Thumbsup:')).toBe('👍')
      expect(shortcodeToEmoji(':HEART:')).toBe('❤️')
    })

    it('should return Unicode emoji unchanged', () => {
      expect(shortcodeToEmoji('😀')).toBe('😀')
      expect(shortcodeToEmoji('👍')).toBe('👍')
      expect(shortcodeToEmoji('❤️')).toBe('❤️')
      expect(shortcodeToEmoji('🎉')).toBe('🎉')
    })

    it('should return unknown shortcodes unchanged', () => {
      expect(shortcodeToEmoji(':unknown_emoji:')).toBe(':unknown_emoji:')
      expect(shortcodeToEmoji(':notanemoji:')).toBe(':notanemoji:')
    })

    it('should return non-shortcode text unchanged', () => {
      expect(shortcodeToEmoji('hello')).toBe('hello')
      expect(shortcodeToEmoji(':incomplete')).toBe(':incomplete')
      expect(shortcodeToEmoji('incomplete:')).toBe('incomplete:')
    })
  })

  describe('convertShortcodes', () => {
    it('should convert array of shortcodes', () => {
      const input = [':smiley:', ':thumbsup:', ':heart:']
      const result = convertShortcodes(input)
      expect(result).toEqual(['😃', '👍', '❤️'])
    })

    it('should handle mixed array of shortcodes and Unicode', () => {
      const input = [':smiley:', '👍', ':heart:', '🎉']
      const result = convertShortcodes(input)
      expect(result).toEqual(['😃', '👍', '❤️', '🎉'])
    })

    it('should handle empty array', () => {
      expect(convertShortcodes([])).toEqual([])
    })
  })
})
