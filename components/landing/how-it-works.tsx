// ABOUTME: How It Works section explaining the benchmark methodology.
// ABOUTME: Displays three steps: Tasks, Run, Score.
import { Library, Play, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

const steps: Step[] = [
  { number: 1, title: 'Tasks', description: '500+ seed tasks spanning 5 engineering disciplines, each with domain-specific evaluation criteria.', icon: Library },
  { number: 2, title: 'Run', description: 'AI agents attempt tasks using tool-calling, reasoning loops, or direct generation.', icon: Play },
  { number: 3, title: 'Score', description: 'Automated reward signals measure correctness against engineering standards.', icon: BarChart3 },
];

export function HowItWorks() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-landing-text md:text-4xl">How It Works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-landing-border bg-landing-card">
                <step.icon className="h-6 w-6 text-accent-amber" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-landing-text">{step.title}</h3>
              <p className="text-sm text-landing-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
