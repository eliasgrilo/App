/**
 * ═══════════════════════════════════════════════════════════════════
 * useUIStore Tests
 * ═══════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useUIStore, useModal, useToast, useConfirmState, useToasts } from './useUIStore'

describe('useUIStore', () => {
    beforeEach(() => {
        // Reset store to initial state before each test
        useUIStore.setState({
            confirmState: null,
            toasts: [],
            toastIdCounter: 0
        })
    })

    describe('Modal', () => {
        describe('confirm', () => {
            it('should open modal with string message', () => {
                const { result } = renderHook(() => useModal())

                act(() => {
                    result.current.modal.confirm('Are you sure?')
                })

                const confirmState = useUIStore.getState().confirmState
                expect(confirmState).not.toBeNull()
                expect(confirmState?.message).toBe('Are you sure?')
            })

            it('should open modal with options object', () => {
                const { result } = renderHook(() => useModal())
                const onConfirm = vi.fn()

                act(() => {
                    result.current.modal.confirm({
                        title: 'Delete Item',
                        message: 'This will be permanent',
                        isDangerous: true,
                        onConfirm
                    })
                })

                const confirmState = useUIStore.getState().confirmState
                expect(confirmState?.title).toBe('Delete Item')
                expect(confirmState?.isDangerous).toBe(true)
            })

            it('should close modal and call onConfirm', () => {
                const { result } = renderHook(() => useModal())
                const onConfirm = vi.fn()

                act(() => {
                    result.current.modal.confirm({ onConfirm })
                })

                const confirmState = useUIStore.getState().confirmState
                act(() => {
                    confirmState?.onConfirm()
                })

                expect(onConfirm).toHaveBeenCalled()
                expect(useUIStore.getState().confirmState).toBeNull()
            })
        })

        describe('closeModal', () => {
            it('should close modal', () => {
                const { result } = renderHook(() => useModal())

                act(() => {
                    result.current.modal.confirm('Test')
                })

                expect(useUIStore.getState().confirmState).not.toBeNull()

                act(() => {
                    result.current.modal.close()
                })

                expect(useUIStore.getState().confirmState).toBeNull()
            })
        })
    })

    describe('Toast', () => {
        describe('showToast', () => {
            it('should add toast with string message', () => {
                const { result } = renderHook(() => useToast())

                act(() => {
                    result.current.show('Hello World')
                })

                const toasts = useUIStore.getState().toasts
                expect(toasts).toHaveLength(1)
                expect(toasts[0]?.message).toBe('Hello World')
            })

            it('should add toast with options', () => {
                const { result } = renderHook(() => useToast())

                act(() => {
                    result.current.show({
                        message: 'Error occurred',
                        type: 'error',
                        duration: 5000
                    })
                })

                const toasts = useUIStore.getState().toasts
                expect(toasts[0]?.type).toBe('error')
                expect(toasts[0]?.duration).toBe(5000)
            })

            it('should return unique toast ID', () => {
                const { result } = renderHook(() => useToast())

                let id1: number, id2: number

                act(() => {
                    id1 = result.current.show('Toast 1')
                    id2 = result.current.show('Toast 2')
                })

                expect(id1!).not.toBe(id2!)
            })

            it('should limit toasts to 5', () => {
                const { result } = renderHook(() => useToast())

                act(() => {
                    for (let i = 0; i < 10; i++) {
                        result.current.show(`Toast ${i}`)
                    }
                })

                expect(useUIStore.getState().toasts).toHaveLength(5)
            })
        })

        describe('dismissToast', () => {
            it('should remove toast by ID', () => {
                const { result } = renderHook(() => useToast())
                let toastId: number

                act(() => {
                    toastId = result.current.show('Dismissable')
                })

                expect(useUIStore.getState().toasts).toHaveLength(1)

                act(() => {
                    result.current.dismiss(toastId)
                })

                expect(useUIStore.getState().toasts).toHaveLength(0)
            })
        })

        describe('dismissAllToasts', () => {
            it('should remove all toasts', () => {
                const { result } = renderHook(() => useToast())

                act(() => {
                    result.current.show('Toast 1')
                    result.current.show('Toast 2')
                    result.current.show('Toast 3')
                })

                expect(useUIStore.getState().toasts).toHaveLength(3)

                act(() => {
                    result.current.dismissAll()
                })

                expect(useUIStore.getState().toasts).toHaveLength(0)
            })
        })

        describe('convenience methods', () => {
            it('success should create success toast', () => {
                const { result } = renderHook(() => useToast())

                act(() => {
                    result.current.success('Success!')
                })

                expect(useUIStore.getState().toasts[0]?.type).toBe('success')
            })

            it('error should create error toast', () => {
                const { result } = renderHook(() => useToast())

                act(() => {
                    result.current.error('Error!')
                })

                expect(useUIStore.getState().toasts[0]?.type).toBe('error')
            })

            it('info should create info toast', () => {
                const { result } = renderHook(() => useToast())

                act(() => {
                    result.current.info('Info!')
                })

                expect(useUIStore.getState().toasts[0]?.type).toBe('info')
            })

            it('warning should create warning toast', () => {
                const { result } = renderHook(() => useToast())

                act(() => {
                    result.current.warning('Warning!')
                })

                expect(useUIStore.getState().toasts[0]?.type).toBe('warning')
            })

            it('loading should create loading toast with duration 0', () => {
                const { result } = renderHook(() => useToast())

                act(() => {
                    result.current.loading('Loading...')
                })

                const toast = useUIStore.getState().toasts[0]
                expect(toast?.type).toBe('loading')
                expect(toast?.duration).toBe(0)
            })
        })
    })

    describe('Selectors', () => {
        it('useConfirmState should return confirmState', () => {
            const { result: modalResult } = renderHook(() => useModal())
            const { result: confirmResult } = renderHook(() => useConfirmState())

            expect(confirmResult.current).toBeNull()

            act(() => {
                modalResult.current.modal.confirm('Test')
            })

            expect(confirmResult.current).not.toBeNull()
        })

        it('useToasts should return toasts array', () => {
            const { result: toastResult } = renderHook(() => useToast())
            const { result: toastsResult } = renderHook(() => useToasts())

            expect(toastsResult.current).toHaveLength(0)

            act(() => {
                toastResult.current.success('Test')
            })

            expect(toastsResult.current).toHaveLength(1)
        })
    })
})
