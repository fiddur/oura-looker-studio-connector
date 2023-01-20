module.exports = {
  env: {
    browser: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:jest/recommended',
  ],
  ignorePatterns: ['**/dist/*', '**/lib/*'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'jest', 'sort-keys-fix'],
  root: true,
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { ignoreRestSiblings: true }],
    'arrow-body-style': ['error', 'as-needed'],
    'no-console': 'error',
    'object-shorthand': 'warn',
    'sort-keys-fix/sort-keys-fix': ['error', 'asc', { natural: true }],
  },
}
