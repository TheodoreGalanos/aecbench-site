// ABOUTME: Task-template detail route nested under each discipline leaderboard page.
// ABOUTME: Looks up catalogue entries by discipline plus task id to avoid duplicate-name collisions.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DOMAINS, type Domain } from '@/lib/aec-bench/contracts';
import {
  getCatalogue,
  getCatalogueEntry,
  getTemplateVariants,
} from '@/lib/aec-bench/library-catalogue';
import { getTemplateDetailSupplement } from '@/lib/aec-bench/template-detail-supplements';
import { TaskTemplateDetail } from '@/components/template-detail/task-template-detail';

function isValidDiscipline(slug: string): slug is Domain {
  return (DOMAINS as readonly string[]).includes(slug);
}

export async function generateStaticParams() {
  const catalogue = getCatalogue();
  return catalogue.templates
    .filter((entry) => isValidDiscipline(entry.discipline))
    .map((entry) => ({
      discipline: entry.discipline,
      taskId: entry.task_id,
    }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ discipline: string; taskId: string }>;
}): Promise<Metadata> {
  const { discipline, taskId } = await params;
  if (!isValidDiscipline(discipline)) {
    return { title: 'Not Found - AEC-Bench' };
  }

  const entry = getCatalogueEntry(discipline, taskId);
  if (!entry) {
    return { title: 'Not Found - AEC-Bench' };
  }

  return {
    title: `${entry.task_name} - AEC-Bench Template`,
    description: entry.description,
  };
}

export default async function TaskTemplatePage({
  params,
}: {
  params: Promise<{ discipline: string; taskId: string }>;
}) {
  const { discipline, taskId } = await params;
  if (!isValidDiscipline(discipline)) notFound();

  const catalogue = getCatalogue();
  const entry = getCatalogueEntry(discipline, taskId, catalogue);
  if (!entry || entry.status !== 'built') notFound();

  const detail = getTemplateDetailSupplement(discipline, taskId);
  const variants = getTemplateVariants(taskId, catalogue);

  return (
    <TaskTemplateDetail
      entry={entry}
      detail={detail}
      variants={variants}
      canonicalPath={`/tasks/${entry.discipline}/${entry.task_id}`}
    />
  );
}
