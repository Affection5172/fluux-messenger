/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useConsole } from './useConsole'
import { consoleStore } from '../stores'
import { XMPPProvider } from '../provider'

// Wrapper component that provides XMPP context
function wrapper({ children }: { children: ReactNode }) {
  return <XMPPProvider>{children}</XMPPProvider>
}

describe('useConsole hook', () => {
  beforeEach(() => {
    // Reset store state before each test
    consoleStore.getState().reset()
  })

  describe('state reactivity', () => {
    it('should reflect isOpen state from store', () => {
      const { result } = renderHook(() => useConsole(), { wrapper })

      expect(result.current.isOpen).toBe(false)

      act(() => {
        consoleStore.getState().setOpen(true)
      })

      expect(result.current.isOpen).toBe(true)
    })

    it('should reflect height state from store', () => {
      const { result } = renderHook(() => useConsole(), { wrapper })

      // Default height is 300
      expect(result.current.height).toBe(300)

      act(() => {
        consoleStore.getState().setHeight(500)
      })

      expect(result.current.height).toBe(500)
    })

    it('should reflect entries from store', () => {
      const { result } = renderHook(() => useConsole(), { wrapper })

      expect(result.current.entries).toHaveLength(0)

      act(() => {
        consoleStore.getState().addPacket('incoming', '<message>Hello</message>')
      })

      expect(result.current.entries).toHaveLength(1)
      expect(result.current.entries[0].type).toBe('incoming')
      expect(result.current.entries[0].content).toBe('<message>Hello</message>')
    })

  })

  describe('toggle action', () => {
    it('should toggle isOpen state', () => {
      const { result } = renderHook(() => useConsole(), { wrapper })

      expect(result.current.isOpen).toBe(false)

      act(() => {
        result.current.toggle()
      })

      expect(result.current.isOpen).toBe(true)

      act(() => {
        result.current.toggle()
      })

      expect(result.current.isOpen).toBe(false)
    })
  })

  describe('setOpen action', () => {
    it('should set isOpen to true', () => {
      const { result } = renderHook(() => useConsole(), { wrapper })

      act(() => {
        result.current.setOpen(true)
      })

      expect(result.current.isOpen).toBe(true)
    })

    it('should set isOpen to false', () => {
      const { result } = renderHook(() => useConsole(), { wrapper })

      // First open it
      act(() => {
        result.current.setOpen(true)
      })

      expect(result.current.isOpen).toBe(true)

      // Then close it
      act(() => {
        result.current.setOpen(false)
      })

      expect(result.current.isOpen).toBe(false)
    })
  })

  describe('setHeight action', () => {
    it('should set height', () => {
      const { result } = renderHook(() => useConsole(), { wrapper })

      act(() => {
        result.current.setHeight(400)
      })

      expect(result.current.height).toBe(400)
    })

    it('should allow any positive height value', () => {
      const { result } = renderHook(() => useConsole(), { wrapper })

      act(() => {
        result.current.setHeight(100)
      })
      expect(result.current.height).toBe(100)

      act(() => {
        result.current.setHeight(1000)
      })
      expect(result.current.height).toBe(1000)
    })
  })

  describe('clearEntries action', () => {
    it('should clear all entries', () => {
      const { result } = renderHook(() => useConsole(), { wrapper })

      // Add some entries
      act(() => {
        consoleStore.getState().addPacket('incoming', '<message/>')
        consoleStore.getState().addPacket('outgoing', '<iq/>')
        consoleStore.getState().addEvent('Connected', 'connection')
      })

      expect(result.current.entries).toHaveLength(3)

      act(() => {
        result.current.clearEntries()
      })

      expect(result.current.entries).toHaveLength(0)
    })
  })

  describe('entry types', () => {
    it('should handle incoming packets', () => {
      const { result } = renderHook(() => useConsole(), { wrapper })

      act(() => {
        consoleStore.getState().addPacket('incoming', '<message from="alice@example.com"/>')
      })

      const entry = result.current.entries[0]
      expect(entry.type).toBe('incoming')
      expect(entry.content).toContain('alice@example.com')
      expect(entry.timestamp).toBeInstanceOf(Date)
      expect(entry.id).toBeDefined()
    })

    it('should handle outgoing packets', () => {
      const { result } = renderHook(() => useConsole(), { wrapper })

      act(() => {
        consoleStore.getState().addPacket('outgoing', '<message to="bob@example.com"/>')
      })

      const entry = result.current.entries[0]
      expect(entry.type).toBe('outgoing')
      expect(entry.content).toContain('bob@example.com')
    })

    it('should handle event entries', () => {
      const { result } = renderHook(() => useConsole(), { wrapper })

      act(() => {
        consoleStore.getState().addEvent('Connection established', 'connection')
      })

      const entry = result.current.entries[0]
      expect(entry.type).toBe('event')
      expect(entry.content).toBe('Connection established')
      expect(entry.eventCategory).toBe('connection')
    })

    it('should handle different event categories', () => {
      const { result } = renderHook(() => useConsole(), { wrapper })

      act(() => {
        consoleStore.getState().addEvent('Connected', 'connection')
        consoleStore.getState().addEvent('Error occurred', 'error')
        consoleStore.getState().addEvent('SM ack received', 'sm')
        consoleStore.getState().addEvent('Presence sent', 'presence')
      })

      expect(result.current.entries[0].eventCategory).toBe('connection')
      expect(result.current.entries[1].eventCategory).toBe('error')
      expect(result.current.entries[2].eventCategory).toBe('sm')
      expect(result.current.entries[3].eventCategory).toBe('presence')
    })
  })

  describe('entry limit', () => {
    it('should limit entries to 500', () => {
      const { result } = renderHook(() => useConsole(), { wrapper })

      // Add more than 500 entries
      act(() => {
        for (let i = 0; i < 510; i++) {
          consoleStore.getState().addPacket('incoming', `<message id="${i}"/>`)
        }
      })

      expect(result.current.entries).toHaveLength(500)
      // Should keep the most recent entries
      expect(result.current.entries[499].content).toContain('id="509"')
    })
  })

  describe('multiple renders', () => {
    it('should maintain consistency across multiple hook renders', () => {
      const { result: result1 } = renderHook(() => useConsole(), { wrapper })
      const { result: result2 } = renderHook(() => useConsole(), { wrapper })

      act(() => {
        result1.current.setOpen(true)
        result1.current.setHeight(600)
      })

      // Both hooks should see the same state
      expect(result2.current.isOpen).toBe(true)
      expect(result2.current.height).toBe(600)
    })
  })
})
