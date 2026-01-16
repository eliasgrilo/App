/**
 * Touch Gestures — Mobile Touch Interaction Hooks
 * 
 * Hooks for swipe and pinch-zoom gestures.
 * @author Padoca Engineering Team
 */

import React, { useState, useCallback, useMemo, useRef } from 'react'

// ═══════════════════════════════════════════════════════════════════════════════
// USE SWIPE GESTURE — Mobile Touch Gestures
// ═══════════════════════════════════════════════════════════════════════════════

interface SwipeHandlers {
    onSwipeLeft?: () => void
    onSwipeRight?: () => void
    onSwipeUp?: () => void
    onSwipeDown?: () => void
}

interface UseSwipeGestureReturn {
    handlers: {
        onTouchStart: (e: React.TouchEvent) => void
        onTouchMove: (e: React.TouchEvent) => void
        onTouchEnd: () => void
    }
    swipeDirection: 'left' | 'right' | 'up' | 'down' | null
    swipeProgress: number
}

export function useSwipeGesture(
    { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown }: SwipeHandlers,
    threshold: number = 50
): UseSwipeGestureReturn {
    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
    const [touchCurrent, setTouchCurrent] = useState<{ x: number; y: number } | null>(null)
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null)

    const swipeProgress = useMemo(() => {
        if (!touchStart || !touchCurrent) return 0
        const deltaX = touchCurrent.x - touchStart.x
        const deltaY = touchCurrent.y - touchStart.y
        const maxDelta = Math.max(Math.abs(deltaX), Math.abs(deltaY))
        return Math.min(maxDelta / threshold, 1)
    }, [touchStart, touchCurrent, threshold])

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0]
        if (!touch) return
        setTouchStart({ x: touch.clientX, y: touch.clientY })
        setTouchCurrent({ x: touch.clientX, y: touch.clientY })
    }, [])

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        if (!touchStart) return
        const touch = e.touches[0]
        if (!touch) return
        setTouchCurrent({ x: touch.clientX, y: touch.clientY })

        const deltaX = touch.clientX - touchStart.x
        const deltaY = touch.clientY - touchStart.y

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            setSwipeDirection(deltaX > 0 ? 'right' : 'left')
        } else {
            setSwipeDirection(deltaY > 0 ? 'down' : 'up')
        }
    }, [touchStart])

    const onTouchEnd = useCallback(() => {
        if (!touchStart || !touchCurrent) return

        const deltaX = touchCurrent.x - touchStart.x
        const deltaY = touchCurrent.y - touchStart.y

        if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) onSwipeRight?.()
            else onSwipeLeft?.()
        } else if (Math.abs(deltaY) > threshold) {
            if (deltaY > 0) onSwipeDown?.()
            else onSwipeUp?.()
        }

        setTouchStart(null)
        setTouchCurrent(null)
        setSwipeDirection(null)
    }, [touchStart, touchCurrent, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

    return {
        handlers: { onTouchStart, onTouchMove, onTouchEnd },
        swipeDirection,
        swipeProgress
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// USE PINCH ZOOM — Multi-touch Zoom for Charts
// ═══════════════════════════════════════════════════════════════════════════════

interface UsePinchZoomReturn {
    scale: number
    handlers: {
        onTouchStart: (e: React.TouchEvent) => void
        onTouchMove: (e: React.TouchEvent) => void
        onTouchEnd: () => void
        onDoubleClick: () => void
    }
    resetZoom: () => void
    isZooming: boolean
}

export function usePinchZoom(
    initialScale: number = 1,
    minScale: number = 0.5,
    maxScale: number = 3,
    onScaleChange?: (scale: number) => void
): UsePinchZoomReturn {
    const [scale, setScale] = useState(initialScale)
    const [isZooming, setIsZooming] = useState(false)
    const initialDistance = useRef<number | null>(null)
    const initialScale$ = useRef(scale)

    const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
        const dx = touch1.clientX - touch2.clientX
        const dy = touch1.clientY - touch2.clientY
        return Math.sqrt(dx * dx + dy * dy)
    }

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const touch0 = e.touches[0]
            const touch1 = e.touches[1]
            if (!touch0 || !touch1) return
            setIsZooming(true)
            initialDistance.current = getDistance(touch0, touch1)
            initialScale$.current = scale
        }
    }, [scale])

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2 && initialDistance.current) {
            const touch0 = e.touches[0]
            const touch1 = e.touches[1]
            if (!touch0 || !touch1) return
            const currentDistance = getDistance(touch0, touch1)
            const scaleChange = currentDistance / initialDistance.current
            const newScale = Math.min(maxScale, Math.max(minScale, initialScale$.current * scaleChange))
            setScale(newScale)
            onScaleChange?.(newScale)
        }
    }, [minScale, maxScale, onScaleChange])

    const onTouchEnd = useCallback(() => {
        initialDistance.current = null
        setIsZooming(false)
    }, [])

    const onDoubleClick = useCallback(() => {
        setScale(1)
        onScaleChange?.(1)
    }, [onScaleChange])

    const resetZoom = useCallback(() => {
        setScale(1)
        onScaleChange?.(1)
    }, [onScaleChange])

    return {
        scale,
        handlers: { onTouchStart, onTouchMove, onTouchEnd, onDoubleClick },
        resetZoom,
        isZooming
    }
}
