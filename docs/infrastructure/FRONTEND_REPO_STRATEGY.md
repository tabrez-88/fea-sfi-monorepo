# Admin Portal — Repository Strategy

**Author:** Engineering (with Claude analysis)
**Date:** 2026-04-08
**Status:** **Decision: Add as new app inside this monorepo (`apps/sfi-admin`)**
**Scope:** Where to host the FEA SFI **Admin Portal** (32-screen Phase 1 build) — separate question from where the public marketing site lives

---

## Correction note

An earlier draft of this document incorrectly assumed `apps/fea` was the Admin Portal. It is **not**. `apps/fea` is the **public-facing FEA marketing/corporate website** (homepage, blogs, careers, contact, FAQ, fea-core, how-it-works, projects, legal, sfi). The Phase 1 Admin Portal is a **separate frontend that has not yet been created**. This document analyzes where that new Admin Portal should live.

---

## TL;DR

> **Add the Admin Portal as a new app inside this monorepo at [apps/sfi-admin/](../../apps/) (next to `apps/sfi-api` and `apps/fea`).** Don't create a dedicated repo, and don't bury it inside the public marketing site. The infrastructure for a multi-app monorepo already exists, the admin portal is tightly coupled to the BE (every screen = endpoints), and adding a 4th workspace is a one-time ~5-minute scaffold.

**Revisit only if** the admin build is outsourced to a vendor who must be sandboxed away from BE source, or if a hard compliance boundary appears. None of these apply today.

---

## 1. The actual question (re-framed)

We have three workspaces today and we're about to add a fourth. The question is: **what shape does the fourth take?**

**Existing workspaces:**

| Workspace | What it is | Audience | Status |
|---|---|---|---|
| [apps/sfi-api](../../apps/sfi-api/) | NestJS 10 + Prisma 6 backend | Internal API consumers | In dev (MS-1, MS-2B delivered) |
| [apps/fea](../../apps/fea/) | **Public-facing marketing/corporate website** (Next.js 15) — landing, blogs, careers, contact, FAQ, legal, "how it works" | External public visitors, prospects | In dev |
| [packages/shared](../../packages/shared/), [packages/api-contract](../../packages/api-contract/), [packages/eslint-config](../../packages/eslint-config/), [packages/tsconfig](../../packages/tsconfig/) | Shared code & config | Internal | In dev |

**The new thing we need to add:**

| Workspace | What it will be | Audience | Status |
|---|---|---|---|
| **Admin Portal** | 32-screen internal admin (auth, deals, participants, rules, revenue, settlement, ledger, documents, reports, proof) | Internal staff (FEA team), Liang & his team | **Does not exist yet** |

So this is genuinely a "where should it live?" decision — not an "extract or stay" decision.

---

## 2. Three real options

### Option A — New app inside this monorepo
**Path:** [apps/sfi-admin/](../../apps/) (proposed name; mirrors `apps/sfi-api`)
**Package name:** `@sfi-fea/sfi-admin`
**Port:** 3002 (api=3001, public site=3000)

```
fea-sfi-monorepo/
├── apps/
│   ├── sfi-api/        ← exists (NestJS backend)
│   ├── fea/            ← exists (public marketing site)
│   └── sfi-admin/      ← NEW (Phase 1 Admin Portal)  ←─── this option
└── packages/
    ├── shared/         ← consumed by all 3 apps
    ├── api-contract/   ← consumed by sfi-admin (and eventually fea, if it shows API data)
    ├── eslint-config/
    └── tsconfig/
```

### Option B — Dedicated repo
**New repo:** `fea-sfi-admin` (or similar) on the same GitHub org
**Cross-cutting deps:** must publish `@sfi-fea/shared` to GitHub Packages / private npm, or use git submodule, or auto-generate types from OpenAPI

### Option C — Nested inside the existing public site
**Path:** route group inside `apps/fea/src/app/admin/*`
**One Next.js install** serving both audiences

