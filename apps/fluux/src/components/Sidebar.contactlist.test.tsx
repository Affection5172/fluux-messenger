/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'

/**
 * Tests for ContactList highlighting logic.
 *
 * The key behavior: keyboard selection (selectedIndex) should take precedence
 * over active contact (activeContactJid) for highlighting during navigation.
 */
describe('ContactList highlighting logic', () => {
  // This mirrors the logic at Sidebar.tsx line ~1134
  const computeSelectedJid = (
    selectedIndex: number,
    flatContactList: Array<{ jid: string }>,
    activeContactJid: string | null | undefined
  ): string | null => {
    return selectedIndex >= 0
      ? (flatContactList[selectedIndex]?.jid ?? null)
      : (activeContactJid ?? null)
  }

  const contacts = [
    { jid: 'alice@example.com' },
    { jid: 'bob@example.com' },
    { jid: 'charlie@example.com' },
  ]

  it('should highlight keyboard-selected contact over active contact', () => {
    // User has bob open (active), but navigates to alice with keyboard
    const activeContactJid = 'bob@example.com'
    const selectedIndex = 0 // alice

    const result = computeSelectedJid(selectedIndex, contacts, activeContactJid)

    // Keyboard selection should win
    expect(result).toBe('alice@example.com')
  })

  it('should highlight active contact when no keyboard selection', () => {
    // No keyboard navigation active (selectedIndex = -1)
    const activeContactJid = 'bob@example.com'
    const selectedIndex = -1

    const result = computeSelectedJid(selectedIndex, contacts, activeContactJid)

    // Should fall back to active contact
    expect(result).toBe('bob@example.com')
  })

  it('should return null when no selection and no active contact', () => {
    const activeContactJid = null
    const selectedIndex = -1

    const result = computeSelectedJid(selectedIndex, contacts, activeContactJid)

    expect(result).toBeNull()
  })

  it('should handle undefined activeContactJid', () => {
    const activeContactJid = undefined
    const selectedIndex = -1

    const result = computeSelectedJid(selectedIndex, contacts, activeContactJid)

    expect(result).toBeNull()
  })

  it('should return null if selectedIndex points to non-existent contact', () => {
    const activeContactJid = 'bob@example.com'
    const selectedIndex = 999 // out of bounds

    const result = computeSelectedJid(selectedIndex, contacts, activeContactJid)

    // Should return null (not fall back to activeContactJid)
    expect(result).toBeNull()
  })

  it('should highlight last contact when navigating to end', () => {
    const activeContactJid = 'alice@example.com'
    const selectedIndex = 2 // charlie (last)

    const result = computeSelectedJid(selectedIndex, contacts, activeContactJid)

    expect(result).toBe('charlie@example.com')
  })
})
