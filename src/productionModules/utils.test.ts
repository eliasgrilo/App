/**
 * ═══════════════════════════════════════════════════════════════════
 * Production Utils Tests
 * Tests for formatNumber and hasValue utility functions
 * ═══════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from 'vitest'
import { formatNumber, hasValue } from './types'

describe('formatNumber', () => {
    describe('basic formatting', () => {
        it('should format a simple number without unit', () => {
            expect(formatNumber(1234, 0)).toBe('1.234')
        })

        it('should format with decimal places', () => {
            expect(formatNumber(1234.5678, 2)).toBe('1.234,57')
        })

        it('should handle zero', () => {
            expect(formatNumber(0, 0)).toBe('0')
        })

        it('should handle negative numbers', () => {
            expect(formatNumber(-500, 0)).toBe('-500')
        })
    })

    describe('unit handling', () => {
        it('should append unit to result', () => {
            expect(formatNumber(500, 0, 'g')).toBe('500 g')
        })

        it('should convert grams to kg when >= 1000', () => {
            expect(formatNumber(1500, 0, 'g')).toBe('1,50 kg')
        })

        it('should convert grams to kg for exactly 1000g', () => {
            expect(formatNumber(1000, 0, 'g')).toBe('1,00 kg')
        })

        it('should handle large gram values', () => {
            expect(formatNumber(5432, 0, 'g')).toBe('5,43 kg')
        })

        it('should not convert non-gram units', () => {
            expect(formatNumber(1500, 0, '%')).toBe('1.500 %')
        })
    })

    describe('edge cases', () => {
        it('should return — for NaN', () => {
            expect(formatNumber(NaN, 0)).toBe('—')
        })

        it('should return — for Infinity', () => {
            expect(formatNumber(Infinity, 0)).toBe('—')
        })

        it('should handle string input', () => {
            expect(formatNumber('1234', 0)).toBe('1.234')
        })

        it('should handle empty string as zero', () => {
            expect(formatNumber('', 0)).toBe('0')
        })

        it('should handle string with unit', () => {
            expect(formatNumber('500', 0, 'g')).toBe('500 g')
        })
    })
})

describe('hasValue', () => {
    it('should return true for positive numbers', () => {
        expect(hasValue(1)).toBe(true)
        expect(hasValue(100)).toBe(true)
        expect(hasValue(0.5)).toBe(true)
    })

    it('should return false for zero', () => {
        expect(hasValue(0)).toBe(false)
    })

    it('should return false for very small numbers', () => {
        expect(hasValue(0.0001)).toBe(false)
        expect(hasValue(0.001)).toBe(false)
    })

    it('should return true for numbers above threshold', () => {
        expect(hasValue(0.002)).toBe(true)
        expect(hasValue(0.01)).toBe(true)
    })

    it('should handle string input', () => {
        expect(hasValue('100')).toBe(true)
        expect(hasValue('0')).toBe(false)
    })

    it('should return false for negative numbers', () => {
        expect(hasValue(-1)).toBe(false)
    })

    it('should return false for non-numeric strings', () => {
        expect(hasValue('abc')).toBe(false)
    })
})
