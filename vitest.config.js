import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.js',
        '**/*.config.ts',
        'build.py',
        'vite.config.js',
        'vitest.config.js',
        'scripts/',
        'config/',
        'src/css/',
        'src/images/'
      ],
      include: ['src/**/*.js'],
      thresholds: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60
        }
      }
    },
    testTimeout: 10000
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  css: {
    modules: false
  },
  // Mock CSS and other asset imports in tests
  define: {
    __CSS_MODULES__: 'false'
  }
});
