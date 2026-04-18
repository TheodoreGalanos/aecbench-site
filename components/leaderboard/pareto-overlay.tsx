// ABOUTME: Draws the dashed amber polyline connecting Pareto-optimal scatter points.
// ABOUTME: Consumes already-scaled (SVG-coordinate) points + frontier key set.

export interface ScaledPoint {
  key: string;
  x: number;
  y: number;
}

export interface ParetoOverlayProps {
  points: ReadonlyArray<ScaledPoint>;
  frontierKeys: ReadonlySet<string>;
}

export function ParetoOverlay({ points, frontierKeys }: ParetoOverlayProps) {
  if (points.length < 3) return null;
  const frontier = points
    .filter((p) => frontierKeys.has(p.key))
    .sort((a, b) => a.x - b.x);
  if (frontier.length === 0) return null;

  const attr = frontier.map((p) => `${p.x},${p.y}`).join(' ');
  return (
    <polyline
      points={attr}
      fill="none"
      stroke="#e8a838"
      strokeWidth={1.5}
      strokeDasharray="4,3"
      aria-hidden="true"
    />
  );
}
