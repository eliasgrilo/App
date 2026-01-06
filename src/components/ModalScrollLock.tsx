import { useScrollLock } from '../hooks/useScrollLock'

/**
 * ModalScrollLock - Shared component to lock body scroll when modal is open
 * 
 * Usage: Place inside any modal component
 * <ModalScrollLock />
 */
export default function ModalScrollLock() {
    useScrollLock(true)
    return null
}
