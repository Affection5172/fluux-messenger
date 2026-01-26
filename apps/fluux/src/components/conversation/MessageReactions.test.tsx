import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MessageReactions } from './MessageReactions'

// Mock the Tooltip component to make content testable
vi.mock('../Tooltip', () => ({
  Tooltip: ({ content, children }: { content: string; children: React.ReactNode }) => (
    <div data-tooltip={content}>{children}</div>
  ),
}))

describe('MessageReactions', () => {
  const defaultProps = {
    reactions: { '👍': ['alice', 'bob'], '❤️': ['charlie'] },
    myReactions: [] as string[],
    onReaction: vi.fn(),
    getReactorName: (id: string) => id.charAt(0).toUpperCase() + id.slice(1),
    isRetracted: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render reaction pills', () => {
      render(<MessageReactions {...defaultProps} />)

      expect(screen.getByText('👍')).toBeInTheDocument()
      expect(screen.getByText('❤️')).toBeInTheDocument()
    })

    it('should show reaction counts', () => {
      render(<MessageReactions {...defaultProps} />)

      // 👍 has 2 reactors, ❤️ has 1
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should show reactor names in tooltip', () => {
      render(<MessageReactions {...defaultProps} />)

      const thumbsWrapper = screen.getByText('👍').closest('[data-tooltip]')
      expect(thumbsWrapper).toHaveAttribute('data-tooltip', 'Alice, Bob')

      const heartWrapper = screen.getByText('❤️').closest('[data-tooltip]')
      expect(heartWrapper).toHaveAttribute('data-tooltip', 'Charlie')
    })

    it('should not render when no reactions', () => {
      const { container } = render(
        <MessageReactions {...defaultProps} reactions={{}} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should not render when isRetracted is true', () => {
      const { container } = render(
        <MessageReactions {...defaultProps} isRetracted={true} />
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('User reactions highlighting', () => {
    it('should highlight reactions user has made', () => {
      render(<MessageReactions {...defaultProps} myReactions={['👍']} />)

      const thumbsButton = screen.getByText('👍').closest('button')
      const heartButton = screen.getByText('❤️').closest('button')

      expect(thumbsButton).toHaveClass('bg-fluux-brand/20')
      expect(thumbsButton).toHaveClass('border-fluux-brand')
      expect(heartButton).not.toHaveClass('bg-fluux-brand/20')
    })

    it('should highlight multiple user reactions', () => {
      render(<MessageReactions {...defaultProps} myReactions={['👍', '❤️']} />)

      const thumbsButton = screen.getByText('👍').closest('button')
      const heartButton = screen.getByText('❤️').closest('button')

      expect(thumbsButton).toHaveClass('bg-fluux-brand/20')
      expect(heartButton).toHaveClass('bg-fluux-brand/20')
    })
  })

  describe('Interaction', () => {
    it('should call onReaction when clicking a reaction', () => {
      const onReaction = vi.fn()
      render(<MessageReactions {...defaultProps} onReaction={onReaction} />)

      fireEvent.click(screen.getByText('👍'))

      expect(onReaction).toHaveBeenCalledWith('👍')
    })

    it('should call onReaction with correct emoji', () => {
      const onReaction = vi.fn()
      render(<MessageReactions {...defaultProps} onReaction={onReaction} />)

      fireEvent.click(screen.getByText('❤️'))

      expect(onReaction).toHaveBeenCalledWith('❤️')
    })
  })

  describe('Reactor name formatting', () => {
    it('should use getReactorName for tooltip', () => {
      const getReactorName = vi.fn((id: string) => `User: ${id}`)
      render(
        <MessageReactions
          {...defaultProps}
          reactions={{ '🎉': ['user1', 'user2'] }}
          getReactorName={getReactorName}
        />
      )

      // Verify getReactorName was called (map passes extra args, so just check it was called)
      expect(getReactorName).toHaveBeenCalledTimes(2)

      const wrapper = screen.getByText('🎉').closest('[data-tooltip]')
      expect(wrapper).toHaveAttribute('data-tooltip', 'User: user1, User: user2')
    })

    it('should handle "You" for current user in tooltip', () => {
      const getReactorName = (id: string) => id === 'me' ? 'You' : id
      render(
        <MessageReactions
          {...defaultProps}
          reactions={{ '👍': ['me', 'alice'] }}
          getReactorName={getReactorName}
        />
      )

      const wrapper = screen.getByText('👍').closest('[data-tooltip]')
      expect(wrapper).toHaveAttribute('data-tooltip', 'You, alice')
    })
  })

  describe('Multiple reactions', () => {
    it('should render many reactions', () => {
      render(
        <MessageReactions
          {...defaultProps}
          reactions={{
            '👍': ['a'],
            '❤️': ['b'],
            '😂': ['c'],
            '🎉': ['d'],
            '🔥': ['e'],
          }}
        />
      )

      expect(screen.getByText('👍')).toBeInTheDocument()
      expect(screen.getByText('❤️')).toBeInTheDocument()
      expect(screen.getByText('😂')).toBeInTheDocument()
      expect(screen.getByText('🎉')).toBeInTheDocument()
      expect(screen.getByText('🔥')).toBeInTheDocument()
    })

    it('should handle single reactor', () => {
      render(
        <MessageReactions
          {...defaultProps}
          reactions={{ '👍': ['alice'] }}
        />
      )

      const wrapper = screen.getByText('👍').closest('[data-tooltip]')
      expect(wrapper).toHaveAttribute('data-tooltip', 'Alice')
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should handle many reactors on one emoji', () => {
      render(
        <MessageReactions
          {...defaultProps}
          reactions={{ '👍': ['a', 'b', 'c', 'd', 'e'] }}
        />
      )

      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })
})