**Option C is dismissed up front** — see [§5](#5-why-option-c-nested-in-apps-fea-is-a-bad-idea) for the full reasoning. It mixes two completely different audiences, breaks bundle splitting, complicates auth middleware, and makes SEO indexing fragile. Don't do this.

The real choice is **A vs B**.

---

## 3. Decision matrix — A (monorepo new app) vs B (dedicated repo)

| Dimension | A: monorepo as `apps/sfi-admin` | B: dedicated repo |
|---|---|---|
| **Coupling to BE schema** (every admin screen = 1-3 endpoints) | ✅ Direct `import { DealResponseDto } from '@sfi-fea/shared'`. BE rename → admin typecheck breaks in same `pnpm typecheck`. | ❌ Type drift risk. Requires publishing `@sfi-fea/shared` or OpenAPI generation pipeline before any FE work can start safely. |
| **Coupling to public marketing site** | 🔵 Zero — different folder, different audience. Adding admin doesn't touch `apps/fea/`. | 🔵 Zero either way. Not a differentiator. |
| **Atomic BE+admin shipping** (e.g., "add `status` filter to Deals List") | ✅ One PR touches `deals.controller.ts` + `deals-list.tsx`. Reviewer sees both sides. CI verifies the integration in one run. | ❌ Two PRs across two repos. Risk of admin merging before BE. Manual coordination tax. |
| **Refactor confidence** (e.g., rename `effectiveDate` → `effectiveFrom`) | ✅ Compiler finds every consumer in one pass | ❌ Compiler only sees one repo. Drift discovered at runtime or in QA. |
| **Setup cost (one-time)** | ✅ ~5 minutes — `pnpm create next-app apps/sfi-admin`, copy turbo task config, register in pnpm-workspace, add `@sfi-fea/shared` dep | ❌ ~5-7 working days — new repo, new CI, new deploy pipeline, new env management, new package registry for `@sfi-fea/shared`, new branch protection rules |
| **CI complexity** | ✅ Existing `.github/workflows/ci.yml` already handles N apps via `turbo run …` | ⚠️ Two workflows to maintain in parallel |
| **CI runtime per PR** | ⚠️ Cold cache = ~2-4 min. Solvable with Turbo Remote Cache + path filters. | ✅ Naturally smaller per repo |
| **Local dev startup** | ✅ One clone, `pnpm install`, `turbo dev` runs all 3 apps with concurrent log prefixes | ❌ Two clones, two installs, two `.env` setups, must keep admin → BE base URL pointing right |
| **Permission/access boundary** | ⚠️ Anyone with repo access sees BE + public site + admin source | ✅ Fine-grained — vendor / contractor can be given admin repo access only |
| **Deploy independence** | ⚠️ Same repo means same default trigger. Solvable with path-filtered deploy workflows. | ✅ Independent by default |
| **Onboarding** (new contributor) | ✅ "Clone this, `pnpm install`, `pnpm dev:admin`" | ❌ "Clone these two, set up the registry, link `@sfi-fea/shared`, then…" |
| **Cognitive load (solo dev)** | ✅ One issue tracker, one PR queue, one branch context | ❌ Mental tax of "which repo did I leave that work in?" |
| **Compatibility with existing tooling** (Turbo, pnpm, Husky, ESLint, Prettier, commitlint) | ✅ Inherited for free | ❌ Must rebuild or duplicate all of it |
| **Future mobile app or 2nd admin** | ✅ Add a 5th `apps/*` workspace, same pattern | ⚠️ Each new FE is another repo to bootstrap |

**Score for our context** (solo dev, Liang as single client, 32-screen Phase 1, AI-assisted build):

- **A wins on:** type sharing, refactor safety, atomic shipping, setup cost, local dev, onboarding, cognitive load, tooling reuse
- **B wins on:** per-PR CI runtime (marginal), permission isolation (only matters if outsourcing), default deploy independence (solvable in A with path filters)

**Every B win is either marginal or solvable. Every A win is a daily, structural advantage.**

---

## 4. Why this is *not* the same calculation as the public marketing site

It's worth being explicit: the case for keeping `apps/fea` (public marketing) in the monorepo is **weaker** than the case for adding the Admin Portal there. The marketing site:

- Doesn't import `@sfi-fea/shared` types (it's mostly static content + CMS data)
- Doesn't break when the BE renames a DTO
- Has a totally different audience and deploy cadence
- Could plausibly live in its own repo without much pain

