// ABOUTME: Public task-library sitemap route for browsing all benchmark tasks.
// ABOUTME: Renders built templates and proposed seeds from the generated library catalogue.
import type { Metadata } from 'next';
import { TaskLibraryIndex } from '@/components/tasks/task-library-index';
import { getCatalogue } from '@/lib/aec-bench/library-catalogue';

export const metadata: Metadata = {
  title: 'Task Library - AEC-Bench',
  description: 'Browse AEC-Bench task templates and proposed task seeds by discipline and category.',
};

export default function TasksPage() {
  return <TaskLibraryIndex catalogue={getCatalogue()} />;
}
