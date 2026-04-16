# `@sfi-fea/sfi-admin` — FEA-SFI Admin Portal

Internal operator UI for the FEA SFI platform. Covers the full deal → rules → revenue → settlement lifecycle and the cross-cutting dashboard / auth screens.

- **Stack:** Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui (new-york) · Axios · TanStack Query · react-hook-form + Zod · sonner
- **Standards:** [`docs/engineering/standards/FRONTEND_ADMIN_STANDARDS.md`](../../docs/engineering/standards/FRONTEND_ADMIN_STANDARDS.md) — strict, read before you write anything
- **Port:** `3002` (keeps 3000 for `apps/fea` marketing, 3001 for `apps/sfi-api`)

---

## Scope — currently implemented

Sprint 1 initial slice. Everything else is scaffolded pending feature work.

| Screen                 | Route              | Status                                                                           |
| ---------------------- | ------------------ | -------------------------------------------------------------------------------- |
| FEA-1 Login            | `/login`           | ✅ wired to `POST /auth/login`                                                   |
| FEA-2 Register         | `/register`        | ✅ wired to `POST /auth/register`                                                |
| FEA-3 Forgot Password  | `/forgot-password` | ✅ wired to `POST /auth/forgot-password` + two-state UI                          |
| FEA-4 Global Dashboard | `/dashboard`       | ✅ wired to `/dashboard/summary`, `/dashboard/pending-reviews`, `/deals?limit=5` |

Not yet built: FEA-5 Deals List, FEA-6 Create Deal, FEA-7 Deal Overview, FEA-8 Edit Deal.

---

## Quick start

```bash
# From the monorepo root:
pnpm install

# Copy the env template (edit as needed)
cp apps/sfi-admin/.env.local.example apps/sfi-admin/.env.local

# Run the admin portal + the API in parallel
pnpm dev --filter @sfi-fea/sfi-admin --filter @sfi-fea/api
# or just the portal (assumes the API is already running):
pnpm --filter @sfi-fea/sfi-admin dev
```

Open http://localhost:3002.

### Env vars

| Variable              | Default                 | Purpose                                  |
| --------------------- | ----------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Base URL for the `sfi-api` backend       |
| `NEXT_PUBLIC_APP_ENV` | `development`           | `development` / `staging` / `production` |

Validated at startup via [`src/lib/env.ts`](src/lib/env.ts). Missing vars throw before the first render.

---

## Folder structure

