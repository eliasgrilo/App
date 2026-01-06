import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}'],
        coverage: {
            reporter: ['text', 'html'],
            exclude: ['node_modules/', 'src/test/']
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@components': path.resolve(__dirname, './src/components'),
            '@hooks': path.resolve(__dirname, './src/hooks'),
            '@contexts': path.resolve(__dirname, './src/contexts'),
            '@stores': path.resolve(__dirname, './src/stores'),
            '@utils': path.resolve(__dirname, './src/utils')
        }
    }
})
