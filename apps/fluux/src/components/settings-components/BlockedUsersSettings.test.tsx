import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BlockedUsersSettings } from './BlockedUsersSettings'

// Mock SDK
const mockBlockJid = vi.fn()
const mockUnblockJid = vi.fn()
const mockUnblockAll = vi.fn()
const mockFetchBlocklist = vi.fn()
let mockBlockedJids: string[] = []

vi.mock('@fluux/sdk', () => ({
  useBlocking: () => ({
    blockedJids: mockBlockedJids,
    blockJid: mockBlockJid,
    unblockJid: mockUnblockJid,
    unblockAll: mockUnblockAll,
    fetchBlocklist: mockFetchBlocklist,
  }),
  getLocalPart: (jid: string) => jid.split('@')[0],
  generateConsistentColorHexSync: () => '#5865f2',
}))

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'settings.blocked.title': 'Blocked Users',
        'settings.blocked.description': 'Blocked contacts cannot send you messages.',
        'settings.blocked.addManually': 'Block a user by JID',
        'settings.blocked.jidPlaceholder': 'user@example.com',
        'settings.blocked.block': 'Block',
        'settings.blocked.invalidJid': 'Please enter a valid JID',
        'settings.blocked.alreadyBlocked': 'This user is already blocked',
        'settings.blocked.blockFailed': 'Failed to block user',
        'settings.blocked.empty': "You haven't blocked anyone",
        'settings.blocked.unblock': 'Unblock',
        'settings.blocked.unblockAll': 'Unblock All',
        'settings.blocked.searchPlaceholder': 'Search...',
        'settings.blocked.noResults': 'No results',
        'settings.blocked.confirmUnblockAll': 'Unblock all?',
        'common.cancel': 'Cancel',
      }
      return translations[key] || key
    },
  }),
}))

