/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * APPLE HIG HOOKS — Advanced State Management (Barrel Export)
 * 
 * All hooks have been refactored into individual files.
 * This file re-exports for backwards compatibility.
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Individual hook exports
export { useLocalStorage } from './useLocalStorage'
export { useUndoRedo } from './useUndoRedo'
export { usePreferences, type ReportPreferences, type ChartAnnotation } from './usePreferences'
export { useSwipeGesture, usePinchZoom } from './useTouchGestures'

// Default export for backwards compatibility
export default {
    useLocalStorage: () => { throw new Error('Import useLocalStorage directly') },
    useUndoRedo: () => { throw new Error('Import useUndoRedo directly') },
    usePreferences: () => { throw new Error('Import usePreferences directly') },
    useSwipeGesture: () => { throw new Error('Import useSwipeGesture directly') },
    usePinchZoom: () => { throw new Error('Import usePinchZoom directly') }
}
