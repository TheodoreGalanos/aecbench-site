// ABOUTME: Layout for non-docs pages (landing, leaderboard).
// ABOUTME: Uses Fumadocs HomeLayout with shared navigation config and mounts the run StatusBar.
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { StatusBar } from '@/components/landing/status-bar';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout {...baseOptions()}>
      <StatusBar />
      {children}
    </HomeLayout>
  );
}
