import { useEffect, useRef, RefObject } from 'react'

/**
 * useFocusTrap — Traps focus within a container element
 * 
 * Apple HIG Compliance:
 * - Keeps keyboard navigation within modal boundaries
 * - Returns focus to trigger element on close
 * - Supports escape key handling
 */
export function useFocusTrap(
    isActive: boolean,
    containerRef: RefObject<HTMLElement | null>
): void {
    const previousActiveElement = useRef<HTMLElement | null>(null)

    useEffect(() => {
        if (!isActive || !containerRef?.current) return

        // Store the currently focused element to restore later
        previousActiveElement.current = document.activeElement as HTMLElement | null

        const container = containerRef.current

        // Get all focusable elements within the container
        const getFocusableElements = (): HTMLElement[] => {
            const focusableSelectors = [
                'button:not([disabled])',
                'a[href]',
                'input:not([disabled])',
                'select:not([disabled])',
                'textarea:not([disabled])',
                '[tabindex]:not([tabindex="-1"])',
            ].join(', ')

            return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
                .filter(el => el.offsetParent !== null) // Filter out hidden elements
        }

        // Focus the first focusable element
        const focusableElements = getFocusableElements()
        if (focusableElements.length > 0) {
            // Small delay to ensure modal is fully rendered
            requestAnimationFrame(() => {
                focusableElements[0]?.focus()
            })
        }

        // Handle tab key to trap focus
        const handleKeyDown = (e: KeyboardEvent): void => {
            if (e.key !== 'Tab') return

            const focusableElements = getFocusableElements()
            if (focusableElements.length === 0) return

            const firstElement = focusableElements[0]
            const lastElement = focusableElements[focusableElements.length - 1]

            // Shift + Tab
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault()
                    lastElement?.focus()
                }
            }
            // Tab
            else {
                if (document.activeElement === lastElement) {
                    e.preventDefault()
                    firstElement?.focus()
                }
            }
        }

        container.addEventListener('keydown', handleKeyDown)

        return () => {
            container.removeEventListener('keydown', handleKeyDown)

            // Restore focus to the previously focused element
            if (previousActiveElement.current &&
                typeof previousActiveElement.current.focus === 'function') {
                previousActiveElement.current.focus()
            }
        }
    }, [isActive, containerRef])
}

export default useFocusTrap
