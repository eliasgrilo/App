import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
    {
        ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts']
    },
    {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                project: './tsconfig.json',
                ecmaVersion: 2020,
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true
                }
            }
        },
        plugins: {
            '@typescript-eslint': tseslint,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh
        },
        rules: {
            // TypeScript - disabled after proper typing implementation
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',

            // React hooks rules - only critical one
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'off',

            // React refresh - disabled for mixed exports
            'react-refresh/only-export-components': 'off',

            // General best practices
            'no-console': 'off',
            'prefer-const': 'error',
            'no-var': 'error'
        }
    }
]
