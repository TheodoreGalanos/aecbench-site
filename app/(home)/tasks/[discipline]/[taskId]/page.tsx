// ABOUTME: Canonical task-template detail route under the public task library.
// ABOUTME: Uses discipline plus task id so duplicate template names remain distinct.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  CATALOGUE_DISCIPLINES,
  type CatalogueDiscipline,
} from '@/lib/aec-bench/contracts';
import {
  getCatalogue,
  getCatalogueEntry,
  getTemplateVariants,
} from '@/lib/aec-bench/library-catalogue';
import { getTemplateDetailSupplement } from '@/lib/aec-bench/template-detail-supplements';
import { TaskTemplateDetail } from '@/components/template-detail/task-template-detail';

function isValidDiscipline(slug: string): slug is CatalogueDiscipline {
  return (CATALOGUE_DISCIPLINES as readonly string[]).includes(slug);
}

export async function generateStaticParams() {
  const catalogue = getCatalogue();
  return catalogue.templates.map((entry) => ({
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
    alternates: {
      canonical: `/tasks/${entry.discipline}/${entry.task_id}`,
    },
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

  return (
    <TaskTemplateDetail
      entry={entry}
      detail={getTemplateDetailSupplement(discipline, taskId)}
      variants={getTemplateVariants(taskId, catalogue)}
      canonicalPath={`/tasks/${entry.discipline}/${entry.task_id}`}
    />
  );
}
