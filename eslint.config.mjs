import js from '@eslint/js';
import nextPlugin from 'eslint-config-next';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  js.configs.recommended,
  {
    ...nextPlugin,
    plugins: {
      ...nextPlugin.plugins,
      prettier: prettierPlugin,
    },
    rules: {
      ...nextPlugin.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      // TypeScript-friendly overrides
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**'],
  },
];

export default config;
