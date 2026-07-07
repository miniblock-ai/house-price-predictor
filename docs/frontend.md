# Frontend — Prediction Portal

> **Project root**: `frontend/` (at `house-price-predictor/frontend`)
> **Tech stack**: Next.js (App Router), TypeScript, Tailwind CSS, pnpm monorepo (Turbo)

## 📖 Table of Contents

- [1. Directory Structure](#sec1)
- [2. Test Paths](#sec2)
  - [2.1. Path Table](#sec2-1)
  - [2.2. Directory Tree](#sec2-2)
  - [2.3. Run Commands](#sec2-3)
- [3. Change Log](#sec3)

<a id="sec1"></a>
## 1. Directory Structure

```
frontend/
├── apps/
│   └── prediction-portal/        ← Main application (Next.js)
│       ├── app/                  ← App Router pages
│       ├── components/           ← React components
│       │   ├── app1/             ← App1 (price prediction)
│       │   └── app2/             ← App2 (market analysis)
│       ├── lib/                  ← Utilities, API clients
│       ├── __tests__/            ← UT + RTL tests
│       ├── e2e/                  ← Playwright E2E tests
│       └── playwright.config.ts
├── libs/
│   └── shared-ui/               ← Shared UI component library
├── package.json                  ← Root package.json (pnpm workspace)
├── pnpm-workspace.yaml
└── turbo.json
```

<a id="sec2"></a>
## 2. Test Paths

<a id="sec2-1"></a>
### 2.1. Path Table

| Layer | Type | What it tests | Directory pattern |
|:------|:-----|:--------------|:------------------|
| **UT** | Pure function | Utility functions, helpers, API client (no React rendering) | `apps/prediction-portal/**/*.test.ts` (no `.tsx`) |
| **RTL** | Component test | React component rendering + user interaction (uses `render`/`screen`) | `apps/prediction-portal/__tests__/**/*.test.tsx` |
| **E2E** | Playwright | Real browser, full-stack flows | `apps/prediction-portal/e2e/**/*.spec.ts` |

Also: `libs/shared-ui/src/__tests__/*.test.tsx` — RTL tests for shared UI components.

<a id="sec2-2"></a>
### 2.2. Directory Tree

```
frontend/
├── apps/
│   └── prediction-portal/
│       ├── __tests__/          ← RTL + UT  (subdirs: app1/, app2/)
│       ├── lib/app2/__tests__/ ← UT (pure functions)
│       ├── e2e/                ← Playwright (subdirs: app1/, app2/)
│       └── playwright.config.ts
└── libs/
    └── shared-ui/src/__tests__/ ← RTL (shared components)
```

<a id="sec2-3"></a>
### 2.3. Run Commands

> Run all commands from `frontend/` (project root of the pnpm monorepo).

```bash
# UT + RTL (Vitest)
pnpm --filter prediction-portal exec vitest run

# E2E (Playwright)
pnpm --filter prediction-portal exec playwright test

# Single test file
pnpm --filter prediction-portal exec vitest run __tests__/app2/WhatIfForm.test.tsx
```

<a id="sec3"></a>
## 3. Change Log

| Date | rev | Changes |
|------|:---:|---------|
| 2026-07-07 | rev1 | Initial — directory structure + test paths |
