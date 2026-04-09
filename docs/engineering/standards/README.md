# Engineering Standards

This folder is the **canonical rulebook** for how code is structured in the FEA SFI monorepo. It exists so that every new file, every new feature, and every new contributor follows the same shape — without needing to guess or re-invent patterns on each PR.

**Scope:** these standards are actively enforced for code written **from 2026-04-08 onwards**. Existing code is not retroactively refactored unless touched during feature work.

---

## Which standards apply to which app?

Not every app is held to the same bar. This is intentional:

| App / Package | Standards level | Rationale |
|---|---|---|
| [apps/sfi-api](../../../apps/sfi-api/) (NestJS backend) | **Strict** — follow [BACKEND_STANDARDS.md](./BACKEND_STANDARDS.md) | The backend already has a clean structure; standards document what's there and keep new modules consistent. |
| **`apps/sfi-admin`** (Admin Portal, not yet scaffolded — see [FRONTEND_REPO_STRATEGY.md](../../infrastructure/FRONTEND_REPO_STRATEGY.md)) | **Strict** — follow [FRONTEND_ADMIN_STANDARDS.md](./FRONTEND_ADMIN_STANDARDS.md) | 32-screen admin portal, tightly coupled to BE, needs a clean foundation because it will grow fast. |
| [apps/fea](../../../apps/fea/) (Public marketing site) | **Relaxed** — no strict enforcement | Marketing site is already built with a different mental model (content-heavy, less API-bound). Don't retrofit; follow its existing conventions when editing. |
| [packages/shared](../../../packages/shared/), [packages/api-contract](../../../packages/api-contract/) | **Strict** — follow [BACKEND_STANDARDS.md](./BACKEND_STANDARDS.md) §2 (naming, exports) | Shared packages must be predictable because both backends and frontends depend on them. |
| [packages/eslint-config](../../../packages/eslint-config/), [packages/tsconfig](../../../packages/tsconfig/) | **N/A** — they ARE the standards config | These packages define tooling, not feature code. |

**Key principle:** the two apps where standards matter most are **`sfi-api`** (already in place) and **`sfi-admin`** (the new one we're about to build). Everything else is either tooling or legacy.

---

## Documents in this folder

| Document | Purpose |
|---|---|
| [BACKEND_STANDARDS.md](./BACKEND_STANDARDS.md) | NestJS module layout, controllers, services, DTOs, mappers, error handling, audit logging, file naming — canonical for `apps/sfi-api` |
| [FRONTEND_ADMIN_STANDARDS.md](./FRONTEND_ADMIN_STANDARDS.md) | Next.js folder structure, strict TypeScript config, Axios client, React Query hooks, shadcn components, constants, types, env validation — canonical for `apps/sfi-admin` |
| [TESTING_STANDARDS.md](./TESTING_STANDARDS.md) | Test naming, placement, mocking patterns, coverage expectations, and CI integration for both BE and FE |

---

## How to use these documents

1. **Before starting a new module or screen**, read the relevant standards doc end-to-end. It's faster than discovering conventions via PR review.
2. **Copy templates verbatim** — each standards doc contains full code templates you can paste into a new file and fill in. Don't reinvent the wheel.
3. **When a rule blocks you**, raise it as a discussion before breaking it. The standards are opinionated but not immutable — if a rule stops making sense, we update the doc, not the code.
4. **During code review**, reference the exact section (e.g., "per FRONTEND_ADMIN_STANDARDS.md §4, mutation hooks must invalidate the query cache on success"). That keeps reviews impersonal and consistent.

---

## What these standards intentionally do NOT cover

- **Business logic.** The standards cover *how* to write code, not *what* to write. Feature decisions live in the design specs and Sprint tickets in Notion.
- **Code style below the file level.** Indentation, quotes, semicolons, line length — all handled by Prettier + ESLint. Don't argue about what the formatter can decide.
- **Third-party library preferences** outside the ones named here. If you need a new library, propose it in a PR; we'll update the standards doc if it becomes load-bearing.
- **Git workflow.** Branch naming, commit messages, PR templates — separate concern, separate docs.

---

## Status legend used in the standards docs

| Symbol | Meaning |
|---|---|
| ✅ **Do** | Recommended pattern — use this |
| ❌ **Don't** | Anti-pattern — avoid this |
| ⚠️ **Careful** | Acceptable but has a footgun — read the note |
| 📎 **Template** | Copy-pasteable code block |
| 🔗 **Example** | Pointer to a real file in the codebase |

---

## Revision policy

These documents are **living** — when a pattern evolves, the standards doc is updated in the same PR as the code change. The changelog for each doc lives in its git history; use `git log docs/engineering/standards/` to see how they have evolved.

**Do not** maintain a duplicate `CHANGELOG` section inside the docs themselves — it rots.