describe('BlockedUsersSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBlockedJids = []
    mockBlockJid.mockResolvedValue(undefined)
  })

  describe('add block form', () => {
    it('should show add button when form is not open', () => {
      render(<BlockedUsersSettings />)

      expect(screen.getByText('Block a user by JID')).toBeInTheDocument()
    })

    it('should show form when add button is clicked', async () => {
      render(<BlockedUsersSettings />)

      fireEvent.click(screen.getByText('Block a user by JID'))

      expect(screen.getByPlaceholderText('user@example.com')).toBeInTheDocument()
      expect(screen.getByText('Block')).toBeInTheDocument()
    })

    it('should hide form when cancel button is clicked', async () => {
      render(<BlockedUsersSettings />)

      // Open form
      fireEvent.click(screen.getByText('Block a user by JID'))
      expect(screen.getByPlaceholderText('user@example.com')).toBeInTheDocument()

      // Click cancel (X button)
      const cancelButton = screen.getByRole('button', { name: '' }) // X button has no text
      fireEvent.click(cancelButton)

      // Form should be hidden, add button visible
      expect(screen.getByText('Block a user by JID')).toBeInTheDocument()
    })

    it('should hide form when Escape is pressed', async () => {
      render(<BlockedUsersSettings />)

      fireEvent.click(screen.getByText('Block a user by JID'))
      const input = screen.getByPlaceholderText('user@example.com')

      fireEvent.keyDown(input, { key: 'Escape' })

      expect(screen.getByText('Block a user by JID')).toBeInTheDocument()
    })

    it('should show error for invalid JID (missing @)', () => {
      render(<BlockedUsersSettings />)

      fireEvent.click(screen.getByText('Block a user by JID'))
      const input = screen.getByPlaceholderText('user@example.com')

      fireEvent.change(input, { target: { value: 'invalidjid' } })
      fireEvent.click(screen.getByText('Block'))

      expect(screen.getByText('Please enter a valid JID')).toBeInTheDocument()
      expect(mockBlockJid).not.toHaveBeenCalled()
    })

    it('should show error for already blocked JID', () => {
      mockBlockedJids = ['existing@example.com']
      render(<BlockedUsersSettings />)

      fireEvent.click(screen.getByText('Block a user by JID'))
      const input = screen.getByPlaceholderText('user@example.com')

      fireEvent.change(input, { target: { value: 'existing@example.com' } })
      fireEvent.click(screen.getByText('Block'))

      expect(screen.getByText('This user is already blocked')).toBeInTheDocument()
      expect(mockBlockJid).not.toHaveBeenCalled()
    })

    it('should call blockJid with valid JID', async () => {
      render(<BlockedUsersSettings />)

      fireEvent.click(screen.getByText('Block a user by JID'))
      const input = screen.getByPlaceholderText('user@example.com')

      fireEvent.change(input, { target: { value: 'spam@example.com' } })
      fireEvent.click(screen.getByText('Block'))

      await waitFor(() => {
        expect(mockBlockJid).toHaveBeenCalledWith('spam@example.com')
      })
    })

    it('should close form on successful block', async () => {
      render(<BlockedUsersSettings />)

      fireEvent.click(screen.getByText('Block a user by JID'))
      const input = screen.getByPlaceholderText('user@example.com')

      fireEvent.change(input, { target: { value: 'spam@example.com' } })
      fireEvent.click(screen.getByText('Block'))

      await waitFor(() => {
        expect(screen.getByText('Block a user by JID')).toBeInTheDocument()
      })
    })

    it('should submit form when Enter is pressed', async () => {
      render(<BlockedUsersSettings />)

      fireEvent.click(screen.getByText('Block a user by JID'))
      const input = screen.getByPlaceholderText('user@example.com')

      fireEvent.change(input, { target: { value: 'spam@example.com' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        expect(mockBlockJid).toHaveBeenCalledWith('spam@example.com')
      })
    })

    it('should trim whitespace from JID', async () => {
      render(<BlockedUsersSettings />)

      fireEvent.click(screen.getByText('Block a user by JID'))
      const input = screen.getByPlaceholderText('user@example.com')

      fireEvent.change(input, { target: { value: '  spam@example.com  ' } })
      fireEvent.click(screen.getByText('Block'))

      await waitFor(() => {
        expect(mockBlockJid).toHaveBeenCalledWith('spam@example.com')
      })
    })

    it('should clear error when input changes', () => {
      render(<BlockedUsersSettings />)

      fireEvent.click(screen.getByText('Block a user by JID'))
      const input = screen.getByPlaceholderText('user@example.com')

      // Trigger error
      fireEvent.change(input, { target: { value: 'invalidjid' } })
      fireEvent.click(screen.getByText('Block'))
      expect(screen.getByText('Please enter a valid JID')).toBeInTheDocument()

      // Type more - error should clear
      fireEvent.change(input, { target: { value: 'invalidjid@' } })
      expect(screen.queryByText('Please enter a valid JID')).not.toBeInTheDocument()
    })

    it('should show error when blockJid fails', async () => {
      // Suppress expected console.error from the component
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockBlockJid.mockRejectedValue(new Error('Network error'))
      render(<BlockedUsersSettings />)

      fireEvent.click(screen.getByText('Block a user by JID'))
      const input = screen.getByPlaceholderText('user@example.com')

      fireEvent.change(input, { target: { value: 'spam@example.com' } })
      fireEvent.click(screen.getByText('Block'))

      await waitFor(() => {
        expect(screen.getByText('Failed to block user')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })

    it('should disable block button when input is empty', () => {
      render(<BlockedUsersSettings />)

      fireEvent.click(screen.getByText('Block a user by JID'))

      const blockButton = screen.getByRole('button', { name: /Block/i })
      expect(blockButton).toBeDisabled()
    })
  })

  describe('blocked users list', () => {
    it('should show empty state when no users blocked', () => {
      render(<BlockedUsersSettings />)

      expect(screen.getByText("You haven't blocked anyone")).toBeInTheDocument()
    })

    it('should show blocked users', () => {
      mockBlockedJids = ['spam@example.com', 'troll@example.com']
      render(<BlockedUsersSettings />)

      expect(screen.getByText('spam')).toBeInTheDocument()
      expect(screen.getByText('troll')).toBeInTheDocument()
    })

    it('should fetch blocklist on mount', () => {
      render(<BlockedUsersSettings />)

      expect(mockFetchBlocklist).toHaveBeenCalled()
    })
  })
})
