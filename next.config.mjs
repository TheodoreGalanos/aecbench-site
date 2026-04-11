// ABOUTME: Next.js configuration with Fumadocs MDX plugin.
// ABOUTME: Wraps the base config with createMDX for MDX content processing.
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
};

export default withMDX(config);
