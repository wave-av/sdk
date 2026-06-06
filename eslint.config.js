// eslint.config.js — flat config (ESLint 9)
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  { ignores: ['dist/**', 'build/**', 'lib/**', 'coverage/**', 'node_modules/**', '*.config.js', '*.config.ts', '*.config.mjs'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
