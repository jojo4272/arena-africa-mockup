# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Arena Africa** — an Africa-first, API-first peer-to-peer prediction market. Next.js 16 (App Router, Turbopack) + React 19 + TypeScript, PostgreSQL via Drizzle ORM. Ships a marketing site, an interactive web dashboard, an installable mobile PWA, a simulated USSD feature-phone gateway, and a documented REST API — all driven by the same schema and the same demo wallet data. Mobile money, card payments, and SMS are deliberately simulated (no real funds ever move); this is a functional demonstration, not a production fintech deployment (see `docs/NIST_CSF_GAP_ANALYSIS.md` for what real-money launch would still require).

## Commands

```bash
npm run dev         # start dev server (Turbopack) at localhost:3000
npm run build        # production build
npm run start        # run the production build (required for the video pipeline — see below)
npm run lint          # eslint .
npm run typecheck    # tsc --noEmit
```

There is no test suite and no `test` script — nothing to run for tests currently.

**Database** — no `db:push`/`db:migrate` script exists; run drizzle-kit directly:

```bash
npx drizzle-kit push --config=drizzle.config.json   # sync schema to the DB
```

`drizzle.config.json` holds the DB connection string used by drizzle-kit; `DATABASE_URL` (env var, read in `src/db/index.ts`) is what the running app itself uses — keep both pointed at the same database. After schema changes, also re-apply `src/db/indexes.sql` (indexes + CHECK constraints aren't expressible in the current Drizzle syntax used here, so they live in raw SQL, applied manually via `psql`). Seeding is automatic: `ensureSeeded()` (`src/db/seed.ts`) runs on first data fetch and is idempotent (`onConflictDoNothing`/version-gated), so no separate seed command is needed — just point `DATABASE_URL` at an empty database and load any page.

**Required env vars**: `DATABASE_URL` (hard-required, `src/db/index.ts` throws without it — no default). `AUTH_SECRET` is optional but falls back to an insecure hardcoded dev string if unset (`src/lib/auth.ts`) — always set it outside local dev. `GEMINI_API_KEY` and `GEMINI_MODEL` are optional; every AI feature in `src/lib/gemini.ts` degrades to a deterministic heuristic when the key is absent, so the app is fully functional without it. There is no `.env.example` — these three are the complete list.

**Video pipeline** (`docs/video/`) — a standalone, ported tool (from a sister project) that generates narrated walkthrough videos: Kokoro TTS → Playwright-recorded screen capture paced by the narration → ffmpeg mux. It is not part of the app build; see `docs/video/README.md`. It **requires the app running via `npm run build && npm start`**, not `npm run dev` — Turbopack's on-demand route compilation shows a visible "Compiling…" badge on camera otherwise.

## Architecture

### Two parallel auth paths — know which one a piece of code is using

- **Server Actions** (`src/app/actions.ts`) are authenticated via `authedUser(expectedUserId?)`, which reads the `arena_token` httpOnly cookie only. Every mutating action calls this first and compares the resolved user against the `userId` the client claims to be acting as — this is the IDOR guard. Session cookies are set by `POST /api/auth/login`.
- **API routes** (`src/app/api/**/route.ts`) authenticate via `requireUser()` in `src/lib/guard.ts`, which accepts *either* an `Authorization: Bearer <token>` header *or* the same `arena_token` cookie — this is what lets the REST API and the browser share one auth scheme.
- Both paths verify the same HMAC-SHA256 token format from `src/lib/auth.ts` (`generatePhoneToken`/`verifyPhoneToken` — hand-rolled, not a JWT library; timing-safe comparison). PIN hashing (`hashPin`/`verifyPin`, scrypt-based) exists in the same file but isn't wired into any auth flow yet — phone-number + demo-profile selection is the only sign-in method actually in use.

### Policy engine sits between auth and business logic

`src/lib/rbac.ts` defines roles (`GUEST` → `ADMIN`/`SERVICE`) and capabilities as an explicit grant list (no inheritance chains). `src/lib/policy.ts` runs a declarative rule chain (`evaluatePolicy(ctx)`) — RBAC capability, account status, jurisdiction restriction, KYC per-transaction and daily-velocity limits, sufficient-funds, market-open-only, segregation-of-duties, responsible-play stake cap, USSD channel ceiling — and returns `ALLOW`/`DENY`/`REVIEW` with machine-readable codes (`DENY` beats `REVIEW` beats `ALLOW`, fail-closed). `GET/POST /api/policy/evaluate` exposes this for introspection/dry-runs. Note the split: `POST /api/predictions`, `POST /api/auth/register`, and the `/api/ai/*` routes call `evaluatePolicy()` before acting; the dashboard's Server Actions in `src/app/actions.ts` (`placePrediction`, `createChama`, etc.) do **not** — they re-implement their own inline checks (balance, market status) instead. Don't assume policy rules are enforced on a given mutation without checking which path it goes through.

### One dataset, four surfaces

The marketing site (`src/app/page.tsx` + `src/components/MarketingSite.tsx`), the dashboard (`src/app/dashboard/page.tsx` + `src/app/PredictionDashboard.tsx`, a single ~2000-line client component), the mobile PWA (`src/app/mobile/*`, its own phone-frame shell with bottom-nav screens), and the USSD simulator (menu-tree logic embedded in `processUSSDInput()` in `actions.ts`, surfaced both in the dashboard sidebar and via `POST /api/ussd`) all read/write the same Postgres tables through the same `actions.ts` functions or their API-route equivalents — there is no separate "mobile API" or "USSD backend." When changing business logic, check both the Server Action and the corresponding API route (e.g. `placePrediction()` in `actions.ts` vs `POST /api/predictions`) since they're independent implementations of the same operation, not one calling the other.

### Theming

Light-default, `dark:`-variant Tailwind classes throughout, toggled by adding/removing a `.dark` class on `<html>` (see `ThemeToggle.tsx`, persisted to `localStorage`, applied pre-paint via an inline script in `layout.tsx` to avoid a flash). `globals.css` declares `@custom-variant dark (&:where(.dark, .dark *));` to make Tailwind v4's `dark:` variant class-driven instead of `prefers-color-scheme`-driven. A few decorative "device mockup" panels (the marketing page's wallet-visual card, the API code-preview terminal, the USSD phone simulator, the entire `/mobile` phone frame) are deliberately kept permanently dark regardless of site theme, styled like a screenshot rather than themed UI — don't "fix" these to follow the toggle.

### Localization

Four locales (`en`/`sw`/`fr`/`pt`) via a static dictionary in `src/lib/i18n.ts` (`getTranslations(locale)`), used by the dashboard and mobile screens. The marketing site has its own separate `COPY` translation object inside `MarketingSite.tsx` — the two localization systems are not shared or unified.

### Multi-currency

12+ African/global currencies are modeled directly on `users.currency`/`markets` volume, with hardcoded exchange-rate tables duplicated in a few places (`PredictionDashboard.tsx`'s `rates`/`currencySymbols`, `src/lib/policy.ts`'s `USD_RATE` for KYC-limit conversion, `src/lib/localization.ts`). These are independent hardcoded tables, not a single source of truth — update all relevant ones together if a rate changes.

### Route boundary

`src/proxy.ts` (Next.js 16's replacement for `middleware.ts`) applies rate limiting (60 req/min GET, 20/min POST per IP+endpoint, exempting `/api/health`) and security headers (CSP, HSTS, etc. via `src/lib/security.ts`) to all `/api/*` routes. Page routes are not covered by this proxy.
