/* eslint-env node */
const vitestGlobals = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  vi: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
};

module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['dist', 'node_modules', 'coverage', '*.cjs'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
  },
  overrides: [
    {
      files: ['src/engine/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['react', 'react-dom', 'zustand'],
                message: 'Engine must stay pure and UI-free.',
              },
              {
                group: [
                  '**/ui/**',
                  '**/audio/**',
                  '**/save/**',
                  '**/sim/**',
                  '**/content/**',
                  '**/ui',
                  '**/audio',
                  '**/save',
                  '**/sim',
                  '**/content',
                ],
                message: 'Engine must not import ui/audio/save/sim/content.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/content/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['react', 'react-dom', 'zustand'],
                message: 'Content must stay pure data and UI-free.',
              },
              {
                group: ['**/ui/**', '**/audio/**', '**/save/**', '**/sim/**', '**/ui', '**/audio', '**/save', '**/sim'],
                message: 'Content must not import ui/audio/save/sim.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', 'src/test/**/*.ts'],
      globals: vitestGlobals,
    },
    {
      files: ['src/sim/**/*.ts'],
      rules: { 'no-console': 'off' },
    },
  ],
};
