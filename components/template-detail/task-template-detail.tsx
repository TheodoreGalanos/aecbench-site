// ABOUTME: Visual detail page for a built task template in the public catalogue.
// ABOUTME: Renders template anatomy, parameter contract, difficulty, archetypes, and preview.
import Link from 'next/link';
import { ArrowLeft, ArrowRight, EyeOff, Wrench } from 'lucide-react';
import type { LibraryCatalogueEntry } from '@/lib/aec-bench/library-catalogue';
import type { TemplateArtifact } from '@/lib/aec-bench/template-artifacts';
import type {
  TemplateArchetypeDetail,
  TemplateDetailSupplement,
  TemplateDifficultyDetail,
  TemplateParameterDetail,
} from '@/lib/aec-bench/template-detail-supplements';
import { TaskArtifactViewer } from '@/components/template-detail/task-artifact-viewer';

export interface TaskTemplateDetailProps {
  entry: LibraryCatalogueEntry;
  detail: TemplateDetailSupplement | null;
  artifact: TemplateArtifact;
  variants: LibraryCatalogueEntry[];
  previousTask: LibraryCatalogueEntry | null;
  nextTask: LibraryCatalogueEntry | null;
}

function utilityBadgeClass() {
  return 'rounded border border-landing-border bg-[#0d0d0d] px-2 py-1 font-mono text-[0.68rem] uppercase tracking-wider text-landing-muted';
}

function disciplineBadgeClass(discipline: LibraryCatalogueEntry['discipline']) {
  const colours = {
    civil: 'border-[#42b6a4]/60 text-[#69cbbd]',
    electrical: 'border-[#e8a838]/60 text-[#e8a838]',
    ground: 'border-[#b58a62]/60 text-[#c9a27e]',
    mechanical: 'border-[#6d9fd1]/60 text-[#86b4e2]',
    structural: 'border-[#9d83c9]/60 text-[#b29adb]',
    maritime: 'border-[#5aa9c5]/60 text-[#76bfd7]',
  };
  return `rounded border bg-[#0d0d0d] px-2 py-1 font-mono text-[0.68rem] uppercase tracking-wider ${colours[discipline]}`;
}

