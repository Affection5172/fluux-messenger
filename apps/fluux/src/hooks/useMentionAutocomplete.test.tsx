import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMentionAutocomplete } from './useMentionAutocomplete'
import type { RoomOccupant } from '@fluux/sdk'

// Helper to create occupants map
function createOccupants(nicks: string[]): Map<string, RoomOccupant> {
  const map = new Map<string, RoomOccupant>()
  for (const nick of nicks) {
    map.set(nick, {
      jid: `room@conference.example.com/${nick}`,
      nick,
      affiliation: 'member',
      role: 'participant',
    })
  }
  return map
}

describe('useMentionAutocomplete', () => {
  const roomJid = 'room@conference.example.com'
  const ownNickname = 'myself'

  describe('trigger detection', () => {
    it('should not be active when no @ is typed', () => {
      const occupants = createOccupants(['alice', 'bob'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('hello world', 11, occupants, ownNickname, roomJid)
      )

      expect(result.current.state.isActive).toBe(false)
    })

    it('should be active when @ is typed at start', () => {
      const occupants = createOccupants(['alice', 'bob'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('@', 1, occupants, ownNickname, roomJid)
      )

      expect(result.current.state.isActive).toBe(true)
      expect(result.current.state.query).toBe('')
      expect(result.current.state.triggerIndex).toBe(0)
    })

    it('should be active when @ is typed after whitespace', () => {
      const occupants = createOccupants(['alice', 'bob'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('hello @a', 8, occupants, ownNickname, roomJid)
      )

      expect(result.current.state.isActive).toBe(true)
      expect(result.current.state.query).toBe('a')
      expect(result.current.state.triggerIndex).toBe(6)
    })

    it('should not be active when @ is in the middle of a word', () => {
      const occupants = createOccupants(['alice', 'bob'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('email@example', 13, occupants, ownNickname, roomJid)
      )

      expect(result.current.state.isActive).toBe(false)
    })

    it('should not be active when query contains whitespace', () => {
      const occupants = createOccupants(['alice', 'bob'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('@alice smith', 12, occupants, ownNickname, roomJid)
      )

      expect(result.current.state.isActive).toBe(false)
    })
  })

  describe('matching', () => {
    it('should match @all when query starts with "a"', () => {
      const occupants = createOccupants(['bob', 'charlie'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('@a', 2, occupants, ownNickname, roomJid)
      )

      expect(result.current.state.matches).toContainEqual({
        nick: 'all',
        isAll: true,
      })
    })

    it('should match occupants by prefix', () => {
      const occupants = createOccupants(['alice', 'albert', 'bob'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('@al', 3, occupants, ownNickname, roomJid)
      )

      const nicks = result.current.state.matches.map((m) => m.nick)
      expect(nicks).toContain('all')
      expect(nicks).toContain('alice')
      expect(nicks).toContain('albert')
      expect(nicks).not.toContain('bob')
    })

    it('should exclude own nickname from matches', () => {
      const occupants = createOccupants(['myself', 'alice', 'bob'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('@', 1, occupants, 'myself', roomJid)
      )

      const nicks = result.current.state.matches.map((m) => m.nick)
      expect(nicks).not.toContain('myself')
      expect(nicks).toContain('alice')
      expect(nicks).toContain('bob')
    })

    it('should match case-insensitively', () => {
      const occupants = createOccupants(['Alice', 'BOB'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('@ali', 4, occupants, ownNickname, roomJid)
      )

      const nicks = result.current.state.matches.map((m) => m.nick)
      expect(nicks).toContain('Alice')
    })

    it('should sort matches alphabetically', () => {
      const occupants = createOccupants(['charlie', 'alice', 'bob'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('@', 1, occupants, ownNickname, roomJid)
      )

      // @all comes first, then sorted occupants
      const nicks = result.current.state.matches.map((m) => m.nick)
      expect(nicks[0]).toBe('all')
      expect(nicks[1]).toBe('alice')
      expect(nicks[2]).toBe('bob')
      expect(nicks[3]).toBe('charlie')
    })

    it('should not be active when no matches', () => {
      const occupants = createOccupants(['alice', 'bob'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('@xyz', 4, occupants, ownNickname, roomJid)
      )

      expect(result.current.state.isActive).toBe(false)
      expect(result.current.state.matches).toHaveLength(0)
    })
  })

  describe('selectMatch', () => {
    it('should replace @query with @nick and trailing space', () => {
      const occupants = createOccupants(['alice', 'bob'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('@ali', 4, occupants, ownNickname, roomJid)
      )

      // Find alice in matches
      const aliceIndex = result.current.state.matches.findIndex((m) => m.nick === 'alice')
      const { newText, newCursorPosition } = result.current.selectMatch(aliceIndex)

      expect(newText).toBe('@alice ')
      expect(newCursorPosition).toBe(7)
    })

    it('should insert mention in the middle of text', () => {
      const occupants = createOccupants(['alice', 'bob'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('hey @a check this', 6, occupants, ownNickname, roomJid)
      )

      const aliceIndex = result.current.state.matches.findIndex((m) => m.nick === 'alice')
      const { newText, newCursorPosition } = result.current.selectMatch(aliceIndex)

      expect(newText).toBe('hey @alice  check this')
      expect(newCursorPosition).toBe(11)
    })

    it('should return correct reference for user mention', () => {
      const occupants = createOccupants(['alice'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('@a', 2, occupants, ownNickname, roomJid)
      )

      const aliceIndex = result.current.state.matches.findIndex((m) => m.nick === 'alice')
      const { reference } = result.current.selectMatch(aliceIndex)

      expect(reference).toEqual({
        begin: 0,
        end: 6, // @alice
        type: 'mention',
        uri: 'xmpp:room@conference.example.com/alice',
      })
    })

    it('should return correct reference for @all mention', () => {
      const occupants = createOccupants(['alice'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('@a', 2, occupants, ownNickname, roomJid)
      )

      const allIndex = result.current.state.matches.findIndex((m) => m.isAll)
      const { reference } = result.current.selectMatch(allIndex)

      expect(reference).toEqual({
        begin: 0,
        end: 4, // @all
        type: 'mention',
        uri: 'xmpp:room@conference.example.com',
      })
    })
  })

  describe('moveSelection', () => {
    it('should move selection down', () => {
      const occupants = createOccupants(['alice', 'bob', 'charlie'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('@', 1, occupants, ownNickname, roomJid)
      )

      expect(result.current.state.selectedIndex).toBe(0)

      act(() => {
        result.current.moveSelection('down')
      })

      expect(result.current.state.selectedIndex).toBe(1)
    })

    it('should move selection up', () => {
      const occupants = createOccupants(['alice', 'bob'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('@', 1, occupants, ownNickname, roomJid)
      )

      // Move down first
      act(() => {
        result.current.moveSelection('down')
      })
      expect(result.current.state.selectedIndex).toBe(1)

      // Move back up
      act(() => {
        result.current.moveSelection('up')
      })
      expect(result.current.state.selectedIndex).toBe(0)
    })

    it('should wrap around when moving down past last item', () => {
      const occupants = createOccupants(['alice'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('@', 1, occupants, ownNickname, roomJid)
      )

      // Matches: @all, alice (2 items)
      expect(result.current.state.matches).toHaveLength(2)

      act(() => {
        result.current.moveSelection('down')
        result.current.moveSelection('down')
      })

      expect(result.current.state.selectedIndex).toBe(0)
    })

    it('should wrap around when moving up past first item', () => {
      const occupants = createOccupants(['alice'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('@', 1, occupants, ownNickname, roomJid)
      )

      // Matches: @all, alice (2 items)
      act(() => {
        result.current.moveSelection('up')
      })

      expect(result.current.state.selectedIndex).toBe(1)
    })
  })

  describe('dismiss', () => {
    it('should reset selection when dismiss is called', () => {
      const occupants = createOccupants(['alice', 'bob', 'charlie'])
      const { result } = renderHook(() =>
        useMentionAutocomplete('@', 1, occupants, ownNickname, roomJid)
      )

      // Move selection
      act(() => {
        result.current.moveSelection('down')
        result.current.moveSelection('down')
      })

      expect(result.current.state.selectedIndex).toBe(2)

      // Dismiss should reset selection
      act(() => {
        result.current.dismiss()
      })

      expect(result.current.state.selectedIndex).toBe(0)
    })
  })
})
