import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRef } from 'react'
import { useClickOutside } from './useClickOutside'

function TestComponent({
  onClickOutside,
  enabled = true,
}: {
  onClickOutside: () => void
  enabled?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, onClickOutside, enabled)

  return (
    <div>
      <div ref={ref} data-testid="inside">
        Inside element
      </div>
      <div data-testid="outside">Outside element</div>
    </div>
  )
}

describe('useClickOutside', () => {
  it('should call callback when clicking outside the element', () => {
    const onClickOutside = vi.fn()
    render(<TestComponent onClickOutside={onClickOutside} />)

    fireEvent.mouseDown(screen.getByTestId('outside'))

    expect(onClickOutside).toHaveBeenCalledTimes(1)
  })

  it('should not call callback when clicking inside the element', () => {
    const onClickOutside = vi.fn()
    render(<TestComponent onClickOutside={onClickOutside} />)

    fireEvent.mouseDown(screen.getByTestId('inside'))

    expect(onClickOutside).not.toHaveBeenCalled()
  })

  it('should not call callback when disabled', () => {
    const onClickOutside = vi.fn()
    render(<TestComponent onClickOutside={onClickOutside} enabled={false} />)

    fireEvent.mouseDown(screen.getByTestId('outside'))

    expect(onClickOutside).not.toHaveBeenCalled()
  })

  it('should add and remove event listener based on enabled state', () => {
    const onClickOutside = vi.fn()
    const { rerender } = render(
      <TestComponent onClickOutside={onClickOutside} enabled={false} />
    )

    // Click when disabled - should not trigger
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(onClickOutside).not.toHaveBeenCalled()

    // Enable and click - should trigger
    rerender(<TestComponent onClickOutside={onClickOutside} enabled={true} />)
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(onClickOutside).toHaveBeenCalledTimes(1)

    // Disable again and click - should not trigger
    rerender(<TestComponent onClickOutside={onClickOutside} enabled={false} />)
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(onClickOutside).toHaveBeenCalledTimes(1) // Still 1, not 2
  })

  it('should clean up event listener on unmount', () => {
    const onClickOutside = vi.fn()
    const { unmount } = render(<TestComponent onClickOutside={onClickOutside} />)

    unmount()

    // Click after unmount should not trigger (listener removed)
    fireEvent.mouseDown(document.body)
    expect(onClickOutside).not.toHaveBeenCalled()
  })
})
