import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default [
    {
        ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts', 'e2e/**']
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
            'react-refresh': reactRefresh,
            'jsx-a11y': jsxA11y
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
            'no-var': 'error',

            // Accessibility rules (jsx-a11y)
            'jsx-a11y/alt-text': 'warn',
            'jsx-a11y/anchor-has-content': 'warn',
            'jsx-a11y/anchor-is-valid': 'warn',
            'jsx-a11y/aria-props': 'error',
            'jsx-a11y/aria-proptypes': 'error',
            'jsx-a11y/aria-role': 'error',
            'jsx-a11y/aria-unsupported-elements': 'error',
            'jsx-a11y/click-events-have-key-events': 'warn',
            'jsx-a11y/heading-has-content': 'warn',
            'jsx-a11y/html-has-lang': 'warn',
            'jsx-a11y/img-redundant-alt': 'warn',
            'jsx-a11y/interactive-supports-focus': 'warn',
            'jsx-a11y/label-has-associated-control': 'warn',
            'jsx-a11y/media-has-caption': 'warn',
            'jsx-a11y/mouse-events-have-key-events': 'warn',
            'jsx-a11y/no-access-key': 'warn',
            'jsx-a11y/no-autofocus': 'off',
            'jsx-a11y/no-distracting-elements': 'error',
            'jsx-a11y/no-interactive-element-to-noninteractive-role': 'warn',
            'jsx-a11y/no-noninteractive-element-interactions': 'warn',
            'jsx-a11y/no-noninteractive-element-to-interactive-role': 'warn',
            'jsx-a11y/no-noninteractive-tabindex': 'warn',
            'jsx-a11y/no-redundant-roles': 'warn',
            'jsx-a11y/no-static-element-interactions': 'warn',
            'jsx-a11y/role-has-required-aria-props': 'error',
            'jsx-a11y/role-supports-aria-props': 'error',
            'jsx-a11y/scope': 'error',
            'jsx-a11y/tabindex-no-positive': 'warn'
        }
    }
]
