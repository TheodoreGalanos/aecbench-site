// ABOUTME: Public task-library sitemap route for browsing all benchmark tasks.
// ABOUTME: Renders built templates and proposed seeds from the generated library catalogue.
import type { Metadata } from 'next';
import { TaskLibraryIndex } from '@/components/tasks/task-library-index';
import { getCatalogue } from '@/lib/aec-bench/library-catalogue';

export const metadata: Metadata = {
  title: 'Task Library - AEC-Bench',
  description: 'Browse AEC-Bench task templates and proposed task seeds by discipline and category.',
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  return (
    <TaskLibraryIndex
      catalogue={getCatalogue()}
      filters={{
        discipline: first(params.discipline),
        category: first(params.category),
        standard: first(params.standard),
        tag: first(params.tag),
      }}
    />
  );
}
