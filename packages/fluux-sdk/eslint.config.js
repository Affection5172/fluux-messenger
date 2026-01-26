import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Allow unused vars prefixed with underscore
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Warn on explicit any in production code
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow non-null assertions (we use them carefully in tests)
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Prefer const
      'prefer-const': 'error',
      // Allow console - SDK needs logging for debugging and error reporting
      'no-console': 'off',
    },
  },
  {
    // Relaxed rules for test files
    files: ['**/*.test.ts', '**/*.test.tsx', '**/test-utils.ts'],
    rules: {
      // Allow generic Function type in test mocks
      '@typescript-eslint/no-unsafe-function-type': 'off',
      // Allow any in tests for mocking flexibility
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.js'],
  }
)
