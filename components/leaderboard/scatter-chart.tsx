// ABOUTME: Hand-rolled responsive SVG scatter — dots, axes, gridlines, hover, keyboard nav.
// ABOUTME: Frontier polyline delegated to <ParetoOverlay />; tooltip to <TooltipCard />.
'use client';
import { useMemo, useRef } from 'react';
import type { LeaderboardEntry, Provider } from '@/lib/aec-bench/contracts';
import { harnessGlyph, type GlyphShape } from '@/lib/aec-bench/harness-glyph';
import { type AxisMetric } from '@/lib/aec-bench/axis-metric';
import { ParetoOverlay } from './pareto-overlay';
import { TooltipCard } from './tooltip-card';

const PROVIDER_COLOURS: Record<Provider, string> = {
  anthropic: '#b5651d',
  openai: '#38b2ac',
  google: '#e8a838',
  meta: '#9333ea',
  other: '#888',
};

const VB_W = 800;
const VB_H = 400;
const PLOT = { l: 48, r: 16, t: 16, b: 40 };

export interface ScatterChartProps {
  entries: ReadonlyArray<LeaderboardEntry>;
  axisMetric: AxisMetric;
  yAxisLabel: string;
  frontierKeys: ReadonlySet<string>;
  hoveredRowKey: string | null;
  expandedRowKey: string | null;
  onDotHover: (key: string | null) => void;
  onDotClick: (key: string) => void;
}

function rowKey(e: LeaderboardEntry): string {
  return `${e.model_key}::${e.adapter}`;
}

function makeLinear(dMin: number, dMax: number, rMin: number, rMax: number) {
  const span = dMax - dMin || 1;
  return (v: number) => rMin + ((v - dMin) * (rMax - rMin)) / span;
}

function DotGlyph({
  shape,
  fill,
  size,
  frontier,
}: {
  shape: GlyphShape;
  fill: string;
  size: number;
  frontier: boolean;
}) {
  const ring = frontier ? { stroke: '#e8a838', strokeWidth: 2 } : {};
  switch (shape) {
    case 'circle':
      return <circle r={size} fill={fill} {...ring} />;
    case 'square':
      return (
        <rect
          x={-size}
          y={-size}
          width={size * 2}
          height={size * 2}
          fill={fill}
          transform="rotate(45)"
          {...ring}
        />
      );
    case 'triangle':
      return <polygon points={`0,${-size} ${size},${size} ${-size},${size}`} fill={fill} {...ring} />;
    case 'ring':
      return <circle r={size} fill="none" stroke={fill} strokeWidth={2} {...ring} />;
    case 'diamond':
    default:
      return <polygon points={`0,${-size} ${size},0 0,${size} ${-size},0`} fill={fill} {...ring} />;
  }
}

