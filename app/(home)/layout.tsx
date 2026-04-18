// ABOUTME: Layout for non-docs pages — mounts the PreviewBanner (when is_mock), StatusBar, and Fumadocs HomeLayout.
// ABOUTME: PreviewBanner sits above the nav so users see the synthetic notice before any content.
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { StatusBar } from '@/components/landing/status-bar';
import { PreviewBanner } from '@/components/landing/preview-banner';
import { isMock } from '@/lib/aec-bench/read';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <PreviewBanner show={isMock()} />
      <HomeLayout {...baseOptions()}>
        <StatusBar />
        {children}
      </HomeLayout>
    </>
  );
}
