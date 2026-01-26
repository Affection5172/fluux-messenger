import { describe, it, expect } from 'vitest'
import { getPresenceRank, getBestPresenceShow, getPresenceFromShow } from './presenceUtils'
import type { PresenceShow } from '../core/types'

describe('presenceUtils', () => {
  describe('getPresenceRank', () => {
    it('should rank "chat" as most available (0)', () => {
      expect(getPresenceRank('chat')).toBe(0)
    })

    it('should rank null (online) as second most available (1)', () => {
      expect(getPresenceRank(null)).toBe(1)
    })

    it('should rank undefined (online) as second most available (1)', () => {
      expect(getPresenceRank(undefined)).toBe(1)
    })

    it('should rank "away" as third (2)', () => {
      expect(getPresenceRank('away')).toBe(2)
    })

    it('should rank "xa" as fourth (3)', () => {
      expect(getPresenceRank('xa')).toBe(3)
    })

    it('should rank "dnd" as fifth (4)', () => {
      expect(getPresenceRank('dnd')).toBe(4)
    })

    it('should rank unknown values as lowest (5)', () => {
      expect(getPresenceRank('unknown' as PresenceShow)).toBe(5)
    })

    it('should maintain correct ordering', () => {
      const ranks = [
        getPresenceRank('chat'),
        getPresenceRank(null),
        getPresenceRank(undefined),
        getPresenceRank('away'),
        getPresenceRank('xa'),
        getPresenceRank('dnd'),
      ]
      // Each rank should be <= the next one (allowing ties for null/undefined)
      for (let i = 0; i < ranks.length - 1; i++) {
        expect(ranks[i]).toBeLessThanOrEqual(ranks[i + 1])
      }
    })
  })

  describe('getBestPresenceShow', () => {
    it('should return undefined for empty array', () => {
      expect(getBestPresenceShow([])).toBeUndefined()
    })

    it('should return the only element for single-element array', () => {
      expect(getBestPresenceShow(['away'])).toBe('away')
      expect(getBestPresenceShow(['dnd'])).toBe('dnd')
      expect(getBestPresenceShow([undefined])).toBeUndefined()
    })

    it('should convert null to undefined (both mean online)', () => {
      expect(getBestPresenceShow([null])).toBeUndefined()
    })

    it('should select "chat" over all others', () => {
      expect(getBestPresenceShow(['away', 'chat', 'dnd'])).toBe('chat')
      expect(getBestPresenceShow(['dnd', 'xa', 'chat'])).toBe('chat')
    })

    it('should select "online" (undefined) over away/xa/dnd', () => {
      expect(getBestPresenceShow(['away', undefined, 'dnd'])).toBeUndefined()
      expect(getBestPresenceShow(['xa', null, 'dnd'])).toBeUndefined()
    })

    it('should select "away" over xa/dnd', () => {
      expect(getBestPresenceShow(['xa', 'away', 'dnd'])).toBe('away')
      expect(getBestPresenceShow(['dnd', 'away'])).toBe('away')
    })

    it('should select "xa" over dnd', () => {
      expect(getBestPresenceShow(['dnd', 'xa'])).toBe('xa')
    })

    it('should handle all same values', () => {
      expect(getBestPresenceShow(['away', 'away', 'away'])).toBe('away')
      expect(getBestPresenceShow([undefined, undefined])).toBeUndefined()
    })

    it('should handle realistic multi-resource scenario', () => {
      // User has: desktop (online), mobile (away), tablet (dnd)
      const presences: (PresenceShow | undefined)[] = [undefined, 'away', 'dnd']
      expect(getBestPresenceShow(presences)).toBeUndefined() // online wins
    })

    it('should handle MUC multi-connection scenario', () => {
      // Same user connected with: laptop (chat), phone (away)
      const presences: (PresenceShow | undefined)[] = ['chat', 'away']
      expect(getBestPresenceShow(presences)).toBe('chat')
    })
  })

  describe('getPresenceFromShow', () => {
    it('should return "online" for null (available)', () => {
      expect(getPresenceFromShow(null)).toBe('online')
    })

    it('should return "online" for undefined (available)', () => {
      expect(getPresenceFromShow(undefined)).toBe('online')
    })

    it('should return "online" for "chat" (free to chat)', () => {
      expect(getPresenceFromShow('chat')).toBe('online')
    })

    it('should return "away" for "away"', () => {
      expect(getPresenceFromShow('away')).toBe('away')
    })

    it('should return "away" for "xa" (extended away)', () => {
      expect(getPresenceFromShow('xa')).toBe('away')
    })

    it('should return "dnd" for "dnd"', () => {
      expect(getPresenceFromShow('dnd')).toBe('dnd')
    })

    it('should return "online" for unknown values', () => {
      expect(getPresenceFromShow('unknown' as PresenceShow)).toBe('online')
    })
  })
})
