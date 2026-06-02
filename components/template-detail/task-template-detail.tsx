// ABOUTME: Visual detail page for a built task template in the public catalogue.
// ABOUTME: Renders template anatomy, parameter contract, difficulty, archetypes, and preview.
import Link from 'next/link';
import { ArrowLeft, Boxes, Braces, Cpu, EyeOff, GitBranch, Wrench } from 'lucide-react';
import type { LibraryCatalogueEntry } from '@/lib/aec-bench/library-catalogue';
import type {
  TemplateArchetypeDetail,
  TemplateDetailSupplement,
  TemplateDifficultyDetail,
  TemplateParameterDetail,
} from '@/lib/aec-bench/template-detail-supplements';

export interface TaskTemplateDetailProps {
  entry: LibraryCatalogueEntry;
  detail: TemplateDetailSupplement | null;
  variants: LibraryCatalogueEntry[];
  canonicalPath?: string;
  catalogueMeta: {
    libraryVersion: string;
    libraryCommit: string | null;
  };
}

function chipClass(tone: 'amber' | 'teal' | 'green' | 'red' | 'muted' = 'muted') {
  const tones = {
    amber: 'border-accent-amber/50 bg-accent-amber/15 text-accent-amber',
    teal: 'border-accent-teal/50 bg-accent-teal/15 text-accent-teal',
    green: 'border-delta-up/50 bg-delta-up/15 text-delta-up',
    red: 'border-delta-down/50 bg-delta-down/15 text-delta-down',
    muted: 'border-landing-border bg-[#0d0d0d] text-landing-muted',
  };
  return `rounded border px-2 py-1 font-mono text-[0.68rem] uppercase tracking-wider ${tones[tone]}`;
}

function formatRange(range: { min: number; max: number }) {
  return range.min === range.max ? `${range.min}` : `${range.min} to ${range.max}`;
}

function hiddenBy(param: string, difficulty: TemplateDifficultyDetail[] = []) {
  return difficulty.filter((d) => d.hiddenParams.includes(param)).map((d) => d.level);
}

function fallbackParameters(entry: LibraryCatalogueEntry): TemplateParameterDetail[] {
  return entry.inputs.map((input) => ({
    name: input.name,
    type: input.type === 'int' || input.type === 'enum' ? input.type : 'float',
    unit: input.unit ?? undefined,
    description: input.description ?? input.name,
  }));
}

function ParameterRow({
  param,
  hiddenLevels,
}: {
  param: TemplateParameterDetail;
  hiddenLevels: string[];
}) {
  return (
    <li className="grid gap-3 border-t border-landing-border px-0 py-4 md:grid-cols-[minmax(160px,0.8fr)_1fr_minmax(170px,0.7fr)]">
      <div className="min-w-0">
        <p className="break-words font-mono text-sm font-semibold text-landing-text">{param.name}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className={chipClass(param.type === 'enum' ? 'teal' : 'amber')}>{param.type}</span>
          {param.optional && <span className={chipClass('muted')}>optional</span>}
          {param.derivableFrom && <span className={chipClass('green')}>from {param.derivableFrom}</span>}
          {hiddenLevels.map((level) => (
            <span key={level} className={chipClass('red')}>
              hidden in {level}
            </span>
          ))}
        </div>
      </div>
      <p className="text-sm leading-6 text-landing-muted">{param.description}</p>
      <div className="font-mono text-xs text-landing-muted">
        {param.range ? (
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span>{formatRange(param.range)}</span>
              {param.unit && <span>{param.unit}</span>}
            </div>
            <div className="h-1.5 rounded bg-[#151515]">
              <div className="h-1.5 w-full rounded bg-accent-amber" />
            </div>
          </div>
        ) : param.values ? (
          <div className="flex flex-wrap gap-1">
            {param.values.slice(0, 8).map((value) => (
              <span key={value} className="rounded bg-[#151515] px-1.5 py-0.5 text-landing-text">
                {value}
              </span>
            ))}
            {param.values.length > 8 && <span>+{param.values.length - 8}</span>}
          </div>
        ) : (
          <span>{param.unit ?? 'declared input'}</span>
        )}
      </div>
    </li>
  );
}

