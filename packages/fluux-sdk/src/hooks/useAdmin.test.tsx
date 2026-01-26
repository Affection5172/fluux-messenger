/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useAdmin } from './useAdmin'
import { adminStore } from '../stores'
import { XMPPProvider } from '../provider'
import type { AdminCommand, AdminSession } from '../core/types'
import { createMockXMPPClientForHooks } from '../core/test-utils'

// Create shared mock client
const mockClient = createMockXMPPClientForHooks()

vi.mock('../provider', async () => {
  const actual = await vi.importActual('../provider')
  return {
    ...actual,
    useXMPPContext: () => ({ client: mockClient }),
  }
})

// Wrapper component that provides XMPP context
function wrapper({ children }: { children: ReactNode }) {
  return <XMPPProvider>{children}</XMPPProvider>
}

describe('useAdmin hook', () => {
  beforeEach(() => {
    // Reset store state before each test
    adminStore.getState().reset()
    vi.clearAllMocks()
  })

  describe('state reactivity', () => {
    it('should reflect isAdmin state from store', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      expect(result.current.isAdmin).toBe(false)

      act(() => {
        adminStore.getState().setIsAdmin(true)
      })

      expect(result.current.isAdmin).toBe(true)
    })

    it('should reflect commands state from store', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      expect(result.current.commands).toHaveLength(0)

      const commands: AdminCommand[] = [
        { node: 'add-user', name: 'Add User', category: 'user' },
        { node: 'announce', name: 'Send Announcement', category: 'announcement' },
      ]

      act(() => {
        adminStore.getState().setCommands(commands)
      })

      expect(result.current.commands).toHaveLength(2)
      expect(result.current.commands[0].name).toBe('Add User')
    })

    it('should reflect currentSession state from store', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      expect(result.current.currentSession).toBeNull()

      const session: AdminSession = {
        node: 'add-user',
        sessionId: 'session-1',
        status: 'executing',
        form: {
          type: 'form',
          title: 'Add User',
          fields: [],
        },
      }

      act(() => {
        adminStore.getState().setCurrentSession(session)
      })

      expect(result.current.currentSession).not.toBeNull()
      expect(result.current.currentSession?.node).toBe('add-user')
    })

    it('should reflect loading states from store', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      expect(result.current.isDiscovering).toBe(false)
      expect(result.current.isExecuting).toBe(false)

      act(() => {
        adminStore.getState().setIsDiscovering(true)
      })

      expect(result.current.isDiscovering).toBe(true)

      act(() => {
        adminStore.getState().setIsExecuting(true)
      })

      expect(result.current.isExecuting).toBe(true)
    })

    it('should reflect targetJid state from store', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      expect(result.current.targetJid).toBeNull()

      act(() => {
        adminStore.getState().setTargetJid('user@example.com')
      })

      expect(result.current.targetJid).toBe('user@example.com')
    })
  })

  describe('computed properties', () => {
    it('should compute hasCommands correctly', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      expect(result.current.hasCommands).toBe(false)

      act(() => {
        adminStore.getState().setCommands([
          { node: 'add-user', name: 'Add User', category: 'user' },
        ])
      })

      expect(result.current.hasCommands).toBe(true)
    })

    it('should compute commandsByCategory correctly', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      const commands: AdminCommand[] = [
        { node: 'add-user', name: 'Add User', category: 'user' },
        { node: 'delete-user', name: 'Delete User', category: 'user' },
        { node: 'announce', name: 'Announce', category: 'announcement' },
        { node: 'stats', name: 'Statistics', category: 'stats' },
      ]

      act(() => {
        adminStore.getState().setCommands(commands)
      })

      expect(result.current.commandsByCategory.user).toHaveLength(2)
      expect(result.current.commandsByCategory.announcement).toHaveLength(1)
      expect(result.current.commandsByCategory.stats).toHaveLength(1)
    })

    it('should compute userCommands correctly', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      const commands: AdminCommand[] = [
        { node: 'http://jabber.org/protocol/admin#delete-user', name: 'Delete User', category: 'user' },
        { node: 'http://jabber.org/protocol/admin#add-user', name: 'Add User', category: 'user' },
        { node: 'http://jabber.org/protocol/admin#announce', name: 'Announce', category: 'announcement' },
      ]

      act(() => {
        adminStore.getState().setCommands(commands)
      })

      expect(result.current.userCommands).toHaveLength(1)
      expect(result.current.userCommands[0].node).toBe('http://jabber.org/protocol/admin#delete-user')
    })

    it('should compute isSessionActive correctly', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      expect(result.current.isSessionActive).toBe(false)

      act(() => {
        adminStore.getState().setCurrentSession({
          node: 'add-user',
          sessionId: 'session-1',
          status: 'executing',
          form: { type: 'form', fields: [] },
        })
      })

      expect(result.current.isSessionActive).toBe(true)

      act(() => {
        adminStore.getState().setCurrentSession({
          node: 'add-user',
          sessionId: 'session-1',
          status: 'completed',
          form: { type: 'result', fields: [] },
        })
      })

      expect(result.current.isSessionActive).toBe(false)
    })

    it('should compute canGoBack and canGoNext correctly', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      expect(result.current.canGoBack).toBe(false)
      expect(result.current.canGoNext).toBe(false)

      act(() => {
        adminStore.getState().setCurrentSession({
          node: 'wizard',
          sessionId: 'session-1',
          status: 'executing',
          form: { type: 'form', fields: [] },
          actions: ['prev', 'next'],
        })
      })

      expect(result.current.canGoBack).toBe(true)
      expect(result.current.canGoNext).toBe(true)
    })

    it('should compute hasMoreUsers correctly', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      expect(result.current.hasMoreUsers).toBe(false)

      act(() => {
        adminStore.getState().setUserList({
          pagination: { last: 'user10@example.com' },
        })
      })

      expect(result.current.hasMoreUsers).toBe(true)
    })

    it('should compute hasMoreRooms correctly', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      expect(result.current.hasMoreRooms).toBe(false)

      act(() => {
        adminStore.getState().setRoomList({
          pagination: { last: 'room10@conference.example.com' },
        })
      })

      expect(result.current.hasMoreRooms).toBe(true)
    })
  })

  describe('actions', () => {
    it('should call client.executeAdminCommand when executeCommand is called', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      mockClient.admin.executeAdminCommand.mockResolvedValue(undefined)

      await act(async () => {
        await result.current.executeCommand('add-user')
      })

      expect(mockClient.admin.executeAdminCommand).toHaveBeenCalledWith('add-user', 'execute')
    })

    it('should call client.executeAdminCommand with form data when submitForm is called', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      // Set up a session first
      act(() => {
        adminStore.getState().setCurrentSession({
          node: 'add-user',
          sessionId: 'session-1',
          status: 'executing',
          form: { type: 'form', fields: [] },
        })
      })

      mockClient.admin.executeAdminCommand.mockResolvedValue(undefined)

      await act(async () => {
        await result.current.submitForm({ username: 'newuser', password: 'pass123' })
      })

      expect(mockClient.admin.executeAdminCommand).toHaveBeenCalledWith(
        'add-user',
        'complete',
        'session-1',
        { username: 'newuser', password: 'pass123' }
      )
    })

    it('should use next action when session has next action available', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      // Set up a multi-step session with next action
      act(() => {
        adminStore.getState().setCurrentSession({
          node: 'wizard',
          sessionId: 'session-1',
          status: 'executing',
          form: { type: 'form', fields: [] },
          actions: ['prev', 'next'],
        })
      })

      mockClient.admin.executeAdminCommand.mockResolvedValue(undefined)

      await act(async () => {
        await result.current.submitForm({ step1: 'data' })
      })

      expect(mockClient.admin.executeAdminCommand).toHaveBeenCalledWith(
        'wizard',
        'next',
        'session-1',
        { step1: 'data' }
      )
    })

    it('should call client.executeAdminCommand with prev action when previousStep is called', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      // Set up a session with prev action
      act(() => {
        adminStore.getState().setCurrentSession({
          node: 'wizard',
          sessionId: 'session-1',
          status: 'executing',
          form: { type: 'form', fields: [] },
          actions: ['prev', 'next'],
        })
      })

      mockClient.admin.executeAdminCommand.mockResolvedValue(undefined)

      await act(async () => {
        await result.current.previousStep()
      })

      expect(mockClient.admin.executeAdminCommand).toHaveBeenCalledWith('wizard', 'prev', 'session-1')
    })

    it('should throw error when previousStep called without prev action', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      // Set up a session without prev action
      act(() => {
        adminStore.getState().setCurrentSession({
          node: 'add-user',
          sessionId: 'session-1',
          status: 'executing',
          form: { type: 'form', fields: [] },
        })
      })

      await expect(async () => {
        await result.current.previousStep()
      }).rejects.toThrow('Cannot go to previous step')
    })

    it('should call client.cancelAdminCommand when cancelCommand is called', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      mockClient.admin.cancelAdminCommand.mockResolvedValue(undefined)

      await act(async () => {
        await result.current.cancelCommand()
      })

      expect(mockClient.admin.cancelAdminCommand).toHaveBeenCalled()
    })

    it('should clear session and targetJid when clearSession is called', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      // Set up session and target
      act(() => {
        adminStore.getState().setCurrentSession({
          node: 'add-user',
          sessionId: 'session-1',
          status: 'executing',
          form: { type: 'form', fields: [] },
        })
        adminStore.getState().setTargetJid('user@example.com')
      })

      expect(result.current.currentSession).not.toBeNull()
      expect(result.current.targetJid).toBe('user@example.com')

      act(() => {
        result.current.clearSession()
      })

      expect(result.current.currentSession).toBeNull()
      expect(result.current.targetJid).toBeNull()
    })

    it('should set targetJid and execute command when executeCommandForUser is called', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      mockClient.admin.executeAdminCommand.mockResolvedValue(undefined)

      await act(async () => {
        await result.current.executeCommandForUser(
          'http://jabber.org/protocol/admin#delete-user',
          'target@example.com'
        )
      })

      expect(adminStore.getState().targetJid).toBe('target@example.com')
      expect(mockClient.admin.executeAdminCommand).toHaveBeenCalledWith(
        'http://jabber.org/protocol/admin#delete-user',
        'execute'
      )
    })

    it('should clear targetJid when clearTargetJid is called', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      act(() => {
        adminStore.getState().setTargetJid('user@example.com')
      })

      expect(result.current.targetJid).toBe('user@example.com')

      act(() => {
        result.current.clearTargetJid()
      })

      expect(result.current.targetJid).toBeNull()
    })
  })

  describe('entity list management', () => {
    it('should fetch users and update store', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      const mockResult = {
        users: [
          { jid: 'user1@example.com', username: 'user1' },
          { jid: 'user2@example.com', username: 'user2' },
        ],
        pagination: { count: 2 },
      }

      mockClient.admin.fetchUserList.mockResolvedValue(mockResult)

      await act(async () => {
        await result.current.fetchUsers()
      })

      expect(mockClient.admin.fetchUserList).toHaveBeenCalled()
      expect(result.current.userList.items).toHaveLength(2)
      expect(result.current.userList.hasFetched).toBe(true)
    })

    it('should handle user fetch error', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      mockClient.admin.fetchUserList.mockRejectedValue(new Error('Network error'))

      await act(async () => {
        await expect(result.current.fetchUsers()).rejects.toThrow('Network error')
      })

      expect(result.current.userList.error).toBe('Network error')
      expect(result.current.userList.hasFetched).toBe(true)
    })

    it('should reset user list when resetUserList is called', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      act(() => {
        adminStore.getState().setUserList({
          items: [{ jid: 'user@example.com', username: 'user' }],
          hasFetched: true,
        })
      })

      expect(result.current.userList.items).toHaveLength(1)

      act(() => {
        result.current.resetUserList()
      })

      expect(result.current.userList.items).toHaveLength(0)
      expect(result.current.userList.hasFetched).toBe(false)
    })

    it('should fetch rooms and update store', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      const mockResult = {
        rooms: [
          { jid: 'room1@conference.example.com', name: 'Room 1' },
        ],
        pagination: {},
      }

      mockClient.admin.fetchRoomList.mockResolvedValue(mockResult)

      await act(async () => {
        await result.current.fetchRooms()
      })

      expect(mockClient.admin.fetchRoomList).toHaveBeenCalled()
      expect(result.current.roomList.items).toHaveLength(1)
    })

    it('should set active category', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      expect(result.current.activeCategory).toBeNull()

      act(() => {
        result.current.setActiveCategory('users')
      })

      expect(result.current.activeCategory).toBe('users')
    })
  })

  describe('vhost management', () => {
    it('should fetch vhosts', async () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      mockClient.admin.fetchVhosts.mockResolvedValue(['example.com', 'other.com'])

      await act(async () => {
        await result.current.fetchVhosts()
      })

      expect(mockClient.admin.fetchVhosts).toHaveBeenCalled()
    })

    it('should set selected vhost', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper })

      act(() => {
        adminStore.getState().setVhosts(['example.com', 'other.com'])
      })

      expect(result.current.selectedVhost).toBeNull()

      act(() => {
        result.current.setSelectedVhost('other.com')
      })

      expect(result.current.selectedVhost).toBe('other.com')
    })
  })
})
