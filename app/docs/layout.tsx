// ABOUTME: Layout for documentation pages with sidebar navigation.
// ABOUTME: Uses Fumadocs DocsLayout with the page tree from content source.
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout {...baseOptions()} links={[]} tree={source.pageTree}>
      {children}
    </DocsLayout>
  );
}
