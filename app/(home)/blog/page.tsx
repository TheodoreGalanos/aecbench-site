// ABOUTME: Placeholder blog page — full implementation in Phase 4.
// ABOUTME: Shows a coming soon message.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Announcements and updates from the AEC-Bench project.',
};

export default function BlogPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold">Blog</h1>
      <p className="mt-4 max-w-md text-fd-muted-foreground">
        Blog posts with benchmark announcements and research updates are coming
        soon.
      </p>
    </div>
  );
}
