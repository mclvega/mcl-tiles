/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
