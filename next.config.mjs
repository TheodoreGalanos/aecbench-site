// ABOUTME: Next.js configuration with Fumadocs MDX plugin.
// ABOUTME: Wraps the base config with createMDX for MDX content processing.
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();
const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  turbopack: {
    root: projectRoot,
  },
};

export default withMDX(config);