function AnatomyFlow({ entry }: { entry: LibraryCatalogueEntry }) {
  const stages = [
    {
      label: 'inputs',
      value: `${entry.inputs.length} fields`,
      icon: Braces,
      tone: 'amber' as const,
    },
    {
      label: 'context',
      value: `${entry.archetype_count ?? 0} archetypes`,
      icon: Boxes,
      tone: 'teal' as const,
    },
    {
      label: 'engine',
      value: entry.tool_mode ?? 'declared',
      icon: Cpu,
      tone: 'green' as const,
    },
    {
      label: 'outputs',
      value: `${entry.outputs.length} scored fields`,
      icon: GitBranch,
      tone: 'amber' as const,
    },
  ];

  return (
    <section aria-label="Template anatomy" className="border-y border-landing-border bg-[#070807]">
      <div className="mx-auto grid max-w-6xl gap-3 px-4 py-5 md:grid-cols-4">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <div key={stage.label} className="relative overflow-hidden rounded border border-landing-border bg-[#0d0d0d] p-4">
              {index < stages.length - 1 && (
                <div className="absolute right-[-18px] top-1/2 hidden h-px w-9 bg-accent-teal md:block" />
              )}
              <div className="mb-5 flex items-center justify-between">
                <span className={chipClass(stage.tone)}>{stage.label}</span>
                <Icon className="h-4 w-4 text-landing-muted" aria-hidden="true" />
              </div>
              <p className="font-mono text-xl text-landing-text">{stage.value}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DifficultyLadder({ difficulty }: { difficulty: TemplateDifficultyDetail[] }) {
  if (difficulty.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-7" aria-labelledby="difficulty-ladder">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="anno">visibility contract</p>
          <h2 id="difficulty-ladder" className="mt-2 text-xl font-semibold text-landing-text">
            Difficulty Ladder
          </h2>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {difficulty.map((tier) => (
          <article key={tier.level} className="rounded border border-landing-border bg-[#080808] p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <span className={chipClass(tier.visibility === 'partial' ? 'red' : 'green')}>
                {tier.visibility}
              </span>
              <span className="font-mono text-sm uppercase text-landing-text">{tier.level}</span>
            </div>
            <p className="min-h-[72px] text-sm leading-6 text-landing-muted">{tier.description}</p>
            <div className="mt-4 flex flex-wrap gap-1">
              {tier.hiddenParams.length > 0 ? (
                tier.hiddenParams.map((param) => (
                  <span key={param} className={chipClass('red')}>
                    <EyeOff className="mr-1 inline h-3 w-3" aria-hidden="true" />
                    {param}
                  </span>
                ))
              ) : (
                <span className={chipClass('muted')}>all fields visible</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ArchetypeAtlas({ archetypes }: { archetypes: TemplateArchetypeDetail[] }) {
  if (archetypes.length === 0) return null;

  return (
    <section className="border-y border-landing-border bg-[#070707]" aria-labelledby="archetype-atlas">
      <div className="mx-auto max-w-6xl px-4 py-7">
        <p className="anno">scenario bands</p>
        <h2 id="archetype-atlas" className="mt-2 text-xl font-semibold text-landing-text">
          Archetype Atlas
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {archetypes.map((archetype) => (
            <article key={archetype.name} className="rounded border border-landing-border bg-[#0c0c0c] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-mono text-sm font-semibold text-landing-text">{archetype.name}</h3>
                <span className={chipClass('teal')}>{archetype.siteContexts.length} contexts</span>
              </div>
              <p className="text-sm leading-6 text-landing-muted">{archetype.description}</p>
              <div className="mt-4 grid gap-2">
                {archetype.fields.slice(0, 4).map((field) => (
                  <div key={field.name} className="grid grid-cols-[minmax(120px,0.8fr)_1fr] gap-3 font-mono text-xs">
                    <span className="break-words text-landing-text">{field.name}</span>
                    <span className="text-landing-muted">
                      {field.range ? formatRange(field.range) : field.values?.join(', ')}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 font-mono text-xs text-accent-teal">{archetype.siteContexts.join(' / ')}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function GeneratedPreview({ detail }: { detail: TemplateDetailSupplement | null }) {
  const sample = detail?.sampleInstance;
  if (!sample) return null;

  return (
    <section className="mx-auto grid max-w-6xl gap-4 px-4 py-7 lg:grid-cols-[0.8fr_1.2fr]" aria-labelledby="generated-preview">
      <div>
        <p className="anno">rendered task</p>
        <h2 id="generated-preview" className="mt-2 text-xl font-semibold text-landing-text">
          Generation Preview
        </h2>
        <p className="mt-3 text-sm leading-6 text-landing-muted">
          {sample.name}
        </p>
        <dl className="mt-5 grid gap-2 font-mono text-xs">
          <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 border-t border-landing-border pt-2">
            <dt className="text-landing-muted">difficulty</dt>
            <dd className="break-words text-right text-landing-text">{sample.difficulty}</dd>
          </div>
          <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 border-t border-landing-border pt-2">
            <dt className="text-landing-muted">visibility</dt>
            <dd className="break-words text-right text-landing-text">{sample.visibility}</dd>
          </div>
          <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 border-t border-landing-border pt-2">
            <dt className="text-landing-muted">archetype</dt>
            <dd className="break-words text-right text-landing-text">{sample.archetype}</dd>
          </div>
          <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 border-t border-landing-border pt-2">
            <dt className="text-landing-muted">site context</dt>
            <dd className="break-words text-right text-landing-text">{sample.siteContext}</dd>
          </div>
        </dl>
      </div>
      <div className="rounded border border-landing-border bg-[#050505]">
        <div className="flex items-center justify-between border-b border-landing-border px-4 py-3">
          <span className="font-mono text-xs text-landing-muted">instruction excerpt</span>
          <span className={chipClass('green')}>
            <Wrench className="mr-1 inline h-3 w-3" aria-hidden="true" />
            {sample.toolScripts.join(', ')}
          </span>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-landing-muted">visible fields</p>
            <ul className="grid gap-2">
              {sample.visibleInputs.map((input) => (
                <li key={input.name} className="flex justify-between gap-3 rounded bg-[#101010] px-3 py-2 font-mono text-xs">
                  <span className="text-landing-text">{input.name}</span>
                  <span className="text-accent-amber">
                    {input.value}
                    {input.unit ? ` ${input.unit}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-landing-muted">withheld schema</p>
            <div className="flex flex-wrap gap-1">
              {sample.hiddenInputs.map((input) => (
                <span key={input} className={chipClass('red')}>{input}</span>
              ))}
              {sample.withheldOutputs.map((output) => (
                <span key={output} className={chipClass('muted')}>{output}</span>
              ))}
            </div>
            <blockquote className="mt-4 border-l border-accent-teal pl-4 text-sm leading-6 text-landing-muted">
              {sample.promptExcerpt}
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TaskTemplateDetail({
  entry,
  detail,
  variants,
  canonicalPath,
  catalogueMeta,
}: TaskTemplateDetailProps) {
  const parameters = detail?.parameters ?? fallbackParameters(entry);
  const relatedVariants = variants.filter((variant) => variant.discipline !== entry.discipline);

  return (
    <main className="min-h-screen bg-landing-bg text-landing-text">
      <section className="relative overflow-hidden border-b border-landing-border bg-[#080908]">
        <div
          className="absolute inset-0 opacity-45"
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(rgba(56,178,172,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(56,178,172,0.10) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-8">
          <Link
            href="/tasks"
            className="mb-7 inline-flex items-center gap-2 font-mono text-xs text-landing-muted hover:text-accent-amber"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            task library
          </Link>
          <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className={chipClass('amber')}>built template</span>
                <span className={chipClass('teal')}>{entry.category}</span>
                <span className={chipClass('muted')}>{entry.tool_mode ?? 'tool mode unset'}</span>
              </div>
              <h1 className="max-w-full break-words text-4xl font-semibold tracking-normal text-landing-text md:max-w-3xl md:text-6xl">
                {entry.task_name}
              </h1>
              <p className="mt-5 max-w-full break-words text-base leading-7 text-landing-muted md:max-w-3xl md:text-lg">
                {entry.long_description ?? entry.description}
              </p>
            </div>
            <aside className="min-w-0 overflow-hidden rounded border border-landing-border bg-[#050505] p-4">
              <p className="font-mono text-xs uppercase tracking-wider text-landing-muted">catalogue source</p>
              <dl className="mt-4 grid min-w-0 gap-2 font-mono text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-landing-muted">version</dt>
                  <dd>{catalogueMeta.libraryVersion}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-landing-muted">commit</dt>
                  <dd>{catalogueMeta.libraryCommit ?? 'unavailable'}</dd>
                </div>
                {detail?.sourcePath && (
                  <div className="grid gap-1 border-t border-landing-border pt-3">
                    <dt className="text-landing-muted">template path</dt>
                    <dd className="min-w-0 break-all text-accent-teal">{detail.sourcePath}</dd>
                  </div>
                )}
                {canonicalPath && (
                  <div className="grid gap-1 border-t border-landing-border pt-3">
                    <dt className="text-landing-muted">canonical path</dt>
                    <dd className="min-w-0 break-all text-accent-amber">{canonicalPath}</dd>
                  </div>
                )}
              </dl>
              {relatedVariants.length > 0 && (
                <div className="mt-4 border-t border-landing-border pt-4">
                  <p className="mb-2 font-mono text-xs text-landing-muted">same task id</p>
                  <div className="flex flex-wrap gap-2">
                    {relatedVariants.map((variant) => (
                      <Link
                        key={`${variant.discipline}/${variant.task_id}`}
                        href={`/tasks/${variant.discipline}/${variant.task_id}`}
                        className={chipClass('teal')}
                      >
                        {variant.discipline} variant
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      <AnatomyFlow entry={entry} />

      <section className="mx-auto max-w-6xl px-4 py-7" aria-labelledby="parameter-map">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="anno">contract fields</p>
            <h2 id="parameter-map" className="mt-2 text-xl font-semibold text-landing-text">
              Parameter Map
            </h2>
          </div>
          <p className="font-mono text-xs text-landing-muted">
            {entry.inputs.length} inputs to {entry.outputs.length} scored outputs
          </p>
        </div>
        <ul className="rounded border border-landing-border bg-[#080808] px-4">
          {parameters.map((param) => (
            <ParameterRow
              key={param.name}
              param={param}
              hiddenLevels={hiddenBy(param.name, detail?.difficulty)}
            />
          ))}
        </ul>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {entry.outputs.map((output) => (
            <div key={output.name} className="rounded border border-landing-border bg-[#0b0b0b] px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm text-landing-text">{output.name}</span>
                {output.tolerance != null && <span className={chipClass('amber')}>tol {output.tolerance}</span>}
              </div>
              {output.description && <p className="mt-2 text-xs leading-5 text-landing-muted">{output.description}</p>}
            </div>
          ))}
        </div>
      </section>

      <DifficultyLadder difficulty={detail?.difficulty ?? []} />
      <ArchetypeAtlas archetypes={detail?.archetypes ?? []} />
      <GeneratedPreview detail={detail} />
    </main>
  );
}
