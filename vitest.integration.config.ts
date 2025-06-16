import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['tests/simple-integration*.test.ts', 'server/__tests__/**/*.test.ts'],
    exclude: ['client/__tests__/**', 'e2e/**'],
    environment: 'node',
    globals: true,
    maxConcurrency: 2,
    testTimeout: 60000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});