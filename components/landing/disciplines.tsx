// ABOUTME: Disciplines showcase grid for the landing page.
// ABOUTME: Displays the 5 AEC engineering disciplines with icons and descriptions.
import { Droplets, Zap, Layers, Fan, Building } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Discipline {
  name: string;
  description: string;
  icon: LucideIcon;
}

const disciplines: Discipline[] = [
  { name: 'Civil', description: 'Roads, drainage, hydraulics, earthworks', icon: Droplets },
  { name: 'Electrical', description: 'Cable sizing, fault current, lighting, power systems', icon: Zap },
  { name: 'Ground', description: 'Foundations, slopes, retaining walls', icon: Layers },
  { name: 'Mechanical', description: 'HVAC, fire protection, piping, acoustics', icon: Fan },
  { name: 'Structural', description: 'Steel/concrete design, seismic, connections', icon: Building },
];

export function Disciplines() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-landing-text md:text-4xl">
          Five Engineering Disciplines
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {disciplines.map((d) => (
            <div key={d.name} className="rounded-xl border border-landing-border bg-landing-card p-6 transition-colors hover:border-accent-amber">
              <d.icon className="mb-4 h-8 w-8 text-accent-teal" />
              <h3 className="mb-2 text-lg font-semibold text-landing-text">{d.name}</h3>
              <p className="text-sm text-landing-muted">{d.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
