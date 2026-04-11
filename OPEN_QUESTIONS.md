# Open Questions

Decisions to resolve before or during implementation. Update this file as questions are answered.

---

## Open

### 6. Discipline Icons

**Question:** What icons represent each engineering discipline in the disciplines showcase?

**Candidates (Lucide):**

| Discipline | Icon options |
|------------|-------------|
| Civil | `road`, `droplets`, `mountain` |
| Electrical | `zap`, `cable`, `plug` |
| Ground | `layers`, `shovel`, `mountain-snow` |
| Mechanical | `fan`, `thermometer`, `cog` |
| Structural | `building`, `columns`, `triangle` |

**Status:** Open — pick during implementation, see what looks best visually.

---

## Resolved

### 1. Logo & Branding

**Decision (2026-04-11):** Bench press + hard hat line art (Gemini-generated PNG). Two variants: `logo-light.png` (dark lines, light bg) and `logo-dark.png` (light lines, dark bg). Text wordmark "AEC-Bench" in Inter Bold alongside the icon. Original pixel art retained for social/fun use.

---

### 2. Supabase Auth for Leaderboard Submissions

**Decision (2026-04-11):** Manual-only submissions to start (we control the data). Add API key auth when external contributors need to submit.

---

### 3. Leaderboard Moderation

**Decision (2026-04-11):** Not needed initially (manual-only submissions). When we open submissions: trusted submitters + reproducibility hashes.

---

### 4. Search Provider

**Decision (2026-04-11):** Fumadocs built-in search. Revisit if docs grow past ~50 pages and search quality suffers.

---

### 5. Chart Library

**Decision (2026-04-11):** Nivo. Better theming system for dark mode, nicer radar chart defaults. Bundle size is not a concern for a docs site.

---

### 7. Blog Authoring

**Decision (2026-04-11):** Theo writes blog posts manually in `/blog` for AEC-Bench-specific announcements (leaderboard updates, new task releases, etc.). Deeper research and thought pieces live on [theharness.blog](https://www.theharness.blog), linked from the site nav/footer.

---

### 8. Per-Task Breakdown in Leaderboard

**Decision (2026-04-11):** Phased. Launch with per-discipline aggregates (5 rows per model). Add per-task drill-down in a later phase when there is enough data to make it useful.
