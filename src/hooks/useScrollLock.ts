import { useEffect } from 'react'

/**
 * useScrollLock - Premium Body Scroll Locking
 * Prevents layout shifts by accounting for scrollbar width.
 */
export const useScrollLock = (isLocked: boolean): void => {
    useEffect(() => {
        if (!isLocked) return

        // Calculate scrollbar width
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

        // Save current styles
        const originalStyle = window.getComputedStyle(document.body).overflow
        const originalPaddingRight = window.getComputedStyle(document.body).paddingRight

        // Lock body and add padding to prevent shift
        document.body.style.overflow = 'hidden'

        // Only add padding if there was a scrollbar
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${parseInt(originalPaddingRight || '0') + scrollbarWidth}px`
        }

        return () => {
            // Restore original styles
            document.body.style.overflow = originalStyle
            document.body.style.paddingRight = originalPaddingRight
        }
    }, [isLocked])
}
