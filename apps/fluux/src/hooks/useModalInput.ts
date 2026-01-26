import { useRef, useEffect } from 'react'

/**
 * Hook for modal input fields - handles focus on mount and escape to close
 */
export function useModalInput<T extends HTMLInputElement | HTMLTextAreaElement>(
  onClose: () => void
) {
  const inputRef = useRef<T>(null)

  // Focus and select input on mount
  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return inputRef
}
