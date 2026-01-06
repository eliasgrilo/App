/**
 * ═══════════════════════════════════════════════════════════════════
 * useCurrencyStore Tests
 * ═══════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useCurrencyStore, useCurrency, useCurrencyComputed } from './useCurrencyStore'

describe('useCurrencyStore', () => {
    beforeEach(() => {
        // Reset store to default state before each test
        useCurrencyStore.setState({ currency: 'CAD', province: 'ON' })
    })

    describe('Initial State', () => {
        it('should have CAD as default currency', () => {
            const { result } = renderHook(() => useCurrency())
            expect(result.current.currency).toBe('CAD')
        })

        it('should have ON as default province', () => {
            const { result } = renderHook(() => useCurrency())
            expect(result.current.province).toBe('ON')
        })
    })

    describe('setCurrency', () => {
        it('should change currency to USD', () => {
            const { result } = renderHook(() => useCurrency())

            act(() => {
                result.current.setCurrency('USD')
            })

            expect(result.current.currency).toBe('USD')
        })

        it('should not change currency for invalid code', () => {
            const { result } = renderHook(() => useCurrency())

            act(() => {
                // @ts-expect-error Testing invalid input
                result.current.setCurrency('INVALID')
            })

            expect(result.current.currency).toBe('CAD')
        })
    })

    describe('setProvince', () => {
        it('should change province to AB', () => {
            const { result } = renderHook(() => useCurrency())

            act(() => {
                result.current.setProvince('AB')
            })

            expect(result.current.province).toBe('AB')
        })

        it('should update tax rate when province changes', () => {
            const { result } = renderHook(() => useCurrency())

            // Ontario has 13% HST
            expect(result.current.taxRate).toBe(0.13)

            act(() => {
                result.current.setProvince('AB')
            })

            // Alberta has 5% GST only
            expect(result.current.taxRate).toBe(0.05)
        })
    })

    describe('formatCurrency', () => {
        it('should format number as CAD currency', () => {
            const { result } = renderHook(() => useCurrency())

            const formatted = result.current.formatCurrency(100)
            expect(formatted).toMatch(/\$100\.00/)
        })

        it('should handle null values', () => {
            const { result } = renderHook(() => useCurrency())

            const formatted = result.current.formatCurrency(null)
            expect(formatted).toMatch(/\$0\.00/)
        })

        it('should handle string values', () => {
            const { result } = renderHook(() => useCurrency())

            const formatted = result.current.formatCurrency('50.5')
            expect(formatted).toMatch(/\$50\.50/)
        })
    })

    describe('useCurrencyComputed', () => {
        it('should return correct province data for ON', () => {
            const { result } = renderHook(() => useCurrencyComputed())

            expect(result.current.provinceName).toBe('Ontario')
            expect(result.current.taxDisplay).toBe('13% HST')
        })

        it('should update when province changes', () => {
            const { result: currencyResult } = renderHook(() => useCurrency())
            const { result: computedResult } = renderHook(() => useCurrencyComputed())

            act(() => {
                currencyResult.current.setProvince('BC')
            })

            expect(computedResult.current.provinceName).toBe('British Columbia')
            expect(computedResult.current.taxDisplay).toBe('5% GST + 7% PST')
        })
    })
})
