import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMessageScroll } from './useMessageScroll'

describe('useMessageScroll', () => {
  let mockScrollElement: {
    scrollTop: number
    scrollHeight: number
    clientHeight: number
  }

  beforeEach(() => {
    vi.useFakeTimers()
    // Create a mock scroll element
    mockScrollElement = {
      scrollTop: 0,
      scrollHeight: 1000,
      clientHeight: 500,
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should return all required properties', () => {
      const { result } = renderHook(() => useMessageScroll())

      expect(result.current.scrollRef).toBeDefined()
      expect(result.current.isAtBottomRef).toBeDefined()
      expect(result.current.scrollToBottomIfNeeded).toBeDefined()
      expect(result.current.scrollToBottom).toBeDefined()
      expect(result.current.handleScroll).toBeDefined()
      expect(result.current.resetScrollState).toBeDefined()
    })

    it('should start with isAtBottom as true', () => {
      const { result } = renderHook(() => useMessageScroll())
      expect(result.current.isAtBottomRef.current).toBe(true)
    })
  })

  describe('scrollToBottom', () => {
    it('should set scrollTop to scrollHeight', () => {
      const { result } = renderHook(() => useMessageScroll())

      // Manually assign mock element to ref
      Object.defineProperty(result.current.scrollRef, 'current', {
        value: mockScrollElement,
        writable: true,
      })

      act(() => {
        result.current.scrollToBottom()
      })

      expect(mockScrollElement.scrollTop).toBe(1000)
    })

    it('should do nothing if scrollRef is null', () => {
      const { result } = renderHook(() => useMessageScroll())

      // scrollRef.current is null by default
      act(() => {
        result.current.scrollToBottom()
      })

      // Should not throw
      expect(true).toBe(true)
    })
  })

  describe('scrollToBottomIfNeeded', () => {
    it('should scroll if isAtBottom is true', () => {
      const { result } = renderHook(() => useMessageScroll())

      Object.defineProperty(result.current.scrollRef, 'current', {
        value: mockScrollElement,
        writable: true,
      })

      // isAtBottom is true by default
      act(() => {
        result.current.scrollToBottomIfNeeded()
      })

      expect(mockScrollElement.scrollTop).toBe(1000)
    })

    it('should not scroll if isAtBottom is false', () => {
      const { result } = renderHook(() => useMessageScroll())

      Object.defineProperty(result.current.scrollRef, 'current', {
        value: mockScrollElement,
        writable: true,
      })

      // Set initial scrollTop
      mockScrollElement.scrollTop = 200

      // Mark as not at bottom
      result.current.isAtBottomRef.current = false

      act(() => {
        result.current.scrollToBottomIfNeeded()
      })

      // Should not have changed
      expect(mockScrollElement.scrollTop).toBe(200)
    })
  })

  describe('handleScroll', () => {
    it('should set isAtBottom to true when within threshold (50px)', () => {
      const { result } = renderHook(() => useMessageScroll())

      // Position: scrollHeight(1000) - scrollTop(460) - clientHeight(500) = 40px from bottom
      mockScrollElement.scrollTop = 460

      Object.defineProperty(result.current.scrollRef, 'current', {
        value: mockScrollElement,
        writable: true,
      })

      result.current.isAtBottomRef.current = false

      act(() => {
        result.current.handleScroll()
      })

      expect(result.current.isAtBottomRef.current).toBe(true)
    })

    it('should set isAtBottom to false when scrolled up beyond threshold', () => {
      const { result } = renderHook(() => useMessageScroll())

      // Position: scrollHeight(1000) - scrollTop(300) - clientHeight(500) = 200px from bottom
      mockScrollElement.scrollTop = 300

      Object.defineProperty(result.current.scrollRef, 'current', {
        value: mockScrollElement,
        writable: true,
      })

      act(() => {
        result.current.handleScroll()
      })

      expect(result.current.isAtBottomRef.current).toBe(false)
    })

    it('should set isAtBottom to true when exactly at bottom', () => {
      const { result } = renderHook(() => useMessageScroll())

      // Position: scrollHeight(1000) - scrollTop(500) - clientHeight(500) = 0px from bottom
      mockScrollElement.scrollTop = 500

      Object.defineProperty(result.current.scrollRef, 'current', {
        value: mockScrollElement,
        writable: true,
      })

      act(() => {
        result.current.handleScroll()
      })

      expect(result.current.isAtBottomRef.current).toBe(true)
    })

    it('should do nothing if scrollRef is null', () => {
      const { result } = renderHook(() => useMessageScroll())

      act(() => {
        result.current.handleScroll()
      })

      // Should not throw, isAtBottom unchanged
      expect(result.current.isAtBottomRef.current).toBe(true)
    })
  })

  describe('resetScrollState', () => {
    it('should set isAtBottom to true', () => {
      const { result } = renderHook(() => useMessageScroll())

      result.current.isAtBottomRef.current = false

      act(() => {
        result.current.resetScrollState()
      })

      expect(result.current.isAtBottomRef.current).toBe(true)
    })

    it('should scroll to bottom after animation frame', () => {
      const { result } = renderHook(() => useMessageScroll())

      Object.defineProperty(result.current.scrollRef, 'current', {
        value: mockScrollElement,
        writable: true,
      })

      act(() => {
        result.current.resetScrollState()
        // Run requestAnimationFrame callback
        vi.runAllTimers()
      })

      expect(mockScrollElement.scrollTop).toBe(1000)
    })
  })

  describe('auto-scroll on dependencies', () => {
    it('should call scrollToBottomIfNeeded when dependencies change', () => {
      let counter = 0
      const { result, rerender } = renderHook(
        ({ deps }) => useMessageScroll(deps),
        { initialProps: { deps: [counter] } }
      )

      Object.defineProperty(result.current.scrollRef, 'current', {
        value: mockScrollElement,
        writable: true,
      })

      // Initial scroll position
      mockScrollElement.scrollTop = 0

      // Rerender with new deps
      counter = 1
      rerender({ deps: [counter] })

      // Should have auto-scrolled (isAtBottom was true)
      expect(mockScrollElement.scrollTop).toBe(1000)
    })

    it('should not auto-scroll when isAtBottom is false', () => {
      let counter = 0
      const { result, rerender } = renderHook(
        ({ deps }) => useMessageScroll(deps),
        { initialProps: { deps: [counter] } }
      )

      Object.defineProperty(result.current.scrollRef, 'current', {
        value: mockScrollElement,
        writable: true,
      })

      // Set scroll position and mark as not at bottom
      mockScrollElement.scrollTop = 200
      result.current.isAtBottomRef.current = false

      // Rerender with new deps
      counter = 1
      rerender({ deps: [counter] })

      // Should not have scrolled
      expect(mockScrollElement.scrollTop).toBe(200)
    })
  })
})
