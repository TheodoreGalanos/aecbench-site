// ABOUTME: Vitest configuration for component and unit tests.
// ABOUTME: Uses jsdom plus React and Fumadocs MDX transforms for route and component tests.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import mdx from 'fumadocs-mdx/vite';
import { resolve } from 'path';
import * as MdxConfig from './source.config';

export default defineConfig(async () => ({
  plugins: [
    await mdx(MdxConfig, { index: false, updateViteConfig: false }),
    react(),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
}));