Yet it's already here. So the marginal cost of adding a **third** app — the one that actually benefits hugely from co-location with the BE — is essentially zero.

In other words: **the strongest argument for putting the Admin Portal in the monorepo is exactly the argument that does NOT apply to the public site.** Marketing being here is a convenience; admin being here is a structural correctness win.

If anything, the *opposite* split could make sense someday: extract `apps/fea` (the public marketing site) to its own repo because it has zero structural reason to live with the API, and keep `sfi-api` + `sfi-admin` together because they share schema. But that's a future optimization, not a Phase 1 concern.

---

## 5. Why Option C (nested in `apps/fea`) is a bad idea

For completeness — embedding admin routes inside the public marketing site (e.g., `/admin/*` under `apps/fea/src/app/admin/`) would be wrong because:

1. **Audience mismatch.** The public site is anonymous, SEO-indexed, marketing-styled. The admin portal is auth-gated, no-index, data-dense. They have nothing in common visually or structurally.
2. **Bundle bloat for public visitors.** Even with route splitting, shared layouts/providers leak across. Public visitors would download admin scaffolding they never use.
3. **Auth middleware complexity.** Two completely different auth models in one Next.js middleware tree is asking for routing bugs and accidental leaks.
4. **SEO risk.** A misconfigured `robots.txt` or missing `noindex` and admin pages get crawled. Don't put them on the same domain or app.
5. **Deploy coupling.** A marketing copy fix would trigger an admin redeploy. A broken admin build would block a marketing fix.
6. **Design system collision.** The marketing site uses brand visuals (Jumbotron, Testimonials, etc.). The admin uses shadcn data tables. Different theme, different tokens, different intent.

