// ABOUTME: Fumadocs content source loader.
// ABOUTME: Creates the page tree and source API from generated MDX output.
import { docs } from '@/.source/server';
import { loader } from 'fumadocs-core/source';

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});
