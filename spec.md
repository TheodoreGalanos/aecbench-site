# aecbench.com — Benchmark & Community Site Spec

**Date:** 2026-04-11
**Status:** Spec complete, ready for implementation
**Repo:** New standalone repo (`aecbench-site`)
**Domain:** aecbench.com
**Hosting:** Vercel
**Audience:** AI researchers, engineering practitioners, and open-source contributors

**Positioning:** AEC-Bench is the definitive benchmark for measuring AI capability on real Architecture, Engineering & Construction tasks. The site leads with results and community, not the tool. Think SWE-bench's authority meets ARC Prize's warmth.

---

## 1. Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Next.js 15** (App Router) | SSR for landing/leaderboard, static for docs |
| Docs engine | **Fumadocs** | MDX content, sidebar nav, search, dark/light mode |
| Styling | **Tailwind CSS 4** | Utility-first, matches Fumadocs defaults |
| Icons | **Lucide React** | Consistent with Fumadocs icon system |
| Fonts | Inter (body), JetBrains Mono (code) | Clean, technical. Inter matches Fumadocs default |
| Leaderboard DB | **Supabase** (Postgres) | REST API, free tier, real-time capability |
| Charts | **Nivo** | Radar, bar, scatter charts for leaderboard. Better theming for dark mode |
| Package manager | **pnpm** | Fast, disk-efficient |
| Node | **22+** | Fumadocs minimum requirement |

### Scaffold Command

```bash
npm create fumadocs-app  # Select Next.js, Fumadocs MDX
```

---

## 2. Design Language

### Landing Page (aecbench.com/)

**Vibe:** Modern dark tech — ARC Prize-inspired but warmer, less computerised. Credible and serious without being cold.

