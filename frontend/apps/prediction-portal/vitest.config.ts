import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './test-setup.ts',
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/__uit__/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
