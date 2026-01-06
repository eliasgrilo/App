/**
 * ═══════════════════════════════════════════════════════════════════
 * Shared Inputs Tests
 * Tests for SmartInput, NameInput, Toggle, PremiumTextarea
 * ═══════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SmartInput, NameInput, Toggle, PremiumTextarea } from './index'

describe('SmartInput', () => {
    it('should render with placeholder', () => {
        render(<SmartInput value="" onChange={() => { }} placeholder="Enter value" />)
        expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument()
    })

    it('should call onChange when typing', () => {
        const handleChange = vi.fn()
        render(<SmartInput value="" onChange={handleChange} placeholder="Enter value" />)

        fireEvent.change(screen.getByPlaceholderText('Enter value'), { target: { value: 'test' } })
        expect(handleChange).toHaveBeenCalledWith({ target: { value: 'test' } })
    })

    it('should format integer input', () => {
        const handleChange = vi.fn()
        render(<SmartInput value="" onChange={handleChange} placeholder="Enter number" format="integer" />)

        fireEvent.change(screen.getByPlaceholderText('Enter number'), { target: { value: '12a3b4' } })
        expect(handleChange).toHaveBeenCalledWith({ target: { value: '1234' } })
    })

    it('should format number input', () => {
        const handleChange = vi.fn()
        render(<SmartInput value="" onChange={handleChange} placeholder="Enter decimal" format="number" />)

        fireEvent.change(screen.getByPlaceholderText('Enter decimal'), { target: { value: '12.34.56' } })
        expect(handleChange).toHaveBeenCalledWith({ target: { value: '12.3456' } })
    })

    it('should use custom formatter', () => {
        const handleChange = vi.fn()
        const formatter = (val: string) => val.toUpperCase()
        render(<SmartInput value="" onChange={handleChange} placeholder="Enter text" formatter={formatter} />)

        fireEvent.change(screen.getByPlaceholderText('Enter text'), { target: { value: 'hello' } })
        expect(handleChange).toHaveBeenCalledWith({ target: { value: 'HELLO' } })
    })
})

describe('NameInput', () => {
    it('should render with placeholder', () => {
        render(<NameInput value="" onChange={() => { }} placeholder="Enter name" />)
        expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument()
    })

    it('should call onChange when typing', () => {
        const handleChange = vi.fn()
        render(<NameInput value="" onChange={handleChange} placeholder="Enter name" />)

        fireEvent.change(screen.getByPlaceholderText('Enter name'), { target: { value: 'John' } })
        expect(handleChange).toHaveBeenCalled()
    })

    it('should display provided value', () => {
        render(<NameInput value="Test Value" onChange={() => { }} />)
        expect(screen.getByDisplayValue('Test Value')).toBeInTheDocument()
    })
})

describe('Toggle', () => {
    it('should render as switch', () => {
        render(<Toggle on={false} onChange={() => { }} />)
        expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('should call onChange when clicked', () => {
        const handleChange = vi.fn()
        render(<Toggle on={false} onChange={handleChange} />)

        fireEvent.click(screen.getByRole('switch'))
        expect(handleChange).toHaveBeenCalledWith(true)
    })

    it('should toggle from on to off', () => {
        const handleChange = vi.fn()
        render(<Toggle on={true} onChange={handleChange} />)

        fireEvent.click(screen.getByRole('switch'))
        expect(handleChange).toHaveBeenCalledWith(false)
    })

    it('should have correct aria-checked attribute', () => {
        const { rerender } = render(<Toggle on={false} onChange={() => { }} />)
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')

        rerender(<Toggle on={true} onChange={() => { }} />)
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    })

    it('should have accessible label', () => {
        render(<Toggle on={false} onChange={() => { }} label="Enable feature" />)
        expect(screen.getByLabelText('Enable feature')).toBeInTheDocument()
    })
})

describe('PremiumTextarea', () => {
    it('should render with placeholder', () => {
        render(<PremiumTextarea value="" onChange={() => { }} placeholder="Enter description" />)
        expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument()
    })

    it('should call onChange when typing', () => {
        const handleChange = vi.fn()
        render(<PremiumTextarea value="" onChange={handleChange} placeholder="Enter text" />)

        fireEvent.change(screen.getByPlaceholderText('Enter text'), { target: { value: 'Hello world' } })
        expect(handleChange).toHaveBeenCalled()
    })

    it('should display provided value', () => {
        render(<PremiumTextarea value="Initial text" onChange={() => { }} />)
        expect(screen.getByDisplayValue('Initial text')).toBeInTheDocument()
    })

    it('should respect rows prop', () => {
        render(<PremiumTextarea value="" onChange={() => { }} rows={5} placeholder="Test" />)
        expect(screen.getByPlaceholderText('Test')).toHaveAttribute('rows', '5')
    })
})