| Element | Value |
|---------|-------|
| Background | Dark charcoal (#0a0a0a to #1a1a1a gradient) |
| Text primary | Off-white (#f0f0f0) |
| Text secondary | Muted grey (#888) |
| Accent primary | Warm amber/gold (#e8a838) — engineering warmth |
| Accent secondary | Teal (#38b2ac) — technical precision |
| Cards | Subtle lighter bg (#1e1e1e), 1px border (#2a2a2a), rounded-xl |
| Code blocks | #0d0d0d with syntax highlighting |

### Docs Pages (aecbench.com/docs/*)

Use **Fumadocs default theme** with minor customisations:
- Light/dark mode toggle (default to dark)
- Sidebar follows Fumadocs conventions
- Accent colour matches landing page amber
- Code blocks use JetBrains Mono

### Typography

| Role | Font | Weight |
|------|------|--------|
| Headings | Inter | 700 (bold) |
| Body | Inter | 400 (regular) |
| Code / data | JetBrains Mono | 400 |
| Nav items | Inter | 500 (medium) |

---

## 3. Site Structure

### Logo

Bench press + hard hat line art (PNG). Two variants:
- `logo-light.png` — dark lines on light background (for light mode)
- `logo-dark.png` — light lines on dark background (for dark mode / landing page)
- Text wordmark "AEC-Bench" in Inter Bold alongside the icon

### Top-Level Navigation Bar

```
[Logo: AEC-Bench]    Docs    Leaderboard    Blog    The Harness (external)    [GitHub icon]
```

### Pages

| Route | Type | Description |
|-------|------|-------------|
| `/` | Landing page | Hero, features, disciplines, CTA |
| `/docs/**` | Fumadocs | Full documentation site |
| `/leaderboard` | Dynamic page | Model comparison table + charts |
| `/blog` | MDX collection | Announcements, research posts, releases |

---

## 4. Landing Page Sections

### 4.1 Hero

- Bold headline: "How Capable Is AI at Real Engineering?"
- Subtitle: "AEC-Bench measures AI performance across 500+ tasks in architecture, engineering and construction — from cable sizing to seismic design."
- Two CTAs: "Explore Results" (-> /leaderboard) and "Read the Docs" (-> /docs)
- Subtle background: abstract grid/mesh pattern, low opacity

### 4.2 Leaderboard Preview

A compact summary of current benchmark standings — teaser view of the full leaderboard:
- Top 3–5 models with overall scores
- Sparkline or mini radar showing discipline spread
- "View Full Leaderboard" link (-> /leaderboard)

### 4.3 Disciplines Showcase

Visual grid showing the 5 disciplines with icons, example task types, and task counts:
- Civil — Roads, drainage, hydraulics, earthworks
- Electrical — Cable sizing, fault current, lighting, power systems
- Ground — Foundations, slopes, retaining walls
- Mechanical — HVAC, fire protection, piping, acoustics
- Structural — Steel/concrete design, seismic, connections

### 4.4 How It Works

Brief 3-step explanation of the benchmark methodology:
1. **Tasks** — 500+ seed tasks spanning 5 engineering disciplines, each with domain-specific evaluation criteria
2. **Run** — AI agents attempt tasks using tool-calling, reasoning loops, or direct generation
3. **Score** — Automated reward signals measure correctness against engineering standards

### 4.5 Call-to-Action

"Evaluate your model against real engineering challenges."
- Primary CTA: "Submit Your Model" (-> /docs/quickstart)
- Secondary: "Contribute Tasks" (-> /docs/core/tasks)
- GitHub link

---

## 5. Documentation Structure (/docs)

### Sidebar Navigation

```
Start
├── Introduction
├── Quickstart
└── Installation

Core
├── Architecture
├── Contracts & Data Models
├── Tasks
│   ├── Task Structure
│   ├── Seed Tasks
│   └── Generated Instances
└── Templates
    ├── Template Engine
    └── Creating Templates

Agents
├── Overview
├── Harnesses
│   ├── Tool Loop
│   ├── RLM (Reasoning Loop)
│   ├── Lambda-RLM
│   └── Direct
├── Building Custom Agents
└── Provider Configuration

Evaluation
├── Scoring & Rewards
├── Trace Analysis
└── Behavioural Classification

Advanced
├── Evolution
│   ├── Hill-Climb Strategy
│   └── MAP-Elites / QD
├── Datasets
├── Harness (Trial Orchestration)
└── Advisor Strategy

Reference
├── CLI Commands
├── Configuration (aec-bench.toml)
└── Environment Variables
```

### Content Sources

Hand-written MDX. Existing markdown files in `docs/` of the library repo serve as reference material but will be rewritten for the external audience — more context, clearer onboarding, less internal jargon.

---

## 6. Leaderboard Page (/leaderboard)

### Data Source

**Supabase Postgres** with the following schema (initial):

```sql
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,          -- e.g. "Claude Sonnet 4"
  provider TEXT NOT NULL,      -- e.g. "Anthropic"
  family TEXT,                 -- e.g. "Claude 4"
  color TEXT,                  -- hex color for charts
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES models(id),
  discipline TEXT NOT NULL,    -- civil, electrical, ground, mechanical, structural
  task_count INT NOT NULL,     -- number of tasks evaluated
  mean_reward FLOAT NOT NULL,  -- 0.0 - 1.0
  median_reward FLOAT,
  total_tokens BIGINT,
  total_cost_usd FLOAT,
  dataset_version TEXT,        -- e.g. "core@1.0.0"
  evaluated_at TIMESTAMPTZ DEFAULT now()
);
```

### Views

**Table View (default):**
- Sortable columns: Model, Provider, Overall Score, per-discipline scores
- Filter by discipline, provider, model family
- Click row to expand per-discipline breakdown (per-task drill-down in a later phase)

**Chart View (toggle):**
- Radar chart: model performance across disciplines
- Bar chart: model comparison within a single discipline
- Cost-efficiency scatter: reward vs. tokens/cost

### Data Flow

1. Run benchmarks locally with `aec-bench run`
2. Results land in local ledger
3. Script/CLI command exports results to Supabase (manual-only for now; API key auth when external contributors need to submit)
4. Leaderboard page queries Supabase via Next.js API routes (or direct client)

---

## 7. Blog (/blog)

- MDX-based, file-system routing (similar to Fumadocs content source)
- Each post: title, date, author, tags, hero image (optional)
- List page with cards, tag filtering
- Individual post pages with ToC sidebar
- RSS feed
- Authored manually by Theo — AEC-Bench-specific announcements, leaderboard updates, new task releases
- Deeper research and thought pieces live on [theharness.blog](https://www.theharness.blog) (link from nav/footer)

Initial posts to write:
1. "Introducing AEC-Bench" — what it is, why it matters
2. "How We Score Engineering Tasks" — evaluation methodology
3. "First Results: Comparing Models Across Disciplines" — leaderboard launch

---

## 8. Repository Structure

```
aecbench-site/
├── app/
│   ├── (home)/
│   │   └── page.tsx              # Landing page
│   ├── docs/
│   │   └── [[...slug]]/
│   │       └── page.tsx          # Fumadocs docs pages
│   ├── leaderboard/
│   │   └── page.tsx              # Leaderboard page
│   ├── blog/
│   │   ├── page.tsx              # Blog list
│   │   └── [slug]/
│   │       └── page.tsx          # Blog post
│   ├── layout.tsx                # Root layout (nav, footer)
│   └── globals.css
├── content/
│   ├── docs/                     # MDX documentation files
│   │   ├── meta.json
│   │   ├── index.mdx
│   │   ├── start/
│   │   │   ├── meta.json
│   │   │   ├── introduction.mdx
│   │   │   ├── quickstart.mdx
│   │   │   └── installation.mdx
│   │   ├── core/
│   │   ├── agents/
│   │   ├── evaluation/
│   │   ├── advanced/
│   │   └── reference/
│   └── blog/                     # MDX blog posts
│       ├── introducing-aec-bench.mdx
│       └── ...
├── components/
│   ├── landing/                  # Landing page components
│   │   ├── hero.tsx
│   │   ├── features.tsx
│   │   ├── disciplines.tsx
│   │   └── cta.tsx
│   ├── leaderboard/
│   │   ├── table.tsx
│   │   ├── charts.tsx
│   │   └── filters.tsx
│   └── shared/
│       ├── nav.tsx
│       └── footer.tsx
├── lib/
│   ├── supabase.ts               # Supabase client
│   └── source.ts                 # Fumadocs content source config
├── public/
│   ├── favicon.ico
│   ├── og-image.png
│   ├── logo-light.png
│   └── logo-dark.png
├── tailwind.config.ts
├── next.config.mjs
├── package.json
├── tsconfig.json
└── .env.local                    # SUPABASE_URL, SUPABASE_ANON_KEY
```

---

## 9. Deployment

| Concern | Approach |
|---------|----------|
| Hosting | Vercel (connect `aecbench-site` repo) |
| Domain | aecbench.com (configure in Vercel dashboard) |
| Preview deploys | Automatic on PRs via Vercel |
| Environment vars | SUPABASE_URL, SUPABASE_ANON_KEY in Vercel project settings |
| Build | `next build` (static docs + SSR leaderboard) |
| CI | Vercel auto-deploy on push to main |

---

## 10. Implementation Order

### Phase 1: Foundation (ship first)
1. Scaffold Fumadocs app with `npm create fumadocs-app`
2. Configure Tailwind theme (dark landing page colours)
3. Build landing page (hero, features, disciplines, CTA)
4. Write initial docs content (Start section: intro, quickstart, install)
5. Deploy to Vercel, connect aecbench.com domain

### Phase 2: Documentation
6. Write Core docs (architecture, contracts, tasks, templates)
7. Write Agents docs (overview, harnesses, custom agents, providers)
8. Write Evaluation docs (scoring, traces, classification)
9. Write Advanced docs (evolution, datasets, harness, advisor)
10. Write Reference docs (CLI, config, env vars)

### Phase 3: Leaderboard
11. Set up Supabase project and schema
12. Build leaderboard table view
13. Build leaderboard chart view (radar, bar, scatter)
14. Build data export script in aec-bench library
15. Populate with initial benchmark results

### Phase 4: Blog & Polish
16. Set up blog with MDX content source
17. Write introductory blog posts
18. Add OG images, favicon, SEO metadata
19. Add RSS feed
20. Performance optimisation (Lighthouse audit)
