// ABOUTME: Fumadocs content source configuration.
// ABOUTME: Defines the docs collection from content/docs/ directory.
import { defineDocs, defineConfig } from 'fumadocs-mdx/config';

export const docs = defineDocs({
  dir: 'content/docs',
});

export default defineConfig();
