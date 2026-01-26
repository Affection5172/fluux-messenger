/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMessageCopy } from './useMessageCopy'

describe('useMessageCopy', () => {
  let container: HTMLDivElement
  let containerRef: { current: HTMLDivElement }

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    containerRef = { current: container }
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  // Helper to create a message element with data attributes
  function createMessageElement(id: string, from: string, time: string, body: string) {
    const div = document.createElement('div')
    div.setAttribute('data-message-id', id)
    div.setAttribute('data-message-from', from)
    div.setAttribute('data-message-time', time)
    div.setAttribute('data-message-body', body)
    div.textContent = body // For selection purposes
    return div
  }

  // Helper to create a mock ClipboardEvent (jsdom doesn't have ClipboardEvent)
  function createMockClipboardEvent(setData: ReturnType<typeof vi.fn>, preventDefault: ReturnType<typeof vi.fn>) {
    const event = new Event('copy', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', {
      value: { setData },
      writable: false,
    })
    Object.defineProperty(event, 'preventDefault', {
      value: preventDefault,
      writable: false,
    })
    return event
  }

  // Helper to simulate copy event with selection
  function simulateCopy(selectedElements: HTMLElement[]): { preventDefault: ReturnType<typeof vi.fn>, setData: ReturnType<typeof vi.fn> } {
    // Create a selection that includes the elements
    const selection = window.getSelection()!
    selection.removeAllRanges()

    if (selectedElements.length > 0) {
      const range = document.createRange()
      range.setStartBefore(selectedElements[0])
      range.setEndAfter(selectedElements[selectedElements.length - 1])
      selection.addRange(range)
    }

    const preventDefault = vi.fn()
    const setData = vi.fn()
    const event = createMockClipboardEvent(setData, preventDefault)

    container.dispatchEvent(event)

    return { preventDefault, setData }
  }

  it('should not modify clipboard for single message selection', () => {
    renderHook(() => useMessageCopy(containerRef))

    const msg1 = createMessageElement('1', 'Alice', '14:30', 'Hello')
    container.appendChild(msg1)

    const { preventDefault, setData } = simulateCopy([msg1])

    // Single message should use default behavior
    expect(preventDefault).not.toHaveBeenCalled()
    expect(setData).not.toHaveBeenCalled()
  })

  it('should format multiple messages from same sender', () => {
    renderHook(() => useMessageCopy(containerRef))

    const msg1 = createMessageElement('1', 'Alice', '14:30', 'Hello')
    const msg2 = createMessageElement('2', 'Alice', '14:31', 'How are you?')
    container.appendChild(msg1)
    container.appendChild(msg2)

    const { preventDefault, setData } = simulateCopy([msg1, msg2])

    expect(preventDefault).toHaveBeenCalled()
    expect(setData).toHaveBeenCalledWith(
      'text/plain',
      'Alice [14:30]:\nHello\nHow are you?'
    )
  })

  it('should group consecutive messages and add headers for different senders', () => {
    renderHook(() => useMessageCopy(containerRef))

    const msg1 = createMessageElement('1', 'Alice', '14:30', 'Hello')
    const msg2 = createMessageElement('2', 'Alice', '14:31', 'How are you?')
    const msg3 = createMessageElement('3', 'Bob', '14:32', "I'm good!")
    container.appendChild(msg1)
    container.appendChild(msg2)
    container.appendChild(msg3)

    const { preventDefault, setData } = simulateCopy([msg1, msg2, msg3])

    expect(preventDefault).toHaveBeenCalled()
    expect(setData).toHaveBeenCalledWith(
      'text/plain',
      "Alice [14:30]:\nHello\nHow are you?\n\nBob [14:32]:\nI'm good!"
    )
  })

  it('should handle alternating senders', () => {
    renderHook(() => useMessageCopy(containerRef))

    const msg1 = createMessageElement('1', 'Alice', '14:30', 'Hi')
    const msg2 = createMessageElement('2', 'Bob', '14:31', 'Hey')
    const msg3 = createMessageElement('3', 'Alice', '14:32', 'How are you?')
    container.appendChild(msg1)
    container.appendChild(msg2)
    container.appendChild(msg3)

    const { preventDefault, setData } = simulateCopy([msg1, msg2, msg3])

    expect(preventDefault).toHaveBeenCalled()
    expect(setData).toHaveBeenCalledWith(
      'text/plain',
      'Alice [14:30]:\nHi\n\nBob [14:31]:\nHey\n\nAlice [14:32]:\nHow are you?'
    )
  })

  it('should skip messages without body', () => {
    renderHook(() => useMessageCopy(containerRef))

    const msg1 = createMessageElement('1', 'Alice', '14:30', 'Hello')
    const msg2 = createMessageElement('2', 'Alice', '14:31', '') // Empty body
    const msg3 = createMessageElement('3', 'Bob', '14:32', 'Hi there')
    container.appendChild(msg1)
    container.appendChild(msg2)
    container.appendChild(msg3)

    const { preventDefault, setData } = simulateCopy([msg1, msg2, msg3])

    expect(preventDefault).toHaveBeenCalled()
    expect(setData).toHaveBeenCalledWith(
      'text/plain',
      'Alice [14:30]:\nHello\n\nBob [14:32]:\nHi there'
    )
  })

  it('should not intercept copy when selection is outside container', () => {
    renderHook(() => useMessageCopy(containerRef))

    // Create messages outside the container
    const outsideContainer = document.createElement('div')
    document.body.appendChild(outsideContainer)
    const msg1 = createMessageElement('1', 'Alice', '14:30', 'Hello')
    const msg2 = createMessageElement('2', 'Bob', '14:31', 'Hi')
    outsideContainer.appendChild(msg1)
    outsideContainer.appendChild(msg2)

    // Select outside messages
    const selection = window.getSelection()!
    selection.removeAllRanges()
    const range = document.createRange()
    range.setStartBefore(msg1)
    range.setEndAfter(msg2)
    selection.addRange(range)

    const preventDefault = vi.fn()
    const setData = vi.fn()
    const event = createMockClipboardEvent(setData, preventDefault)

    container.dispatchEvent(event)

    // Should not modify clipboard
    expect(preventDefault).not.toHaveBeenCalled()
    expect(setData).not.toHaveBeenCalled()

    document.body.removeChild(outsideContainer)
  })

  it('should not intercept copy when selection is collapsed', () => {
    renderHook(() => useMessageCopy(containerRef))

    const msg1 = createMessageElement('1', 'Alice', '14:30', 'Hello')
    container.appendChild(msg1)

    // Create collapsed selection (no text selected)
    const selection = window.getSelection()!
    selection.removeAllRanges()

    const preventDefault = vi.fn()
    const setData = vi.fn()
    const event = createMockClipboardEvent(setData, preventDefault)

    container.dispatchEvent(event)

    expect(preventDefault).not.toHaveBeenCalled()
    expect(setData).not.toHaveBeenCalled()
  })

  it('should preserve multiline message bodies', () => {
    renderHook(() => useMessageCopy(containerRef))

    const msg1 = createMessageElement('1', 'Alice', '14:30', 'Line 1\nLine 2\nLine 3')
    const msg2 = createMessageElement('2', 'Bob', '14:31', 'Reply')
    container.appendChild(msg1)
    container.appendChild(msg2)

    const { preventDefault, setData } = simulateCopy([msg1, msg2])

    expect(preventDefault).toHaveBeenCalled()
    expect(setData).toHaveBeenCalledWith(
      'text/plain',
      'Alice [14:30]:\nLine 1\nLine 2\nLine 3\n\nBob [14:31]:\nReply'
    )
  })

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(container, 'removeEventListener')

    const { unmount } = renderHook(() => useMessageCopy(containerRef))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('copy', expect.any(Function))
  })
})