function formatRange(range: { min: number; max: number }, unit?: string) {
  const value = range.min === range.max ? `${range.min}` : `${range.min} – ${range.max}`;
  return unit && unit !== '-' ? `${value} ${unit}` : value;
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

function humaniseIdentifier(identifier: string, unit?: string) {
  const parts = identifier.split('_').filter(Boolean);
  if (unit && unit !== '-') {
    const unitParts = unit
      .replace(/²/g, '2')
      .replace(/³/g, '3')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
    if (
      unitParts.length > 0
      && unitParts.every((part, index) => parts[parts.length - unitParts.length + index] === part)
    ) {
      parts.splice(parts.length - unitParts.length);
    }
  }
  if (!unit || unit === '-') {
    const encodedUnitSuffixes = [
      ['mv', 'per', 'a', 'm'],
      ['kn', 'per', 'm'],
      ['kg', 'm3'],
      ['m3', 's'],
      ['m3', 'h'],
      ['l', 's'],
      ['mm', 'hr'],
      ['mm2'],
      ['kpa'],
      ['kw'],
      ['percent'],
      ['nm'],
      ['mm'],
      ['ha'],
      ['m'],
      ['v'],
      ['a'],
    ];
    const suffix = encodedUnitSuffixes.find((candidate) =>
      candidate.every((part, index) => parts[parts.length - candidate.length + index] === part),
    );
    if (suffix && parts.length > suffix.length) parts.splice(parts.length - suffix.length);
  }
  const label = parts.join(' ');
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : identifier;
}

type ParameterGroupKey = 'always' | 'derived' | 'hidden' | 'optional';

const PARAMETER_GROUPS: Array<{
  key: ParameterGroupKey;
  title: string;
  description: string;
}> = [
  { key: 'always', title: 'Always given', description: 'Included directly in every task prompt.' },
  { key: 'derived', title: 'Derived from scenario', description: 'Sampled from the scenario and inferable from its description.' },
  { key: 'hidden', title: 'Hidden at higher difficulty', description: 'Visible in easier tasks and withheld in one or more harder tiers.' },
  { key: 'optional', title: 'Optional', description: 'Used only when the sampled task needs this part of the contract.' },
];

function groupParameters(
  parameters: TemplateParameterDetail[],
  difficulty: TemplateDifficultyDetail[],
) {
  const hiddenNames = new Set(difficulty.flatMap((tier) => tier.hiddenParams));
  const groups = new Map<ParameterGroupKey, TemplateParameterDetail[]>(
    PARAMETER_GROUPS.map(({ key }) => [key, []]),
  );

  for (const parameter of parameters) {
    const group = parameter.optional
      ? 'optional'
      : parameter.derivableFrom
        ? 'derived'
        : hiddenNames.has(parameter.name)
          ? 'hidden'
          : 'always';
    groups.get(group)?.push(parameter);
  }
  return groups;
}

function ParameterRow({
  param,
  hiddenLevels,
}: {
  param: TemplateParameterDetail;
  hiddenLevels: string[];
}) {
  return (
    <li className="grid gap-3 border-t border-landing-border px-4 py-4 first:border-t-0 md:grid-cols-[minmax(180px,0.8fr)_1fr_minmax(180px,0.7fr)]">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-landing-text">{humaniseIdentifier(param.name, param.unit)}</p>
        <p className="mt-1 break-words font-mono text-[0.68rem] text-landing-muted">{param.name}</p>
      </div>
      <div>
        <p className="text-sm leading-6 text-landing-muted">{param.description}</p>
        <p className="mt-1 text-xs leading-5 text-landing-muted/80">
          {param.derivableFrom && <>Derived from the {param.derivableFrom} scenario. </>}
          {param.optional && <>Optional input. </>}
          {hiddenLevels.length > 0 && (
            <span className="text-delta-down">Hidden at {hiddenLevels.join(' and ')} difficulty.</span>
          )}
        </p>
      </div>
      <div className="text-sm text-landing-text">
        {param.range ? (
          <span>{formatRange(param.range, param.unit)}</span>
        ) : param.values ? (
          <div className="flex flex-wrap gap-1.5">
            {param.values.slice(0, 8).map((value) => (
              <span key={value} className="rounded border border-landing-border bg-[#111] px-2 py-1 font-mono text-xs text-landing-muted">
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

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function OverviewPanel({ entry }: { entry: LibraryCatalogueEntry }) {
  const facts = [
    { href: '#parameters', value: plural(entry.inputs.length, 'given input'), label: 'Parameters' },
    { href: '#scored-outputs', value: plural(entry.outputs.length, 'scored output'), label: 'Scoring' },
    { href: '#archetypes', value: plural(entry.archetype_count ?? 0, 'scenario archetype'), label: 'Scenarios' },
    { href: '#difficulty', value: plural(entry.difficulty_tiers?.length ?? 3, 'difficulty tier'), label: 'Difficulty' },
    {
      href: '#generated-preview',
      value: entry.tool_mode === 'with-tool' ? 'Tool provided' : 'Tool withheld',
      label: 'Example task',
    },
  ];

  return (
    <nav aria-label="On this task page" className="border-y border-landing-border bg-[#070807]">
      <div className="mx-auto grid max-w-6xl divide-y divide-landing-border px-4 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
        {facts.map((fact) => (
          <Link key={fact.href} href={fact.href} className="group flex items-center justify-between gap-4 px-4 py-4 first:pl-0 last:pr-0">
            <div>
              <p className="text-sm font-medium text-landing-text">{fact.value}</p>
              <p className="mt-1 text-xs text-landing-muted">{fact.label}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-[#444] transition-colors group-hover:text-accent-amber" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </nav>
  );
}

function GenerationExplainer() {
  const stages = [
    ['Template', 'The reusable contract shown on this page.'],
    ['Scenario', 'An archetype and site context are sampled.'],
    ['Difficulty tier', 'Inputs may be hidden at harder tiers.'],
    ['Task prompt', 'The model responds with the declared outputs.'],
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-9" aria-labelledby="generation-explainer">
      <h2 id="generation-explainer" className="text-xl font-semibold text-landing-text">How this task is generated</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-landing-muted">
        One template produces many comparable benchmark tasks while keeping the scoring contract fixed.
      </p>
      <ol className="mt-5 grid overflow-hidden rounded border border-landing-border bg-[#080808] md:grid-cols-4">
        {stages.map(([title, description], index) => (
          <li key={title} className="relative border-t border-landing-border p-4 first:border-t-0 md:border-l md:border-t-0 md:first:border-l-0">
            <p className="font-mono text-[0.65rem] text-accent-teal">0{index + 1}</p>
            <h3 className="mt-3 text-sm font-semibold text-landing-text">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-landing-muted">{description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function DifficultyLadder({ difficulty }: { difficulty: TemplateDifficultyDetail[] }) {
  if (difficulty.length === 0) return null;
  const allInputsGiven = difficulty.every((tier) => tier.visibility === 'all_given');
  const visibilityLabel = {
    all_given: 'All inputs given',
    partial: 'Some inputs hidden',
    scenario_only: 'Scenario description only',
  } as const;

  return (
    <section id="difficulty" className="scroll-mt-28 border-y border-landing-border bg-[#070707]" aria-labelledby="difficulty-heading">
      <div className="mx-auto max-w-6xl px-4 py-9">
        <h2 id="difficulty-heading" className="text-xl font-semibold text-landing-text">Difficulty</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-landing-muted">
          Each template is sampled at three tiers. Harder tiers may hide inputs, forcing the model to infer them from the scenario description.
        </p>
        {allInputsGiven ? (
          <div className="mt-5 rounded border border-landing-border bg-[#0b0b0b] p-5">
            <h3 className="text-base font-semibold text-landing-text">All inputs remain visible at every tier</h3>
            <p className="mt-2 text-sm leading-6 text-landing-muted">
              For this template, difficulty scales through parameter and scenario ranges rather than hidden information.
            </p>
            <dl className="mt-5 grid gap-3 md:grid-cols-3">
              {difficulty.map((tier) => (
                <div key={tier.level} className="border-t border-landing-border pt-3">
                  <dt className="text-sm font-semibold capitalize text-landing-text">{tier.level}:</dt>
                  <dd className="mt-1 text-sm leading-6 text-landing-muted">{tier.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {difficulty.map((tier) => (
              <article key={tier.level} className="rounded border border-landing-border bg-[#080808] p-4">
                <div className="flex items-baseline justify-between gap-3 border-b border-landing-border pb-3">
                  <h3 className="text-base font-semibold capitalize text-landing-text">{tier.level}</h3>
                  <p className={tier.visibility === 'all_given' ? 'text-xs text-landing-muted' : 'text-xs text-delta-down'}>
                    {visibilityLabel[tier.visibility]}
                  </p>
                </div>
                <p className="mt-4 text-sm leading-6 text-landing-muted">{tier.description}</p>
                {tier.hiddenParams.length > 0 && (
                  <div className="mt-4 border-l-2 border-delta-down pl-3">
                    <p className="text-xs font-medium text-delta-down">Hidden inputs</p>
                    <ul className="mt-2 grid gap-1">
                      {tier.hiddenParams.map((param) => (
                        <li key={param} className="flex items-center gap-2 text-xs text-landing-muted">
                          <EyeOff className="h-3 w-3 text-delta-down" aria-hidden="true" />
                          <span>{humaniseIdentifier(param)}</span>
                          <span className="font-mono text-[0.65rem]">{param}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {tier.replacementText && (
                  <div className="mt-4 rounded border border-delta-down/30 bg-delta-down/5 p-3">
                    <p className="text-[0.68rem] font-medium text-delta-down">Prompt replacement text</p>
                    <p className="mt-2 font-mono text-xs leading-5 text-landing-muted">{tier.replacementText}</p>
                  </div>
                )}
                {tier.lockedValues && tier.lockedValues.length > 0 && (
                  <div className="mt-4 border-t border-landing-border pt-3 text-xs leading-5 text-landing-muted">
                    {tier.lockedValues.map((locked) => (
                      <p key={locked.name}>
                        <span className="text-landing-text">{humaniseIdentifier(locked.name)}</span>{' '}
                        restricted to: {locked.values.join(', ')}
                      </p>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ParameterGroup({
  title,
  description,
  parameters,
  difficulty,
}: {
  title: string;
  description: string;
  parameters: TemplateParameterDetail[];
  difficulty: TemplateDifficultyDetail[];
}) {
  if (parameters.length === 0) return null;
  const rows = (
    <ul>
      {parameters.map((parameter) => (
        <ParameterRow
          key={parameter.name}
          param={parameter}
          hiddenLevels={hiddenBy(parameter.name, difficulty)}
        />
      ))}
    </ul>
  );

  return (
    <section className="overflow-hidden rounded border border-landing-border bg-[#080808]">
      <header className="flex items-start justify-between gap-4 border-b border-landing-border px-4 py-3">
        <div>
          <h4 className="text-sm font-semibold text-landing-text">{title}</h4>
          <p className="mt-1 text-xs leading-5 text-landing-muted">{description}</p>
        </div>
        <span className="font-mono text-xs text-landing-muted">{parameters.length}</span>
      </header>
      {parameters.length > 6 ? (
        <details>
          <summary className="cursor-pointer px-4 py-3 text-sm text-accent-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal">
            Show {parameters.length} inputs
          </summary>
          {rows}
        </details>
      ) : rows}
    </section>
  );
}

function ParametersSection({
  entry,
  parameters,
  difficulty,
  outputs,
}: {
  entry: LibraryCatalogueEntry;
  parameters: TemplateParameterDetail[];
  difficulty: TemplateDifficultyDetail[];
  outputs: Array<{ name: string; description?: string | null; unit?: string | null; tolerance?: number | null }>;
}) {
  const groups = groupParameters(parameters, difficulty);
  return (
    <section id="parameters" className="scroll-mt-28 mx-auto max-w-6xl px-4 py-9" aria-labelledby="parameters-heading">
      <h2 id="parameters-heading" className="text-xl font-semibold text-landing-text">Parameters</h2>
      <p className="mt-2 text-sm leading-6 text-landing-muted">Inputs the model receives, and the outputs it is scored on.</p>
      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-lg font-semibold text-landing-text">Inputs</h3>
          <p className="text-xs text-landing-muted">{plural(entry.inputs.length, 'input')}</p>
        </div>
        <div className="mt-3 grid gap-3">
          {PARAMETER_GROUPS.map((group) => (
            <ParameterGroup
              key={group.key}
              title={group.title}
              description={group.description}
              parameters={groups.get(group.key) ?? []}
              difficulty={difficulty}
            />
          ))}
        </div>
      </div>
      <div id="scored-outputs" className="scroll-mt-28 mt-9">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-lg font-semibold text-landing-text">Scored outputs</h3>
          <p className="text-xs text-landing-muted">{plural(outputs.length, 'output')}</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {outputs.map((output) => (
            <article key={output.name} className="border-l-2 border-accent-amber bg-[#0b0b0b] px-4 py-3">
              <h4 className="text-sm font-semibold text-landing-text">{humaniseIdentifier(output.name, output.unit ?? undefined)}</h4>
              <p className="mt-1 font-mono text-[0.68rem] text-landing-muted">{output.name}</p>
              {output.description && <p className="mt-3 text-sm leading-6 text-landing-muted">{output.description}</p>}
              {output.tolerance != null && (
                <p className="mt-3 text-xs leading-5 text-accent-amber">
                  Scores if within ±{Number((output.tolerance * 100).toFixed(4))}% of the reference value.
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TaskBundle({
  entry,
  artifact,
  outputs,
}: {
  entry: LibraryCatalogueEntry;
  artifact: TemplateArtifact;
  outputs: Array<{ name: string; description?: string | null; tolerance?: number | null }>;
}) {
  const enginePath = `${artifact.sourcePath}/engine.py`;
  const referenceUrl = `https://github.com/TheodoreGalanos/aec-bench/blob/${artifact.sourceCommit}/${enginePath}`;
  return (
    <section id="task-bundle" className="scroll-mt-28 mx-auto max-w-6xl px-4 py-9" aria-labelledby="task-bundle-heading">
      <h2 id="task-bundle-heading" className="text-xl font-semibold text-landing-text">Task bundle</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-landing-muted">
        The exact instruction and parameter contract used to generate this task, pinned to the published library source.
      </p>
      <div className="mt-5">
        <TaskArtifactViewer
          instruction={artifact.instruction}
          paramsToml={artifact.paramsToml}
          taskId={entry.task_id}
          toolMode={entry.tool_mode}
          outputs={outputs}
          referenceUrl={referenceUrl}
        />
      </div>
    </section>
  );
}

function TaskNavigation({
  entry,
  previousTask,
  nextTask,
}: {
  entry: LibraryCatalogueEntry;
  previousTask: LibraryCatalogueEntry | null;
  nextTask: LibraryCatalogueEntry | null;
}) {
  const resultsHref = entry.discipline === 'maritime' ? '/leaderboard' : `/leaderboard/${entry.discipline}`;
  return (
    <nav aria-label="Task navigation" className="border-t border-landing-border bg-[#070707]">
      <div className="mx-auto grid max-w-6xl gap-3 px-4 py-7 md:grid-cols-[1fr_auto_1fr] md:items-center">
        {previousTask ? (
          <Link href={`/tasks/${previousTask.discipline}/${previousTask.task_id}`} className="group rounded border border-landing-border p-4 hover:border-accent-teal/60">
            <span className="text-xs text-landing-muted">← Previous task</span>
            <span className="mt-1 block text-sm text-landing-text group-hover:text-accent-teal">{previousTask.task_name}</span>
          </Link>
        ) : <span />}
        <Link href={resultsHref} className="px-4 py-2 text-center text-sm text-accent-amber hover:text-landing-text">View {entry.discipline} results</Link>
        {nextTask ? (
          <Link href={`/tasks/${nextTask.discipline}/${nextTask.task_id}`} className="group rounded border border-landing-border p-4 text-right hover:border-accent-teal/60">
            <span className="text-xs text-landing-muted">Next task →</span>
            <span className="mt-1 block text-sm text-landing-text group-hover:text-accent-teal">{nextTask.task_name}</span>
          </Link>
        ) : <span />}
      </div>
    </nav>
  );
}

function ArchetypeAtlas({ archetypes }: { archetypes: TemplateArchetypeDetail[] }) {
  if (archetypes.length === 0) return null;

  return (
    <section id="archetypes" className="scroll-mt-28 border-y border-landing-border bg-[#070707]" aria-labelledby="archetype-atlas">
      <div className="mx-auto max-w-6xl px-4 py-9">
        <h2 id="archetype-atlas" className="text-xl font-semibold text-landing-text">Scenario archetypes</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-landing-muted">
          Each generated task is drawn from one of these realistic scenario bands.
        </p>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-accent-teal">
          Site contexts ground each scenario in a real locale the model can use to infer hidden values.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {archetypes.map((archetype) => (
            <article key={archetype.name} className="rounded border border-landing-border bg-[#0c0c0c] p-4">
              <h3 className="text-base font-semibold text-landing-text">{humaniseIdentifier(archetype.name)}</h3>
              <p className="mt-1 font-mono text-[0.68rem] text-landing-muted">{archetype.name}</p>
              <p className="text-sm leading-6 text-landing-muted">{archetype.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {archetype.siteContexts.map((context) => (
                  <span key={context} className="rounded border border-accent-teal/40 px-2 py-1 text-xs text-accent-teal">{context}</span>
                ))}
              </div>
              <details className="mt-4 border-t border-landing-border pt-3">
                <summary className="cursor-pointer text-xs text-landing-muted hover:text-landing-text">Parameter ranges</summary>
                <dl className="mt-3 grid gap-2">
                  {archetype.fields.map((field) => (
                    <div key={field.name} className="grid grid-cols-[minmax(120px,0.8fr)_1fr] gap-3 text-xs">
                      <dt className="break-words font-mono text-landing-muted">{field.name}</dt>
                      <dd className="text-landing-text">{field.range ? formatRange(field.range) : field.values?.join(', ')}</dd>
                    </div>
                  ))}
                </dl>
              </details>
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
  const visibilityLabel = {
    all_given: 'All inputs given',
    partial: 'Some inputs hidden',
    scenario_only: 'Scenario description only',
  } as const;
  const tier = detail?.difficulty.find((difficulty) => difficulty.level === sample.difficulty);

  return (
    <section id="generated-preview" className="scroll-mt-28 mx-auto max-w-6xl px-4 py-9" aria-labelledby="generated-preview-heading">
      <h2 id="generated-preview-heading" className="text-xl font-semibold text-landing-text">Example task</h2>
      <p className="mt-2 text-sm leading-6 text-landing-muted">{sample.name} — {sample.difficulty} difficulty, {visibilityLabel[sample.visibility].toLowerCase()}.</p>
      <blockquote className="mt-5 border-l-2 border-accent-teal pl-4 text-sm leading-6 text-landing-muted">{sample.promptExcerpt}</blockquote>
      <div className="mt-5 grid overflow-hidden rounded border border-landing-border bg-[#070707] lg:grid-cols-3">
        <article className="p-4 lg:border-r lg:border-landing-border">
          <h3 className="text-base font-semibold text-landing-text">The model sees</h3>
          <p className="mt-1 text-xs text-landing-muted">Scenario context and visible inputs.</p>
          <dl className="mt-4 grid gap-2">
            {sample.visibleInputs.map((input) => (
              <div key={input.name} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-landing-border pt-2 text-xs">
                <dt className="break-words font-mono text-landing-muted">{input.name}</dt>
                <dd className="text-landing-text">{input.value}{input.unit ? ` ${input.unit}` : ''}</dd>
              </div>
            ))}
          </dl>
          {sample.toolScripts.length > 0 && (
            <p className="mt-4 flex items-center gap-2 text-xs text-landing-muted"><Wrench className="h-3.5 w-3.5 text-delta-up" aria-hidden="true" />Executable tool: {sample.toolScripts.join(', ')}</p>
          )}
        </article>
        <article className="border-t border-landing-border p-4 lg:border-r lg:border-t-0">
          <h3 className="text-base font-semibold text-landing-text">The model must infer</h3>
          <p className="mt-1 text-xs text-landing-muted">Inputs withheld at this difficulty.</p>
          {sample.hiddenInputs.length > 0 ? (
            <ul className="mt-4 grid gap-3">
              {sample.hiddenInputs.map((input) => (
                <li key={input} className="border-l-2 border-delta-down pl-3">
                  <p className="text-sm text-landing-text">{humaniseIdentifier(input)}</p>
                  <p className="mt-1 font-mono text-[0.68rem] text-landing-muted">{input}</p>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-sm text-landing-muted">Nothing. All inputs are supplied.</p>}
          {tier?.replacementText && (
            <div className="mt-4 rounded border border-delta-down/30 bg-delta-down/5 p-3">
              <p className="text-xs text-delta-down">Stand-in text in the prompt</p>
              <p className="mt-2 font-mono text-xs leading-5 text-landing-muted">{tier.replacementText}</p>
            </div>
          )}
        </article>
        <article className="border-t border-landing-border p-4 lg:border-t-0">
          <h3 className="text-base font-semibold text-landing-text">The model must produce</h3>
          <p className="mt-1 text-xs text-landing-muted">The scored JSON answer schema.</p>
          <pre className="mt-4 overflow-auto border-l-2 border-accent-amber bg-[#0a0a0a] p-3 font-mono text-xs leading-6 text-accent-amber"><code>{`{\n${sample.withheldOutputs.map((output) => `  "${output}": <number>`).join(',\n')}\n}`}</code></pre>
          <ul className="mt-4 grid gap-1 text-xs text-landing-muted">
            {sample.withheldOutputs.map((outputName) => {
              const output = detail?.outputs.find((candidate) => candidate.name === outputName);
              return (
                <li key={outputName}>
                  <span className="font-mono text-landing-text">{outputName}</span>
                  {output?.tolerance != null && <> · scored within ±{Number((output.tolerance * 100).toFixed(4))}%</>}
                </li>
              );
            })}
          </ul>
        </article>
      </div>
    </section>
  );
}

export function TaskTemplateDetail({
  entry,
  detail,
  artifact,
  variants,
  previousTask,
  nextTask,
}: TaskTemplateDetailProps) {
  const parameters = detail?.parameters ?? fallbackParameters(entry);
  const outputs = detail?.outputs ?? entry.outputs;
  const relatedVariants = variants.filter((variant) => variant.discipline !== entry.discipline);
  const toolExplanation = entry.tool_mode === 'with-tool'
    ? 'The model is given an executable Python calculator script.'
    : 'The model must reason numerically unaided.';

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
          <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 font-mono text-xs text-landing-muted">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <Link href="/tasks" className="hover:text-accent-amber">Task Library</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/tasks?discipline=${entry.discipline}`} className="capitalize hover:text-accent-amber">{entry.discipline}</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/tasks?discipline=${entry.discipline}&category=${entry.category}`} className="hover:text-accent-amber">{entry.category}</Link>
          </nav>
          <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className={disciplineBadgeClass(entry.discipline)}>{entry.discipline}</span>
                <span className={utilityBadgeClass()}>{entry.tool_mode ?? 'tool mode unset'}</span>
              </div>
              <h1 className="max-w-full break-words text-4xl font-semibold tracking-normal text-landing-text md:max-w-3xl md:text-6xl">
                {entry.task_name}
              </h1>
              <p className="mt-5 max-w-full break-words text-base leading-7 text-landing-muted md:max-w-3xl md:text-lg">
                {entry.long_description ?? entry.description}
              </p>
              <p className="mt-4 max-w-3xl text-sm text-landing-muted">
                <span className="font-medium text-landing-text">{entry.tool_mode ?? 'Tool mode'}:</span>{' '}
                {toolExplanation}
              </p>
              {entry.standards.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs text-landing-muted">Standards</p>
                  <div className="mt-2 grid max-w-xl grid-cols-3 gap-2">
                    {entry.standards.map((standard) => (
                      <Link key={standard} href={`/tasks?standard=${encodeURIComponent(standard)}`} className="rounded border border-landing-border px-2 py-1 text-center font-mono text-xs text-landing-text transition-colors hover:border-accent-amber hover:text-accent-amber">
                        {standard}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {entry.tags && entry.tags.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-landing-muted">Tags</p>
                  <div className="mt-2 grid max-w-xl grid-cols-3 gap-2">
                    {entry.tags.map((tag) => (
                      <Link key={tag} href={`/tasks?tag=${encodeURIComponent(tag)}`} className="text-sm text-landing-muted underline decoration-[#444] underline-offset-4 transition-colors hover:text-landing-text">
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <aside className="min-w-0 overflow-hidden rounded border border-landing-border bg-[#050505] p-4">
              <p className="font-mono text-xs uppercase tracking-wider text-landing-muted">template identity</p>
              <dl className="mt-4 grid min-w-0 gap-2 font-mono text-xs">
                <div className="grid gap-1">
                  <dt className="text-landing-muted">task ID</dt>
                  <dd className="min-w-0 break-all text-landing-text">{entry.task_id}</dd>
                </div>
                {detail?.sourcePath && (
                  <div className="grid gap-1 border-t border-landing-border pt-3">
                    <dt className="text-landing-muted">template path</dt>
                    <dd className="min-w-0 break-all">
                      <a
                        href={`https://github.com/TheodoreGalanos/aec-bench/blob/${artifact.sourceCommit}/${detail.sourcePath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent-teal hover:text-landing-text"
                      >
                        {detail.sourcePath}
                      </a>
                    </dd>
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
                        className="text-sm text-landing-muted underline decoration-[#444] underline-offset-4 hover:text-landing-text"
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

      <OverviewPanel entry={entry} />
      <GenerationExplainer />
      <ParametersSection
        entry={entry}
        parameters={parameters}
        difficulty={detail?.difficulty ?? []}
        outputs={outputs}
      />

      <DifficultyLadder difficulty={detail?.difficulty ?? []} />
      <TaskBundle entry={entry} artifact={artifact} outputs={outputs} />
      <ArchetypeAtlas archetypes={detail?.archetypes ?? []} />
      <GeneratedPreview detail={detail} />
      <TaskNavigation entry={entry} previousTask={previousTask} nextTask={nextTask} />
    </main>
  );
}