Per [FRONTEND_ADMIN_STANDARDS.md §1](../../docs/engineering/standards/FRONTEND_ADMIN_STANDARDS.md#1-folder-structure):

```
apps/sfi-admin/
├── src/
│   ├── app/                        # Next.js App Router — pages only
│   │   ├── layout.tsx              # root <html>/<body>, wraps Providers
│   │   ├── providers.tsx           # QueryClientProvider + Toaster
│   │   ├── page.tsx                # redirects /  →  /dashboard
│   │   ├── (auth)/                 # split-layout auth pages
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   └── (dashboard)/            # sidebar + navbar app shell
│   │       └── dashboard/page.tsx
│   ├── components/
│   │   ├── ui/                     # shadcn primitives (do not hand-edit)
│   │   ├── layout/                 # AuthSplitLayout, DashboardShell, Sidebar, Navbar, UserMenu, Logo, PageHeader
│   │   ├── auth/                   # LoginForm, RegisterForm, ForgotPasswordForm, PasswordField, FormError
│   │   ├── dashboard/              # DashboardStats, PendingReviewsCard, RecentDealsTable, StatCard, StatusChip
│   │   └── deals/                  # DealStatusBadge
│   ├── hooks/                      # React Query hooks
│   │   ├── auth/                   # useLogin, useRegister, useForgotPassword, useCurrentUser, useLogout
│   │   ├── dashboard/              # useDashboardSummary, usePendingReviews
│   │   └── deals/                  # useRecentDeals
│   ├── services/                   # Pure async fns — auth.service, deals.service, dashboard.service
│   ├── types/                      # api, auth, deal, dashboard
│   ├── constants/                  # routes, api, query-keys, ui
│   ├── lib/                        # env, axios, query-client, auth-storage, format, utils
│   └── app/globals.css             # Tailwind v4 + shadcn tokens + status-chip tokens
├── components.json                 # shadcn config (new-york, slate, cssVariables)
├── next.config.ts, postcss.config.mjs, .eslintrc.js, tsconfig.json
└── package.json
```

Golden rule: **pages are thin**. They import feature components and call hooks. All data fetching lives in `hooks/` → `services/` → `lib/axios`.

---

## Auth flow

1. **Login / Register** call the `sfi-api` `/auth/*` endpoints via [`authService`](src/services/auth.service.ts).
2. On success, [`authStorage`](src/lib/auth-storage.ts) persists `accessToken` + `refreshToken` in `localStorage` and React Query's `auth/me` cache is warmed with the returned user.
3. The [Axios request interceptor](src/lib/axios.ts) attaches `Authorization: Bearer <accessToken>` to every call.
4. On **401**, the response interceptor clears storage and redirects to `/login?next=<previous-path>` so the user lands back after signing in.
5. [`useCurrentUser()`](src/hooks/auth/useCurrentUser.ts) hydrates the navbar avatar + name via `GET /auth/me` — runs only when an access token is present.
6. Logout calls `POST /auth/logout` (server-side revoke) and then clears local state + React Query cache.

> **Upgrade path:** move the refresh token to an `httpOnly` cookie when the API exposes a `/auth/set-cookie` endpoint. The interceptor is the only place that needs to change.

---

## Styling + design tokens

- Tailwind v4 via `@tailwindcss/postcss` — no `tailwind.config.js`; all tokens live in [`src/app/globals.css`](src/app/globals.css) under `:root` and `@theme inline`.
- shadcn style: **new-york**, base color **slate**, CSS variables enabled.
- Status chip colors use dedicated tokens (`--status-success`, `--status-warning`, `--status-info`, `--status-danger`, `--status-neutral`) mapped to Badge variants in [`components/ui/badge.tsx`](src/components/ui/badge.tsx). Map entity status → chip tone in [`constants/ui.ts`](src/constants/ui.ts).
- Icons: `lucide-react` throughout.

### Adding more shadcn components

```bash
pnpm --filter @sfi-fea/sfi-admin dlx shadcn@latest add dialog sheet tabs
```

The `components.json` in this app is already wired for the correct aliases (`@/components/ui`, `@/lib/utils`).

---

## Conventions cheat sheet

| Concern                    | Where it lives                                                                             | Never do                                |
| -------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------- |
| Route strings              | [`constants/routes.ts`](src/constants/routes.ts) — `ROUTES.DEALS.DETAIL(id)`               | Hardcode `"/deals/abc"`                 |
| API URLs                   | [`constants/api.ts`](src/constants/api.ts) — `API_ENDPOINTS.DEALS.DETAIL(id)`              | Concat `env.NEXT_PUBLIC_API_URL + path` |
| Query keys                 | [`constants/query-keys.ts`](src/constants/query-keys.ts) — `QUERY_KEYS.DEALS.LIST(params)` | Inline `['deals', id]` in a hook        |
| Status badge tone          | [`constants/ui.ts`](src/constants/ui.ts) — `DEAL_STATUS_TONE[status]`                      | Hardcode `"success"` in a component     |
| HTTP call                  | `services/*.service.ts` via `apiClient`                                                    | Call `axios` in a component             |
| `useQuery` / `useMutation` | `hooks/<feature>/`                                                                         | Use React Query in a page or component  |

---

## Scripts

```bash
pnpm --filter @sfi-fea/sfi-admin dev        # http://localhost:3002
pnpm --filter @sfi-fea/sfi-admin build
pnpm --filter @sfi-fea/sfi-admin start
pnpm --filter @sfi-fea/sfi-admin lint
pnpm --filter @sfi-fea/sfi-admin typecheck
```

---

## Next steps

- Wire up FEA-5 Deals List (uses [`dealsService.list()`](src/services/deals.service.ts) + [`dealsService.counts()`](src/services/deals.service.ts) — both already typed).
- Wire up FEA-6 Create Deal (add `useCreateDeal` mutation hook + drawer/page decision pending designer confirmation — current Figma shows a full page, daily plan assumed drawer).
- Wire up FEA-7 Deal Overview + FEA-8 Edit Deal — backend endpoints ready as of 2026-04-13.
- Add route-level auth guard — currently the Axios 401 interceptor handles the unhappy path, but a server-side middleware that gates `(dashboard)/*` routes on a cookie will feel snappier.
- Swap the stock Unsplash auth-panel image for the branded asset once delivered.
