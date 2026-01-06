import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Mock localStorage
interface LocalStorageMock {
    getItem: ReturnType<typeof vi.fn>
    setItem: ReturnType<typeof vi.fn>
    removeItem: ReturnType<typeof vi.fn>
    clear: ReturnType<typeof vi.fn>
    length: number
    key: (index: number) => string | null
}

const localStorageMock: LocalStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: () => null
}

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true
})

// Reset store state before each test
beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
})
