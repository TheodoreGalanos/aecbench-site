// ABOUTME: Root layout wrapping all pages with Fumadocs RootProvider.
// ABOUTME: Configures Inter and JetBrains Mono fonts via next/font.
import './globals.css';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: {
    template: '%s | AEC-Bench',
    default: 'AEC-Bench — Benchmarking AI for Architecture, Engineering & Construction',
  },
  description:
    'The definitive benchmark for measuring AI capability on real architecture, engineering and construction tasks.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
