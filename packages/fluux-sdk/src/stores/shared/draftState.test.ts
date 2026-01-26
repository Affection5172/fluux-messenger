import { describe, it, expect } from 'vitest'
import { setDraft, getDraft, clearDraft } from './draftState'

describe('draftState utilities', () => {
  describe('setDraft', () => {
    it('adds a draft for a new id', () => {
      const drafts = new Map<string, string>()
      const result = setDraft(drafts, 'conv-1', 'Hello world')

      expect(result.get('conv-1')).toBe('Hello world')
    })

    it('updates an existing draft', () => {
      const drafts = new Map<string, string>([['conv-1', 'Old draft']])
      const result = setDraft(drafts, 'conv-1', 'New draft')

      expect(result.get('conv-1')).toBe('New draft')
    })

    it('removes draft when text is empty', () => {
      const drafts = new Map<string, string>([['conv-1', 'Existing draft']])
      const result = setDraft(drafts, 'conv-1', '')

      expect(result.has('conv-1')).toBe(false)
    })

    it('removes draft when text is only whitespace', () => {
      const drafts = new Map<string, string>([['conv-1', 'Existing draft']])
      const result = setDraft(drafts, 'conv-1', '   \t\n  ')

      expect(result.has('conv-1')).toBe(false)
    })

    it('preserves draft with leading/trailing whitespace if has content', () => {
      const drafts = new Map<string, string>()
      const result = setDraft(drafts, 'conv-1', '  Hello  ')

      expect(result.get('conv-1')).toBe('  Hello  ')
    })

    it('does not mutate the original map', () => {
      const drafts = new Map<string, string>()
      const result = setDraft(drafts, 'conv-1', 'Hello')

      expect(result).not.toBe(drafts)
      expect(drafts.size).toBe(0)
    })

    it('preserves other drafts when adding new one', () => {
      const drafts = new Map<string, string>([
        ['conv-1', 'Draft 1'],
        ['conv-2', 'Draft 2'],
      ])
      const result = setDraft(drafts, 'conv-3', 'Draft 3')

      expect(result.size).toBe(3)
      expect(result.get('conv-1')).toBe('Draft 1')
      expect(result.get('conv-2')).toBe('Draft 2')
      expect(result.get('conv-3')).toBe('Draft 3')
    })
  })

  describe('getDraft', () => {
    it('returns draft when it exists', () => {
      const drafts = new Map<string, string>([['conv-1', 'My draft']])
      const result = getDraft(drafts, 'conv-1')

      expect(result).toBe('My draft')
    })

    it('returns empty string when draft does not exist', () => {
      const drafts = new Map<string, string>()
      const result = getDraft(drafts, 'unknown-id')

      expect(result).toBe('')
    })

    it('returns empty string for wrong id', () => {
      const drafts = new Map<string, string>([['conv-1', 'My draft']])
      const result = getDraft(drafts, 'conv-2')

      expect(result).toBe('')
    })
  })

  describe('clearDraft', () => {
    it('removes existing draft', () => {
      const drafts = new Map<string, string>([['conv-1', 'My draft']])
      const result = clearDraft(drafts, 'conv-1')

      expect(result.has('conv-1')).toBe(false)
    })

    it('handles clearing non-existent draft gracefully', () => {
      const drafts = new Map<string, string>()
      const result = clearDraft(drafts, 'unknown-id')

      expect(result.size).toBe(0)
    })

    it('preserves other drafts when clearing one', () => {
      const drafts = new Map<string, string>([
        ['conv-1', 'Draft 1'],
        ['conv-2', 'Draft 2'],
      ])
      const result = clearDraft(drafts, 'conv-1')

      expect(result.size).toBe(1)
      expect(result.has('conv-1')).toBe(false)
      expect(result.get('conv-2')).toBe('Draft 2')
    })

    it('does not mutate the original map', () => {
      const drafts = new Map<string, string>([['conv-1', 'My draft']])
      const result = clearDraft(drafts, 'conv-1')

      expect(result).not.toBe(drafts)
      expect(drafts.size).toBe(1)
      expect(drafts.get('conv-1')).toBe('My draft')
    })
  })
})