export function ScatterChart({
  entries,
  axisMetric,
  yAxisLabel,
  frontierKeys,
  hoveredRowKey,
  expandedRowKey,
  onDotHover,
  onDotClick,
}: ScatterChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const xs = useMemo(
    () =>
      entries
        .map((e) => axisMetric.accessor(e))
        .filter((v): v is number => v !== null),
    [entries, axisMetric],
  );
  const xMax = xs.length ? Math.max(...xs) * 1.05 : 1;
  const scaleX = makeLinear(0, xMax, PLOT.l, VB_W - PLOT.r);
  const scaleY = makeLinear(0, 1, VB_H - PLOT.b, PLOT.t);

  const scaled = useMemo(
    () =>
      entries
        .map((e) => ({
          key: rowKey(e),
          entry: e,
          rawX: axisMetric.accessor(e),
          rawY: e.reward,
        }))
        .filter((p) => p.rawX !== null)
        .map((p) => ({
          key: p.key,
          entry: p.entry,
          x: scaleX(p.rawX as number),
          y: scaleY(p.rawY),
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, axisMetric, xMax],
  );

  const hoveredPoint = hoveredRowKey !== null ? scaled.find((p) => p.key === hoveredRowKey) : null;

  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let i = 0; i <= 5; i++) ticks.push((xMax * i) / 5);
    return ticks;
  }, [xMax]);

  const yTicks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];

  if (entries.length === 0) {
    return (
      <div className="relative flex h-72 items-center justify-center rounded-sm border border-landing-border bg-[#050505] font-mono text-xs text-[#888]">
        no entries match · clear filters to see the full frontier
      </div>
    );
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto"
        role="img"
        aria-label={`Scatter chart of ${yAxisLabel} versus ${axisMetric.label}`}
      >
        {/* y gridlines */}
        {yTicks.map((t) => (
          <line
            key={`gy-${t}`}
            x1={PLOT.l}
            x2={VB_W - PLOT.r}
            y1={scaleY(t)}
            y2={scaleY(t)}
            stroke="#1a1a1a"
            strokeWidth={0.5}
          />
        ))}

        {/* axes */}
        <line x1={PLOT.l} x2={VB_W - PLOT.r} y1={VB_H - PLOT.b} y2={VB_H - PLOT.b} stroke="#333" />
        <line x1={PLOT.l} x2={PLOT.l} y1={PLOT.t} y2={VB_H - PLOT.b} stroke="#333" />

        {/* x ticks + labels */}
        {xTicks.map((t) => (
          <g key={`xt-${t}`}>
            <line
              x1={scaleX(t)}
              x2={scaleX(t)}
              y1={VB_H - PLOT.b}
              y2={VB_H - PLOT.b + 4}
              stroke="#555"
            />
            <text
              x={scaleX(t)}
              y={VB_H - PLOT.b + 16}
              fill="#888"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              textAnchor="middle"
            >
              {axisMetric.format(t)}
            </text>
          </g>
        ))}

        {/* y ticks + labels */}
        {yTicks.map((t) => (
          <g key={`yt-${t}`}>
            <line x1={PLOT.l - 4} x2={PLOT.l} y1={scaleY(t)} y2={scaleY(t)} stroke="#555" />
            <text
              x={PLOT.l - 8}
              y={scaleY(t) + 3}
              fill="#888"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              textAnchor="end"
            >
              {t.toFixed(1)}
            </text>
          </g>
        ))}

        {/* axis labels */}
        <text
          x={(VB_W + PLOT.l - PLOT.r) / 2}
          y={VB_H - 8}
          fill="#666"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          textAnchor="middle"
        >
          {axisMetric.label}
        </text>
        <text
          x={14}
          y={VB_H / 2}
          fill="#666"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          textAnchor="middle"
          transform={`rotate(-90 14 ${VB_H / 2})`}
        >
          {yAxisLabel}
        </text>

        {/* frontier polyline */}
        <ParetoOverlay
          points={scaled.map(({ key, x, y }) => ({ key, x, y }))}
          frontierKeys={frontierKeys}
        />

        {/* dots */}
        {scaled.map(({ key, entry, x, y }) => {
          const shape = harnessGlyph(entry.adapter);
          const isFrontier = frontierKeys.has(key);
          const isHovered = hoveredRowKey === key;
          const isExpanded = expandedRowKey === key;
          const baseSize = 6;
          const size = isHovered ? baseSize * 1.4 : baseSize;
          const showRing = isFrontier || isExpanded;
          const rawX = axisMetric.accessor(entry);

          return (
            <g
              key={key}
              data-testid={`dot-${key}`}
              data-frontier={isFrontier}
              role="button"
              tabIndex={0}
              aria-label={`${entry.model_display} ${entry.adapter}, reward ${entry.reward.toFixed(2)}, ${axisMetric.key} ${rawX === null ? 'unknown' : axisMetric.format(rawX)}`}
              transform={`translate(${x}, ${y})`}
              onMouseEnter={() => onDotHover(key)}
              onMouseLeave={() => onDotHover(null)}
              onFocus={() => onDotHover(key)}
              onBlur={() => onDotHover(null)}
              onClick={() => onDotClick(key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onDotClick(key);
                } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const sorted = [...scaled].sort((a, b) => a.x - b.x);
                  const i = sorted.findIndex((p) => p.key === key);
                  // Wrap around so every dot has a neighbour to move to.
                  const nextIndex =
                    e.key === 'ArrowRight'
                      ? (i + 1) % sorted.length
                      : (i - 1 + sorted.length) % sorted.length;
                  const next = sorted[nextIndex];
                  if (next && svgRef.current) {
                    // Iterate all dot groups and match by data-testid value to avoid
                    // CSS selector escaping issues with the '::' in row keys.
                    const allDots = svgRef.current.querySelectorAll<SVGGElement>('[data-testid^="dot-"]');
                    const targetDot = Array.from(allDots).find(
                      (el) => el.getAttribute('data-testid') === `dot-${next.key}`,
                    );
                    targetDot?.focus();
                  }
                }
              }}
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              <DotGlyph
                shape={shape}
                fill={PROVIDER_COLOURS[entry.provider]}
                size={size}
                frontier={showRing}
              />
            </g>
          );
        })}
      </svg>

      {hoveredPoint !== null && hoveredPoint !== undefined && (
        <TooltipCard
          entry={hoveredPoint.entry}
          axisMetric={axisMetric}
          onFrontier={frontierKeys.has(hoveredPoint.key)}
          variant="floating"
          style={{
            left: `${(hoveredPoint.x / VB_W) * 100}%`,
            top: `${(hoveredPoint.y / VB_H) * 100}%`,
            transform: 'translate(12px, -100%)',
          }}
        />
      )}
    </div>
  );
}
