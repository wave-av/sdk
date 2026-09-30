// eslint.config.js — flat config (ESLint 9)
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  { ignores: ['dist/**', 'build/**', 'lib/**', 'coverage/**', 'node_modules/**', '*.config.js', '*.config.ts', '*.config.mjs'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // A deprecated method that throws RouteNotServedError keeps its old parameters so callers still
    // compile; it never reads them. The `_` prefix marks such a parameter as unused on purpose.
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
