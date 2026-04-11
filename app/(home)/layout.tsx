// ABOUTME: Layout for non-docs pages (landing, leaderboard, blog).
// ABOUTME: Uses Fumadocs HomeLayout with shared navigation config.
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return <HomeLayout {...baseOptions()}>{children}</HomeLayout>;
}
