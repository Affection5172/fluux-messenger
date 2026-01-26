import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTypeToFocus } from './useTypeToFocus'

describe('useTypeToFocus', () => {
  const mockFocus = vi.fn()

  // Generic focusable ref - works with any element that has focus()
  const createMockRef = () => ({
    current: {
      focus: mockFocus,
    },
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should focus composer when printable key is pressed', () => {
    const ref = createMockRef()
    renderHook(() => useTypeToFocus(ref))

    // Simulate pressing 'a' key
    const event = new KeyboardEvent('keydown', {
      key: 'a',
      bubbles: true,
    })
    window.dispatchEvent(event)

    expect(mockFocus).toHaveBeenCalledTimes(1)
  })

  it('should not focus when Ctrl modifier is pressed', () => {
    const ref = createMockRef()
    renderHook(() => useTypeToFocus(ref))

    // Simulate Ctrl+C
    const event = new KeyboardEvent('keydown', {
      key: 'c',
      ctrlKey: true,
      bubbles: true,
    })
    window.dispatchEvent(event)

    expect(mockFocus).not.toHaveBeenCalled()
  })

  it('should not focus when Meta (Cmd) modifier is pressed', () => {
    const ref = createMockRef()
    renderHook(() => useTypeToFocus(ref))

    // Simulate Cmd+V
    const event = new KeyboardEvent('keydown', {
      key: 'v',
      metaKey: true,
      bubbles: true,
    })
    window.dispatchEvent(event)

    expect(mockFocus).not.toHaveBeenCalled()
  })

  it('should not focus when Alt modifier is pressed', () => {
    const ref = createMockRef()
    renderHook(() => useTypeToFocus(ref))

    // Simulate Alt+1
    const event = new KeyboardEvent('keydown', {
      key: '1',
      altKey: true,
      bubbles: true,
    })
    window.dispatchEvent(event)

    expect(mockFocus).not.toHaveBeenCalled()
  })

  it('should not focus when target is an input element', () => {
    const ref = createMockRef()
    renderHook(() => useTypeToFocus(ref))

    // Create an input element
    const input = document.createElement('input')
    document.body.appendChild(input)

    // Simulate pressing 'a' in an input
    const event = new KeyboardEvent('keydown', {
      key: 'a',
      bubbles: true,
    })
    Object.defineProperty(event, 'target', { value: input })
    window.dispatchEvent(event)

    expect(mockFocus).not.toHaveBeenCalled()

    document.body.removeChild(input)
  })

  it('should not focus when target is a textarea element', () => {
    const ref = createMockRef()
    renderHook(() => useTypeToFocus(ref))

    // Create a textarea element
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)

    const event = new KeyboardEvent('keydown', {
      key: 'x',
      bubbles: true,
    })
    Object.defineProperty(event, 'target', { value: textarea })
    window.dispatchEvent(event)

    expect(mockFocus).not.toHaveBeenCalled()

    document.body.removeChild(textarea)
  })

  it('should not focus on function keys', () => {
    const ref = createMockRef()
    renderHook(() => useTypeToFocus(ref))

    // Simulate F1 key
    const event = new KeyboardEvent('keydown', {
      key: 'F1',
      bubbles: true,
    })
    window.dispatchEvent(event)

    expect(mockFocus).not.toHaveBeenCalled()
  })

  it('should not focus on non-printable keys like Escape', () => {
    const ref = createMockRef()
    renderHook(() => useTypeToFocus(ref))

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    })
    window.dispatchEvent(event)

    expect(mockFocus).not.toHaveBeenCalled()
  })

  it('should not focus on arrow keys', () => {
    const ref = createMockRef()
    renderHook(() => useTypeToFocus(ref))

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
    })
    window.dispatchEvent(event)

    expect(mockFocus).not.toHaveBeenCalled()
  })

  it('should focus on Backspace key', () => {
    const ref = createMockRef()
    renderHook(() => useTypeToFocus(ref))

    const event = new KeyboardEvent('keydown', {
      key: 'Backspace',
      bubbles: true,
    })
    window.dispatchEvent(event)

    expect(mockFocus).toHaveBeenCalledTimes(1)
  })

  it('should focus on Delete key', () => {
    const ref = createMockRef()
    renderHook(() => useTypeToFocus(ref))

    const event = new KeyboardEvent('keydown', {
      key: 'Delete',
      bubbles: true,
    })
    window.dispatchEvent(event)

    expect(mockFocus).toHaveBeenCalledTimes(1)
  })

  it('should not focus when hook is disabled', () => {
    const ref = createMockRef()
    renderHook(() => useTypeToFocus(ref, false))

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      bubbles: true,
    })
    window.dispatchEvent(event)

    expect(mockFocus).not.toHaveBeenCalled()
  })

  it('should not throw when ref.current is null', () => {
    const ref = { current: null }
    renderHook(() => useTypeToFocus(ref))

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      bubbles: true,
    })

    // Should not throw
    expect(() => window.dispatchEvent(event)).not.toThrow()
  })

  it('should focus with Shift modifier for capital letters', () => {
    const ref = createMockRef()
    renderHook(() => useTypeToFocus(ref))

    // Simulate Shift+A for capital letter
    const event = new KeyboardEvent('keydown', {
      key: 'A',
      shiftKey: true,
      bubbles: true,
    })
    window.dispatchEvent(event)

    expect(mockFocus).toHaveBeenCalledTimes(1)
  })

  it('should focus on number keys', () => {
    const ref = createMockRef()
    renderHook(() => useTypeToFocus(ref))

    const event = new KeyboardEvent('keydown', {
      key: '5',
      bubbles: true,
    })
    window.dispatchEvent(event)

    expect(mockFocus).toHaveBeenCalledTimes(1)
  })

  it('should focus on special characters', () => {
    const ref = createMockRef()
    renderHook(() => useTypeToFocus(ref))

    const event = new KeyboardEvent('keydown', {
      key: '@',
      shiftKey: true,
      bubbles: true,
    })
    window.dispatchEvent(event)

    expect(mockFocus).toHaveBeenCalledTimes(1)
  })

  it('should work with native HTMLInputElement refs', () => {
    // Create a real input element to test with native DOM refs
    const input = document.createElement('input')
    const focusSpy = vi.spyOn(input, 'focus')
    document.body.appendChild(input)

    const ref = { current: input }
    renderHook(() => useTypeToFocus(ref))

    const event = new KeyboardEvent('keydown', {
      key: 'h',
      bubbles: true,
    })
    window.dispatchEvent(event)

    expect(focusSpy).toHaveBeenCalledTimes(1)

    document.body.removeChild(input)
    focusSpy.mockRestore()
  })
})
