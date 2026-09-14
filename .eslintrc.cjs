module.exports = {
  root: true,
  env: { node: true, es2023: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2023, sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['dist', 'node_modules', 'prisma/migrations'],
  rules: {
    // Structured logging only — no stray console output in the server.
    'no-console': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    eqeqeq: ['error', 'smart'],
  },
  overrides: [
    {
      // The CLI scripts talk to the operator through stdout by design.
      files: ['scripts/**/*.ts'],
      rules: { 'no-console': 'off' },
    },
    {
      files: ['tests/**/*.ts'],
      env: { node: true },
      rules: { 'no-console': 'off', '@typescript-eslint/no-non-null-assertion': 'off' },
    },
  ],
};
