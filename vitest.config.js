import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['tests/**/*.spec.js', 'tests/**/*.spec.ts'],
        exclude: ['tests/playwright/**', 'node_modules/**'],
        setupFiles: [],
        coverage: {
            reporter: ['text', 'json', 'html'],
        },
    },
})
