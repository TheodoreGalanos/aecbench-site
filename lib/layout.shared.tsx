// ABOUTME: Shared layout configuration for Fumadocs HomeLayout and DocsLayout.
// ABOUTME: Defines navigation links, logo, and GitHub URL used across all layouts.
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex items-center gap-2">
          <Image
            src="/logo-dark.png"
            alt="aec-bench"
            width={28}
            height={20}
            className="hidden dark:block"
          />
          <Image
            src="/logo-light.png"
            alt="aec-bench"
            width={28}
            height={20}
            className="dark:hidden"
          />
          <span className="font-bold">aec-bench</span>
        </div>
      ),
    },
    links: [
      {
        text: 'Docs',
        url: '/docs',
        active: 'nested-url',
      },
      {
        text: 'Leaderboard',
        url: '/leaderboard',
        active: 'url',
      },
      {
        text: 'Blog',
        url: '/blog',
        active: 'nested-url',
      },
      {
        text: 'The Harness',
        url: 'https://www.theharness.blog',
        active: 'none',
      },
    ],
    githubUrl: 'https://github.com/aurecon/aec-bench',
  };
}
