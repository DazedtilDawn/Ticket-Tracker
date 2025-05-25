import js from '@eslint/js';
import react from 'eslint-plugin-react';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  // Base JavaScript config
  js.configs.recommended,
  
  // Global ignores
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.config/**',
      '.cache/**',
      '*.min.js',
      'public/service-worker.js',
      'server/test-*.js',
      'server/test-*.mjs',
      'generate-pwa-icons.js'
    ]
  },
  
  // TypeScript config
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        React: 'readonly',
        JSX: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react
    },
    rules: {
      // Relax some rules for the current codebase
      'no-console': 'off', // Too many console.logs in codebase
      '@typescript-eslint/no-explicit-any': 'off', // Too many anys to fix right now
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off', // TypeScript handles this
      'no-unused-vars': 'off' // Use TypeScript's version
    }
  },
  
  // React config
  {
    files: ['**/*.jsx', '**/*.tsx'],
    plugins: {
      'react': react
    },
    rules: {
      ...react.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react/no-unescaped-entities': 'off' // Allow apostrophes in JSX
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  
  // JavaScript files
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off'
    }
  }
];