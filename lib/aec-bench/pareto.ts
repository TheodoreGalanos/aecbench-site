// ABOUTME: Pareto frontier computation — max-y + min-x set.
// ABOUTME: Pure, O(n²), safe for n ≤ a few hundred; we use it with n ≤ 40.

export interface ScatterPoint {
  key: string;
  x: number;
  y: number;
}

export interface ParetoOptions {
  xHigherIsBetter?: boolean;
}

export function computeParetoFrontier(
  points: ReadonlyArray<ScatterPoint>,
  options: ParetoOptions = {},
): ReadonlySet<string> {
  const frontier = new Set<string>();
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    let dominated = false;
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const q = points[j];
      // q dominates p iff q is at least as good on both AND strictly better on at least one.
      const atLeastAsGoodOnX = options.xHigherIsBetter ? q.x >= p.x : q.x <= p.x;
      const strictlyBetterOnX = options.xHigherIsBetter ? q.x > p.x : q.x < p.x;
      const atLeastAsGood = atLeastAsGoodOnX && q.y >= p.y;
      const strictlyBetter = strictlyBetterOnX || q.y > p.y;
      if (atLeastAsGood && strictlyBetter) {
        dominated = true;
        break;
      }
    }
    if (!dominated) frontier.add(p.key);
  }
  return frontier;
}
