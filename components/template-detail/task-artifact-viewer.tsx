'use client';

// ABOUTME: Interactive viewer for the exact instruction, contract, and scoring surface of a task.
// ABOUTME: Highlights Jinja visibility regions and keeps all source content pinned at build time.
import { useState } from 'react';
import { ExternalLink, FileCode2, FileText, Folder, Wrench } from 'lucide-react';

type ArtifactTab = 'instruction' | 'contract' | 'scoring';

interface ScoredOutput {
  name: string;
  description?: string | null;
  tolerance?: number | null;
}

export interface TaskArtifactViewerProps {
  instruction: string;
  paramsToml: string;
  taskId: string;
  toolMode?: string | null;
  outputs: ScoredOutput[];
  referenceUrl: string;
}

function InstructionCode({ source }: { source: string }) {
  let conditionalDepth = 0;
  return (
    <code className="block min-w-max font-mono text-xs leading-6">
      {source.split('\n').map((line, index) => {
        const closesConditional = /\{%\s*endif\s*%\}/.test(line);
        const opensConditional = /\{%\s*if\b/.test(line);
        const isConditional = conditionalDepth > 0 || opensConditional || closesConditional;
        const trimmed = line.trim();
        const syntaxClass = /\{%|\{\{/.test(line)
          ? 'text-accent-teal'
          : trimmed.startsWith('#')
            ? 'font-semibold text-landing-text'
            : trimmed.startsWith('```')
              ? 'text-accent-amber'
              : 'text-landing-muted';
        if (opensConditional) conditionalDepth += 1;
        if (closesConditional) conditionalDepth = Math.max(0, conditionalDepth - 1);
        return (
          <span key={`${index}-${line}`} className={`block px-4 ${syntaxClass} ${isConditional ? 'border-l-2 border-accent-teal/60 bg-accent-teal/5' : 'border-l-2 border-transparent'}`}>
            <span className="mr-5 inline-block w-7 select-none text-right text-[#444]">{index + 1}</span>
            {line || ' '}
          </span>
        );
      })}
    </code>
  );
}

function PlainCode({ source }: { source: string }) {
  return (
    <code className="block min-w-max whitespace-pre px-4 py-3 font-mono text-xs leading-6 text-landing-muted">
      {source}
    </code>
  );
}

export function TaskArtifactViewer({
  instruction,
  paramsToml,
  taskId,
  toolMode,
  outputs,
  referenceUrl,
}: TaskArtifactViewerProps) {
  const [tab, setTab] = useState<ArtifactTab>('instruction');
  const tabs: Array<{ key: ArtifactTab; label: string }> = [
    { key: 'instruction', label: 'Instruction template' },
    { key: 'contract', label: 'Contract source' },
    { key: 'scoring', label: 'Scoring' },
  ];
  const answerSchema = `{
${outputs.map((output) => `  "${output.name}": <numeric_value>`).join(',\n')}
}`;

  return (
    <div className="overflow-hidden rounded border border-landing-border bg-[#050505]">
      <div className="grid border-b border-landing-border bg-[#090909] lg:grid-cols-[250px_minmax(0,1fr)]">
        <div className="border-b border-landing-border p-4 lg:border-b-0 lg:border-r">
          <p className="flex items-center gap-2 font-mono text-xs text-landing-muted">
            <Folder className="h-3.5 w-3.5 text-accent-teal" aria-hidden="true" />
            /workspace
          </p>
          <ul className="mt-3 grid gap-2 pl-5 font-mono text-[0.68rem] text-landing-muted">
            <li className="flex items-center gap-2"><FileText className="h-3 w-3" aria-hidden="true" />instruction.md</li>
            {toolMode === 'with-tool' && (
              <li className="flex items-center gap-2"><Wrench className="h-3 w-3 text-delta-up" aria-hidden="true" />{taskId}_calc.py</li>
            )}
          </ul>
        </div>
        <div className="flex items-end overflow-x-auto px-2" role="tablist" aria-label="Task bundle files">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
              className={`whitespace-nowrap border-b-2 px-4 py-4 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-teal ${tab === item.key ? 'border-accent-amber text-landing-text' : 'border-transparent text-landing-muted hover:text-landing-text'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'instruction' && (
        <div role="tabpanel" className="max-h-[620px] overflow-auto py-3 text-landing-muted">
          <p className="mx-4 mb-3 border-l-2 border-accent-teal pl-3 text-xs leading-5 text-landing-muted">
            Teal lines are Jinja visibility conditions. They render only when that input or tool is visible.
          </p>
          <InstructionCode source={instruction} />
        </div>
      )}
      {tab === 'contract' && (
        <div role="tabpanel" className="max-h-[620px] overflow-auto">
          <PlainCode source={paramsToml} />
        </div>
      )}
      {tab === 'scoring' && (
        <div role="tabpanel" className="grid gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
          <div>
            <h3 className="text-sm font-semibold text-landing-text">Expected answer</h3>
            <pre className="mt-3 overflow-auto rounded border border-landing-border bg-[#0a0a0a] p-4 text-xs leading-6 text-accent-amber">
              <code>{answerSchema}</code>
            </pre>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-landing-text">Rubric</h3>
            <ul className="mt-3 grid gap-3">
              {outputs.map((output) => (
                <li key={output.name} className="border-t border-landing-border pt-3 text-xs leading-5 text-landing-muted">
                  <span className="font-mono text-landing-text">{output.name}</span>
                  {output.tolerance != null && <span> — within ±{Number((output.tolerance * 100).toFixed(4))}%</span>}
                </li>
              ))}
            </ul>
            <a href={referenceUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm text-accent-teal hover:text-landing-text">
              <FileCode2 className="h-4 w-4" aria-hidden="true" />
              Reference implementation
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
