import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return

    previousRef.current = document.activeElement as HTMLElement

    const container = containerRef.current
    if (!container) return

    const focusableEls = container.querySelectorAll<HTMLElement>(FOCUSABLE)
    if (focusableEls.length > 0) {
      focusableEls[0].focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const current = container.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (current.length === 0) return

      const first = current[0]
      const last = current[current.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      if (previousRef.current && previousRef.current.isConnected) {
        previousRef.current.focus()
      }
    }
  }, [active])

  return containerRef
}
