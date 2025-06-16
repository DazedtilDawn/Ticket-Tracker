import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    include: [
      'client/__tests__/chore-card.parent-actions.test.tsx',
      'client/__tests__/dashboard-header.test.tsx',
      'client/__tests__/parent-control-panel.test.tsx',
      'client/__tests__/quick-action-bar.test.tsx',
      'client/__tests__/transaction-row.parent-actions.test.tsx'
    ],
    exclude: ['tests/e2e/**', 'e2e/**'],
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    globals: true,
    maxConcurrency: 4,
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});