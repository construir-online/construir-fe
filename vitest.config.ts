import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Excluir e2e — esos los corre Playwright, no Vitest
    exclude: ['node_modules', '.next', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules', '.next', 'e2e', 'src/test'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Mock global de next-intl: evita que los tests necesiten NextIntlClientProvider
      'next-intl': path.resolve(__dirname, './src/test/mocks/next-intl.ts'),
    },
  },
});