**Verdict:** Option C is dismissed. The Admin Portal must be a separate Next.js app — the only question is which **repo** it lives in. Per [§3](#3-decision-matrix--a-monorepo-new-app-vs-b-dedicated-repo), that repo should be this one.

---

## 6. Recommendation

**Add the Admin Portal as `apps/sfi-admin` inside this monorepo.**

### Proposed naming and layout

```
apps/sfi-admin/
├── package.json              name: "@sfi-fea/sfi-admin", port 3002
├── next.config.ts
├── tsconfig.json             extends @sfi-fea/tsconfig
├── tailwind.config.ts        admin design tokens (separate from apps/fea)
├── components.json           shadcn config
└── src/
    ├── app/                  Next.js App Router
    │   ├── (auth)/           login, register, forgot-password
    │   ├── (app)/            authenticated shell
    │   │   ├── dashboard/
    │   │   ├── deals/
    │   │   ├── deals/[id]/
    │   │   ├── deals/[id]/edit/
    │   │   ├── deals/[id]/participants/
    │   │   ├── deals/[id]/rules/
    │   │   ├── deals/[id]/revenue/
    │   │   ├── deals/[id]/settlement/
    │   │   ├── deals/[id]/documents/
    │   │   ├── deals/[id]/reports/
    │   │   └── deals/[id]/proof/
    │   └── layout.tsx
    ├── components/
    │   ├── layouts/          AppLayout (sidebar), AuthLayout (centered card)
    │   ├── ui/               shadcn primitives
    │   └── domain/           DealCard, ParticipantTable, etc.
    ├── lib/
    │   ├── api/              typed client (uses @sfi-fea/api-contract once it's wired)
    │   ├── auth/             session management
    │   └── hooks/
    └── styles/
```

### Naming rationale

- `apps/sfi-admin` mirrors `apps/sfi-api` — both belong to the **SFI** product within the FEA ecosystem
- `apps/fea` keeps its current meaning — the public **FEA** corporate site
- Package name `@sfi-fea/sfi-admin` is consistent with existing `@sfi-fea/api`, `@sfi-fea/fea`, `@sfi-fea/shared`

### Root package.json scripts to add

```json
"dev:admin": "turbo run dev --filter=@sfi-fea/sfi-admin",
"build:admin": "turbo run build --filter=@sfi-fea/sfi-admin"
```

(Mirrors the existing `dev:api`, `dev:fea`, `build:api`, `build:fea` pattern in [package.json:14-17](../../package.json#L14-L17).)

---

## 7. Action items (in order)

These are the concrete steps to actually execute Option A. None are blocking Sprint 1 BE verification work — they happen in parallel before Sprint 1 FE execution begins.

### Phase 0 — Scaffold (half a day)

- [ ] **Create `apps/sfi-admin/`** with `pnpm create next-app` (Next.js 15, TypeScript, App Router, Tailwind, ESLint)
- [ ] **Set package name** to `@sfi-fea/sfi-admin`, set port to 3002 in dev script
- [ ] **Add workspace dependencies:** `@sfi-fea/shared`, `@sfi-fea/eslint-config`, `@sfi-fea/tsconfig` as `workspace:*`
- [ ] **Install shadcn** with `npx shadcn@latest init` (match Tailwind 4 / React 19 / Radix versions used in `apps/fea` for consistency)
- [ ] **Add root scripts** `dev:admin` and `build:admin` to [package.json](../../package.json)
- [ ] **Verify** `pnpm install && pnpm dev:admin` works

### Phase 1 — Wire up the type-safety pipeline (1 day)

- [ ] **Implement OpenAPI client generation in [packages/api-contract](../../packages/api-contract/)** — currently a TODO stub. Hook NestJS Swagger output → `openapi-typescript` → emit a typed client. This is the single highest-value infrastructure investment for the admin build, because every screen will lean on it.
- [ ] **Document the generation flow** in [packages/api-contract/README.md](../../packages/api-contract/) so the next contributor knows how to regen after a BE schema change.

### Phase 2 — CI & deploy hygiene (half a day)

- [ ] **Add `apps/sfi-admin` to the existing CI workflow** ([.github/workflows/ci.yml](../../.github/workflows/ci.yml)) — with Turbo it should be automatic via `pnpm lint` / `pnpm typecheck` / `pnpm build`
- [ ] **Add path filters** so admin CI only runs when `apps/sfi-admin/**`, `packages/shared/**`, or `packages/api-contract/**` change
- [ ] **Enable Turborepo Remote Cache** (`turbo login && turbo link` against Vercel free tier, or self-host)
- [ ] **Add a deploy workflow** `deploy-sfi-admin.yml` triggered only by admin path changes — don't bundle into the existing API or marketing deploy

### Phase 3 — Foundation for admin auth (1-2 days, can run in parallel with Sprint 1 BE auth work)

- [ ] **Decide on session strategy** with the BE (JWT-only, JWT+refresh, NextAuth, Clerk, Supabase Auth) — see Sprint 1 BE verification report gap #1
- [ ] **Stub auth provider** in admin so screens can be built behind a fake-authenticated shell while the BE auth subsystem is being built
- [ ] **Wire env vars:** `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1`

After Phases 0-3 land, the admin app is ready to consume Sprint 1 screens as soon as the BE gaps in [sprint-1-be-verification.md](../execution/sprints/sprint-1-be-verification.md) are closed.

---

## 8. When to revisit this decision

Reopen this analysis if **any** of the following becomes true:

1. **The admin build is outsourced to a vendor or contractor** who must not see the BE source. In that case, dedicated repo + GitHub Packages publishing of `@sfi-fea/shared` may be cleaner than a guest collaborator on the monorepo.
2. **A hard compliance boundary appears** (SOC 2, HIPAA, PCI scope) that requires the admin source tree to be physically separated from the BE source tree.
3. **The admin team grows past ~5 dedicated FE engineers** working on the admin alone, with a deploy cadence that meaningfully diverges from the BE.
4. **Repo source size exceeds ~2 GB** of code (not `node_modules`). Currently <30 MB.
5. **CI runtime exceeds 15 minutes per PR** consistently *after* enabling Turbo Remote Cache and path-filtered jobs.
6. **A second admin portal** appears (e.g., a Liang-branded white-label) and the two admins start needing different release schedules.

None of these are true today. None are forecast for Phase 1 or Phase 2.

---

## 9. Risks of Option A and how we mitigate them

Honest list — not pretending the monorepo path is risk-free:

| Risk | Likelihood | Mitigation |
|---|---|---|
| Public site PR queue clutters admin work and vice versa | Medium | Path-filtered CI + path-filtered CODEOWNERS so reviewers only get pinged on their app |
| A broken `packages/shared` change cascades into admin and breaks Sprint 1 work | Medium | `pnpm typecheck` runs in CI on every PR — broken shared package gets caught immediately |
| Vendor / contractor needs admin access but not BE access | Low (no current plan to outsource) | Defer until it happens; revisit per §8 trigger #1 |
| Admin deploy accidentally triggered by a marketing copy fix | Medium | Path-filtered deploy workflows (action item in §7 Phase 2) |
| Monorepo CI gets slow as the admin grows | Low-Medium | Turbo Remote Cache + path filters; additionally, tests are per-app so they parallelize |
| Conflicting Tailwind / Next.js / React versions between `apps/fea` and `apps/sfi-admin` | Low | Both should target the same major versions; pin in root and rely on pnpm dedupe |

None of these are severe enough to override the decision.

---

## 10. Final recommendation

| Question | Answer |
|---|---|
| Where should the FEA SFI Admin Portal live? | **As a new app `apps/sfi-admin` inside this monorepo, alongside `apps/sfi-api` and `apps/fea`** |
| Should it go in a dedicated repo? | **No — only if §8 triggers** |
| Should it nest inside `apps/fea`? | **No — completely different audience, see §5** |
| What's the single most important infra investment to unblock the admin build? | **Wire up `@sfi-fea/api-contract` OpenAPI client generation** — every admin screen will depend on it |
| When can we start scaffolding? | **Now** — Phases 0-3 in §7 are independent of Sprint 1 BE verification work |

---

## Appendix — What changes if we ever do go polyrepo

For honesty, here is what a "do it right" extraction from the monorepo to a dedicated `fea-sfi-admin` repo would entail, in case we ever do trigger one of the §8 conditions later:

1. **Stand up a private package registry** (GitHub Packages is cheapest). Configure auth tokens for both repos.
2. **Convert `@sfi-fea/shared` to a published package.** Add `tsup` build, version with `changesets`, publish on tag.
3. **Convert `@sfi-fea/api-contract` similarly.**
4. **Move `apps/sfi-admin/` to the new repo** with `git filter-repo` to preserve history.
5. **Recreate CI from scratch:** lint, typecheck, test, build, deploy.
6. **Recreate environment plumbing:** API base URL, auth bridge, CORS allowlist on the BE side.
7. **Update CODEOWNERS, branch protection, deploy secrets** in the new repo.
8. **Update internal docs** that reference the old paths.

Estimated effort: **~5-7 working days**, plus an ongoing coordination tax on every BE schema change for the lifetime of the project.

That's a perfectly reasonable cost when you actually need the separation. We don't.

---

**Decision recorded:** Add `apps/sfi-admin` to this monorepo. Wire up `@sfi-fea/api-contract` OpenAPI generation as a precondition. Revisit only if §8 triggers.
