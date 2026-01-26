import { useEffect, type RefObject } from 'react'

/**
 * Hook that detects clicks outside of a referenced element.
 *
 * @param ref - React ref to the element to monitor
 * @param onClickOutside - Callback fired when a click occurs outside the element
 * @param enabled - Whether the listener is active (default: true)
 *
 * @example
 * ```tsx
 * const menuRef = useRef<HTMLDivElement>(null)
 * const [isOpen, setIsOpen] = useState(false)
 *
 * useClickOutside(menuRef, () => setIsOpen(false), isOpen)
 * ```
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onClickOutside: () => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClickOutside()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [ref, onClickOutside, enabled])
}
