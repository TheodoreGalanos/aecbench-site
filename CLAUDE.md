# AEC-Bench Site

Benchmark and community site for [aec-bench](https://github.com/aurecon/aec-bench) — measuring AI capability on real Architecture, Engineering & Construction tasks. Positioned as the definitive AEC AI benchmark (SWE-bench authority + ARC Prize community warmth).

## What This Repo Is

This is the **public-facing website** at aecbench.com, built with Next.js 15 and Fumadocs. It contains:

- **Landing page** (`/`) — Results-first dark-themed page: hero, leaderboard preview, disciplines, methodology
- **Leaderboard** (`/leaderboard`) — Central feature. Dynamic model comparison table + charts backed by Supabase
- **Documentation** (`/docs`) — Fumadocs-powered MDX docs for researchers running benchmarks
- **Blog** (`/blog`) — MDX-based posts for announcements and benchmark updates

The **library source code** lives in a separate repo (`aec-bench`). This repo is purely the website.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Docs engine:** Fumadocs (MDX content, sidebar nav, search, dark/light mode)
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Fonts:** Inter (body/headings), JetBrains Mono (code)
- **Leaderboard DB:** Supabase (Postgres)
- **Charts:** Nivo
- **Package manager:** pnpm
- **Node:** 22+
- **Hosting:** Vercel

## Design Language

### Landing Page
- Dark charcoal background (#0a0a0a to #1a1a1a)
- Warm amber/gold accent (#e8a838)
- Teal secondary accent (#38b2ac)
- Modern dark tech vibe — ARC Prize-inspired but warmer

### Docs
- Fumadocs default theme with custom accent colours
- Default to dark mode
- JetBrains Mono for code blocks

## Repository Structure

```
app/              # Next.js pages (landing, docs, leaderboard, blog)
content/
  docs/           # MDX documentation files
  blog/           # MDX blog posts
components/       # React components (landing, leaderboard, shared)
lib/              # Supabase client, Fumadocs source config
public/           # Static assets (logo, favicon, OG images)
```

## Documentation Terminology

- Use **"agent harnesses"** (not "adapters") when referring to execution strategies (tool loop, RLM, lambda-RLM, direct)
- Write for **external researchers and developers** — assume no Aurecon-internal context
- Favour Australian English spelling (colour, behaviour, organisation)

## Content in `content/docs/`

Each section has a `meta.json` for sidebar ordering. MDX files use Fumadocs frontmatter:

```mdx
---
title: Page Title
description: One-line description for search and SEO
---
```

## Development

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Deployment

Vercel auto-deploys on push to main. Environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are set in the Vercel project settings.

## Related

- **Library repo:** `aec-bench` (Python package source, tasks, templates, agents)
- **Spec:** See `spec.md` for the full design specification
- **Open questions:** See `OPEN_QUESTIONS.md` for decisions still pending
