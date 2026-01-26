import { describe, it, expect, beforeEach } from 'vitest'
import { blockingStore } from './blockingStore'

describe('blockingStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    blockingStore.getState().reset()
  })

  describe('setBlocklist', () => {
    it('should set the blocklist from array', () => {
      blockingStore.getState().setBlocklist(['spam@example.com', 'troll@example.com'])

      expect(blockingStore.getState().blockedJids.size).toBe(2)
      expect(blockingStore.getState().isBlocked('spam@example.com')).toBe(true)
      expect(blockingStore.getState().isBlocked('troll@example.com')).toBe(true)
    })

    it('should replace existing blocklist', () => {
      blockingStore.getState().setBlocklist(['old@example.com'])
      blockingStore.getState().setBlocklist(['new@example.com'])

      expect(blockingStore.getState().blockedJids.size).toBe(1)
      expect(blockingStore.getState().isBlocked('old@example.com')).toBe(false)
      expect(blockingStore.getState().isBlocked('new@example.com')).toBe(true)
    })
  })

  describe('addBlockedJids', () => {
    it('should add JIDs to the blocklist', () => {
      blockingStore.getState().addBlockedJids(['spam@example.com'])
      blockingStore.getState().addBlockedJids(['troll@example.com'])

      expect(blockingStore.getState().blockedJids.size).toBe(2)
      expect(blockingStore.getState().isBlocked('spam@example.com')).toBe(true)
      expect(blockingStore.getState().isBlocked('troll@example.com')).toBe(true)
    })

    it('should not duplicate JIDs', () => {
      blockingStore.getState().addBlockedJids(['spam@example.com'])
      blockingStore.getState().addBlockedJids(['spam@example.com'])

      expect(blockingStore.getState().blockedJids.size).toBe(1)
    })

    it('should handle multiple JIDs at once', () => {
      blockingStore.getState().addBlockedJids(['a@example.com', 'b@example.com', 'c@example.com'])

      expect(blockingStore.getState().blockedJids.size).toBe(3)
    })
  })

  describe('removeBlockedJids', () => {
    it('should remove JIDs from the blocklist', () => {
      blockingStore.getState().setBlocklist(['spam@example.com', 'troll@example.com'])
      blockingStore.getState().removeBlockedJids(['spam@example.com'])

      expect(blockingStore.getState().blockedJids.size).toBe(1)
      expect(blockingStore.getState().isBlocked('spam@example.com')).toBe(false)
      expect(blockingStore.getState().isBlocked('troll@example.com')).toBe(true)
    })

    it('should handle removing non-existent JIDs gracefully', () => {
      blockingStore.getState().setBlocklist(['spam@example.com'])
      blockingStore.getState().removeBlockedJids(['nonexistent@example.com'])

      expect(blockingStore.getState().blockedJids.size).toBe(1)
    })

    it('should handle multiple JIDs at once', () => {
      blockingStore.getState().setBlocklist(['a@example.com', 'b@example.com', 'c@example.com'])
      blockingStore.getState().removeBlockedJids(['a@example.com', 'c@example.com'])

      expect(blockingStore.getState().blockedJids.size).toBe(1)
      expect(blockingStore.getState().isBlocked('b@example.com')).toBe(true)
    })
  })

  describe('clearBlocklist', () => {
    it('should clear all blocked JIDs', () => {
      blockingStore.getState().setBlocklist(['spam@example.com', 'troll@example.com'])
      blockingStore.getState().clearBlocklist()

      expect(blockingStore.getState().blockedJids.size).toBe(0)
    })
  })

  describe('isBlocked', () => {
    it('should return true for blocked JIDs', () => {
      blockingStore.getState().setBlocklist(['spam@example.com'])

      expect(blockingStore.getState().isBlocked('spam@example.com')).toBe(true)
    })

    it('should return false for non-blocked JIDs', () => {
      blockingStore.getState().setBlocklist(['spam@example.com'])

      expect(blockingStore.getState().isBlocked('friend@example.com')).toBe(false)
    })
  })

  describe('getBlockedJids', () => {
    it('should return array of blocked JIDs', () => {
      blockingStore.getState().setBlocklist(['spam@example.com', 'troll@example.com'])

      const blocked = blockingStore.getState().getBlockedJids()

      expect(blocked).toHaveLength(2)
      expect(blocked).toContain('spam@example.com')
      expect(blocked).toContain('troll@example.com')
    })

    it('should return empty array when no JIDs are blocked', () => {
      const blocked = blockingStore.getState().getBlockedJids()

      expect(blocked).toHaveLength(0)
    })
  })

  describe('reset', () => {
    it('should clear all state', () => {
      blockingStore.getState().setBlocklist(['spam@example.com'])
      blockingStore.getState().reset()

      expect(blockingStore.getState().blockedJids.size).toBe(0)
    })
  })
})
