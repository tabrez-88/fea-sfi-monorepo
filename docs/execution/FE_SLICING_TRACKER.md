# FE Slicing & Implementation Tracker

**Last updated:** 2026-04-15 (post Deals-slice + standards audit + Figma-parity pass)  
**Scope:** Sprint 1 (MS-1: Shell & Deals) + Sprint 2 (MS-2: Participants & Rules)  
**Purpose:** Per-screen audit of Figma Hi-Fi readiness, code slice status, BE integration, responsiveness, empty states, and pixel-perfect quality gaps. This is the ground truth for what still needs work before QA handoff.

---

## FRONTEND_ADMIN_STANDARDS.md compliance — Sprint 1 Deals code

Auditor: cross-grepped the new code against every rule in [docs/engineering/standards/FRONTEND_ADMIN_STANDARDS.md](../engineering/standards/FRONTEND_ADMIN_STANDARDS.md).

| Rule (§ in standards)                                               | Result | Notes                                                                                                                                      |
| ------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| §1 Folder structure — pages thin, hooks own RQ, services pure async | ✅     | Pages are server components delegating to `*Container` client comps                                                                        |
| §1 No `useQuery`/`useMutation` outside `hooks/`                     | ✅     | Grep: 0 hits in `components/` + `app/`                                                                                                     |
| §2 No `as any`, no `@ts-ignore`, no `@ts-nocheck`                   | ✅     | Grep: 0 hits across `src/`                                                                                                                 |
| §4 No hardcoded route strings in components                         | ✅     | All navigation via `ROUTES.DEALS.*` / `ROUTES.DASHBOARD`                                                                                   |
| §4 No inline query keys                                             | ✅     | All via `QUERY_KEYS.DEALS.*`                                                                                                               |
| §4 No hardcoded API paths in services                               | ✅     | `deals.service.ts` uses `API_ENDPOINTS.DEALS.*` exclusively                                                                                |
| §5 `const` object + derived type for enum-likes                     | ✅     | `DealStatus`, `Currency` pattern reused for new types                                                                                      |
| §6 Only `apiClient`, never raw `axios.*` in consumers               | ✅     | Deal containers now import `getApiErrorMessage` from `@/lib/axios` (new helper) — no `axios` import in new code                            |
| §7 Query hooks use `QUERY_KEYS` + `enabled: Boolean(id)`            | ✅     | `useDeal` gates on id                                                                                                                      |
| §8 Mutation hooks always invalidate on success                      | ✅     | Create/Update/Delete each invalidate `DEALS.ALL` + `DEALS.COUNTS`; Update also invalidates `DEALS.DETAIL(id)`; Delete removes detail cache |
| §9 Named exports from `components/`, default from `app/` pages      | ✅     | Grep confirms 0 default exports in new components                                                                                          |
| §9 No `style={{}}` inline, no CSS modules                           | ✅     | All Tailwind utility classes                                                                                                               |
| §9 No `React.FC`                                                    | ✅     | Plain function components + explicit props types                                                                                           |
| §10 Services return typed input/output, no error catching           | ✅     | Errors bubble to React Query → `onError` / `try/catch` in containers                                                                       |
| §11 Utils pure, no React                                            | ✅     | No new util files added; existing `formatCurrency`/`formatDate` reused                                                                     |
| §12 Naming conventions                                              | ✅     | `useDeal*.ts` hooks, `deals.service.ts`, `deal.types.ts`, `*.types.ts` files, `PascalCase.tsx` components                                  |
| §13 No `console.log` in components                                  | ✅     | Grep: 0 hits                                                                                                                               |

### Polish pass — sidebar transition + mobile drawer composition + wording (2026-04-15, late evening v2)

Standards re-audit (`as any` / `@ts-ignore` / `console.log` / `React.FC` / hardcoded routes / direct axios calls / default exports from components / `useQuery`/`useMutation` outside hooks/) — **0 violations across `apps/sfi-admin/src`**.

Polish work:

- **Smoother sidebar collapse** — replaced the conditional aside swap with a single aside that animates `width` + `padding` (`transition-[width,padding] duration-200 ease-out`). Width morphs 312px ↔ 72px while the inner content swaps between full labels and icon-rail.
- **Mobile drawer in deal context** matches Figma "Mobile Sidebar [Active]" — drawer is now **two columns**: icon rail (72px) on the left + deal-scoped nav (text labels) on the right, with the close button in the deal column header. Reuses the new `SidebarIconRail` export so a route change in the rail still gets the user out of deal context.
- **Mobile: brand text hidden** — Navbar renders icon-only Logo at `<sm`, full "FEA-SFI Admin" wordmark at `≥sm` per the Figma mobile frames. The Logo component already had `iconOnly`; just had to use it responsively.
- **Wording sweep on Create / Edit Deal:**
  - Date pickers — replaced "Placeholder" with "Pick a start date" / "Pick an end date" (effective / termination respectively).
  - Deal Name placeholder — `'e.g. "The Last Horizon — Distribution Deal"'` (was "Input your deal name…", awkward English).
  - Description placeholder — "Add a short summary of the deal, parties, and scope." (was "Whats your deal description…", missing apostrophe).
  - Restored "Deal Details" section title above the nested sub-card (the empty `<h2>` from a prior edit was both invalid HTML and missing per Figma).
- **Cleanup** — removed the unused `useDeleteDeal` hook + `dealsService.remove` method (Figma has no delete flow on the Edit page; per CLAUDE.md "if you are certain that something is unused, you can delete it completely"). All other deal hooks/services remain in active use.

### Figma-parity pass v3 — Overview layout + nested sidebar (2026-04-15, late evening)

Client flagged that the Deal Overview wasn't matching Figma in three structural ways. Fixed:

**1. Nested sidebar layout** — the main Sidebar was disappearing when entering a deal. Per Figma the main sidebar should collapse to an icon-only rail and the DealSidebar should appear _alongside_ it, not replace it.

- New [`Sidebar`](../../apps/sfi-admin/src/components/layout/Sidebar.tsx) `variant` prop: `'full'` (default, 312px, collapsible) vs `'iconRail'` (72px, icons only, non-collapsible).
- [`DashboardShell`](../../apps/sfi-admin/src/components/layout/DashboardShell.tsx) now renders **both** when inside `/deals/:id/*`: `<Sidebar variant="iconRail" />` + `<DealSidebar />`. Navbar toggle becomes a no-op on desktop in deal context (Figma shows non-collapsible deal chrome).
- [`DealSidebar`](../../apps/sfi-admin/src/components/layout/DealSidebar.tsx) simplified: text-only labels (no icons), no internal back-link or deal name block (the back link lives above the page title instead), always visible on desktop, `240px` column, active item black-filled.

**2. Deal Overview card structure** — name + status + banner + stat cards now live inside a single outer card (Figma `385:10602`), Latest Settlement + Quick Actions + Recent Activity are separate cards below.

- [`DealOverviewView`](../../apps/sfi-admin/src/components/deals/DealOverviewView.tsx) restructured to wrap `DealHeader` + suspended banner + `DealStatCards` in one white card.
- Suspended banner moved _inside_ the card, between the name block and stat cards, with the yellow dashed border + warning styling from Figma `385:10677`. Renders `deal.notes` when set, falls back to "Client is currently unresponsive." per the Figma copy.

**3. Empty-state parity** — matches Figma "Deal Detail [Empty]" exactly.

- New [`NoSettlementsWorkflow`](../../apps/sfi-admin/src/components/deals/NoSettlementsWorkflow.tsx) component: dashed-border container with "No settlements yet. Start by adding participants and creating rules." + numbered 4-step workflow (1 Add Participants → 2 Create Rules → 3 Submit Revenue → 4 Run Settlement). Horizontal with connecting lines at ≥sm, vertical stacked list on mobile. Each step routes to the matching deal-scoped page.
- Latest Settlement panel now switches between the real data card and this empty-state workflow based on whether a settlement run exists.
- [`RecentActivityCard`](../../apps/sfi-admin/src/components/deals/RecentActivityCard.tsx) empty state rewritten to Figma copy: "All caught up! **No items need** your attention."

### Figma-parity pass v2 — Deal Overview + Edit Deal (2026-04-15, evening)

After matching the Deal List to Figma, I pulled the Figma ground truth for Deal Overview (`385:10602`) and Deal Edit (`385:10504`) and delivered a second pixel-parity pass.

**Edit Deal — restructured:**

- Replaced the old "Danger zone → Delete Deal" section entirely. Figma has no delete flow on this screen.
- Added two destructive header buttons top-right of the title:
  - **Closed Deal** — solid red (`bg-danger text-white`), disabled when status is already `CLOSED`
  - **Suspend Deal** — solid black, disabled when status is already `SUSPENDED`
- Mobile: the two buttons stack as a 2-column row directly under the "Edit Deal" title (matches Figma `385:10407`)
- Confirmation modals (shadcn `dialog`):
  - Close Deal Confirmation — plain confirm, fires `PATCH /deals/:id` with `status=CLOSED`
  - Suspend Deal Confirmation — includes a **Notes** textarea (maps to `UpdateDealDto.notes`), fires `PATCH` with `status=SUSPENDED` + notes
- Removed Currency field from the edit form — Figma Deal Details sub-card shows only Status / Effective Date / Termination Date
- [`DealStatusChangeDialog.tsx`](../../apps/sfi-admin/src/components/deals/DealStatusChangeDialog.tsx) is the single component for both flows (`variant: 'close' | 'suspend'`)
- Old [`EditDealContainer.tsx`](../../apps/sfi-admin/src/components/deals/) deleted; replaced by [`EditDealView.tsx`](../../apps/sfi-admin/src/components/deals/EditDealView.tsx) which owns the page-level layout (back link + title + action buttons + form + both modals)

**Deal Overview — restructured:**

- Page-level header row: back link + "Deal Overview" title + [Edit Deal] button (full-width on mobile)
- [`DealHeader.tsx`](../../apps/sfi-admin/src/components/deals/DealHeader.tsx) simplified to Figma's deal-name block — bold name, `Film deal · Created {date}` subtitle, right-aligned status pill. Removed the CTA + meta-grid from the old version (those moved to the page header and the stat cards respectively).
- [`DealStatCards.tsx`](../../apps/sfi-admin/src/components/deals/DealStatCards.tsx) redesigned: "Participants" is the **featured** card (solid black fill, white text), the other three are white with border. Each card has an up-right arrow that translates on hover and routes to the deal-scoped sub-page.
- New [`LatestSettlementCard.tsx`](../../apps/sfi-admin/src/components/deals/LatestSettlementCard.tsx) — key/value list (Total Revenue / Total Allocated / Rule Snapshot / Revenue Batches / Proof) with copy-to-clipboard on the proof hash and a "View Details" link. Renders nothing when there's no latest settlement (page substitutes a dashed placeholder panel).
- [`QuickActionsCard.tsx`](../../apps/sfi-admin/src/components/deals/QuickActionsCard.tsx) rebuilt to Figma's 2×2 grid of solid-black buttons (New Revenue Batch / New Settlement Run / New Participant / New Rule Snapshot). Stacks to 1-per-row on mobile.
- New [`RecentActivityCard.tsx`](../../apps/sfi-admin/src/components/deals/RecentActivityCard.tsx) — date | message two-column list with dividers; empty-state copy while the activity feed stays Sprint-2 work.
- Suspended deals render a yellow warning banner above the deal card surfacing the saved `notes` (matches Figma `385:10677` "Client is currently unresponsive." treatment).
- Old `DealOverviewContainer.tsx` deleted; replaced by [`DealOverviewView.tsx`](../../apps/sfi-admin/src/components/deals/DealOverviewView.tsx).

**Deals List — prior Figma pass refinements:**

- Title + filter bar now share a single flex row at ≥lg (title left, search + Status Select + icon-only calendar filter + [Create New Deal] right), stacks on mobile
- Removed the `+` icon from the Create New Deal button (Figma doesn't show one on the list header — the empty-state CTA still has it)
- Calendar filter is icon-only via the new `iconOnly` prop on `DatePickerField`
- Stat cards bumped to Figma dimensions (`min-h-128`, `p-6`, `text-[48px]` numbers)

### Figma-parity pass v1 (2026-04-15, afternoon)

Client flagged that the Deals screens weren't pixel-matching the Hi-Fi and that filter inputs should use real shadcn primitives instead of native controls. Rebuild delivered:

- **shadcn primitives installed**: `select` (Radix), `popover`, `calendar` (react-day-picker). `SelectTrigger` customized to Figma tokens (h-48, rounded-8, border-border, 16/20 text) to match the existing Input — same treatment as `button.tsx` and `input.tsx`, which already deviate from pure shadcn defaults for Figma parity.
- **Removed**: my hand-rolled `ui/tabs.tsx` + `components/deals/DealsFilterTabs.tsx` — the Figma uses clickable stat cards for status filtering, not a tabs strip.
- **New reusable composites:**
  - [`common/DatePickerField.tsx`](../../apps/sfi-admin/src/components/common/DatePickerField.tsx) — Calendar + Popover trigger styled like the Figma "📅 Placeholder" date input (calendar icon left, chevron right, 48px/40px variants)
  - [`common/Pagination.tsx`](../../apps/sfi-admin/src/components/common/Pagination.tsx) — numbered `‹ 1 2 3 … 10 ›` pattern with ellipsis collapsing, matches Figma Deal List footer
  - [`common/BackLink.tsx`](../../apps/sfi-admin/src/components/common/BackLink.tsx) — "← Deals List" back link used on Create / Edit / Overview pages
  - [`deals/DealsFilterBar.tsx`](../../apps/sfi-admin/src/components/deals/DealsFilterBar.tsx) — search + Status Select + Effective-date DatePicker + [+ Create New Deal] CTA, stacks vertically on mobile
  - [`deals/DealsListStatCards.tsx`](../../apps/sfi-admin/src/components/deals/DealsListStatCards.tsx) — 4 clickable stat cards (All / Active / Draft / Closed) that double as status-filter shortcuts
  - [`deals/DealFormField.tsx`](../../apps/sfi-admin/src/components/deals/DealFormField.tsx) — shared labelled field wrapper (label / input slot / error / help)
- **DealsTable redesign** — 6 columns (Deal Name / Status / Currency / Participants / Created At / Updated At) per Figma. Mobile progressively hides columns (Currency at <sm, Participants at <md, Created/Updated at <lg), so the mobile frame ends up showing just Deal Name + Status as designed.
- **DealForm redesign** — outer card with Deal Name + Description (with "0/2000 Characters" counter below in Figma style), then a **nested** "Deal Details" sub-card containing Status / Effective Date / Termination Date in a 3-column responsive row. Right-aligned [Cancel] [Create Deal] footer.
- **Breadcrumbs removed from Deals pages** — Figma uses eyebrow + title on the list screen, and "← Deals List" back link on Create / Edit / Overview. `components/common/Breadcrumbs.tsx` is still in the repo for use elsewhere but no Deals page references it.

### Adjustments made during earlier audit (2026-04-15 morning)

1. **Added `getApiErrorMessage(error, fallback)` helper in [lib/axios.ts](../../apps/sfi-admin/src/lib/axios.ts)** — extracts user-facing error messages from `AxiosError` (handles both string and `string[]` messages per NestJS validation pipe). Lets containers stay clean of `from 'axios'` imports while still surfacing backend validation messages. `CreateDealContainer` and `EditDealContainer` now use this helper exclusively.
2. **Restored Figma-matched textarea.tsx** — the shadcn CLI generator produces `border-input`/`rounded-md`/`text-base` which don't match this repo's design tokens. The existing `Input` component is also hand-crafted with Figma-matched classes (`h-[48px]`, `rounded-[8px]`, `border-border`, `text-[16px]`), so the `ui/` convention here is **shadcn-structured, Figma-styled primitives** — both `Textarea` and `Select` follow that pattern. This is a documented deviation from the literal "shadcn-generated only" rule because the alternative is abandoning Figma parity.

### Known standards caveats (carried forward, not blocking)

- `components/common/` folder (holds `EmptyState`, `Breadcrumbs`) is **not** in the standards folder list — it sits alongside `ui/` + `layout/` + `<feature>/` as a cross-cutting category. Options if we want strict conformance: (a) treat `Breadcrumbs` as layout chrome and move it, (b) formally extend the standards doc to legitimise `common/`. Leaning (b) — every real codebase ends up needing this category.
- `ui/select.tsx` and `ui/tabs.tsx` are hand-crafted (not shadcn-CLI-generated) for the same Figma-parity reason as `textarea` and `input`. When we install the radix shadcn versions later, the consumer API will change (compound components for Select, TabsList/TabsTrigger for Tabs) — plan for a small refactor then.
- Auth forms (`LoginForm`, `RegisterForm`, `ForgotPasswordForm`) still `import { AxiosError } from 'axios'` — pre-existing pattern, out of this sprint's scope. They should migrate to `getApiErrorMessage` next time they're touched.

---

## Legend

| Symbol | Meaning                                       |
| ------ | --------------------------------------------- |
| ✅     | Done — no known gaps                          |
| 🔶     | Exists but has open issues (listed below row) |
| ❌     | Not done                                      |
| 🎨     | Figma Hi-Fi frame visible in design file      |
| ❓     | No Hi-Fi frame confirmed yet                  |

---

## Sprint 1 — MS-1: Shell & Deals

**Notion sprint:** [Sprint 1](https://app.notion.com/p/32f76aa2eb4b813290a2d9166ad1354b) · Due: Apr 13, 2026 · Status: Completed  
**Screens:** 8 — Login, Register, Forgot Password, Global Dashboard, Deals List, Create Deal, Deal Overview, Edit Deal

---

### FEA-1 · Login Page · `/login`

| Dimension            | Status | Notes                                                                                                                                                              |
| -------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Figma Hi-Fi          | 🎨     | Desktop + mobile frames visible in "Auth Page" section                                                                                                             |
| Page sliced          | ✅     | `app/(auth)/login/page.tsx` + `LoginForm.tsx`                                                                                                                      |
| BE integrated        | ✅     | `POST /auth/login` via `useLogin` hook                                                                                                                             |
| Toast (success)      | ✅     | Fixed 2026-04-14 — `toast.success('Signed in successfully!')`                                                                                                      |
| Toast (error)        | ✅     | Fixed 2026-04-14 — `toast.error(...)` mirrors inline `FormError`                                                                                                   |
| Mobile layout        | 🔶     | Auth split-layout: photo panel hidden ✅, form padding fixed ✅, footer text scales 14→16px ✅. Still missing: mobile min-height on very short viewports (< 600px) |
| Empty / error states | ✅     | Inline `FieldError` + `FormError` component, 401 → "Invalid email or password"                                                                                     |
| Standards compliance | ✅     | Hook → service → apiClient, no inline axios, ROUTES constants                                                                                                      |

**Open items:**

- [ ] Verify pixel-perfect against Figma "Auth Page" mobile frame (logo size, subtitle placement, button height)
- [ ] Password min 8 chars validation missing on login form (only on register — spec says show/hide toggle only, so this may be intentional — confirm with design)

---

### FEA-2 · Register Page · `/register`

| Dimension            | Status | Notes                                                                                                                                                                                       |
| -------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Figma Hi-Fi          | 🎨     | Desktop + mobile frames visible                                                                                                                                                             |
| Page sliced          | ✅     | `app/(auth)/register/page.tsx` + `RegisterForm.tsx`                                                                                                                                         |
| BE integrated        | ✅     | `POST /auth/register` via `useRegister` hook                                                                                                                                                |
| Toast (success)      | 🔶     | Fixed 2026-04-14 — fires "Account created! Welcome aboard." BUT **spec says redirect to `/login` with toast "Account created. Please sign in."** — code currently redirects to `/dashboard` |
| Toast (error)        | ✅     | Fixed 2026-04-14                                                                                                                                                                            |
| Mobile layout        | ✅     | Fixed 2026-04-14                                                                                                                                                                            |
| Empty / error states | ✅     | Inline errors per field, 409 → "An account with this email already exists."                                                                                                                 |
| Standards compliance | ✅     |                                                                                                                                                                                             |

**Open items:**

- [ ] **SPEC DEVIATION:** Notion ticket FEA-2 requires redirect to `/login` after success, not `/dashboard`. Current code goes to dashboard. Confirm intended behaviour with design/product then align.
- [ ] Pixel-perfect pass against Figma mobile frame

---

### FEA-3 · Forgot Password · `/forgot-password`

| Dimension            | Status | Notes                                                                                                                                  |
| -------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Figma Hi-Fi          | 🎨     | Frame visible in "Auth Page" section (right-side image variant)                                                                        |
| Page sliced          | ✅     | `app/(auth)/forgot-password/page.tsx` + `ForgotPasswordForm.tsx`                                                                       |
| BE integrated        | ❓     | Need to verify — `POST /auth/forgot-password` endpoint required. `useForgotPassword` hook exists. Confirm endpoint is live on staging. |
| Toast (success)      | ❓     | Not audited — check `ForgotPasswordForm.tsx` for `toast.success()` call                                                                |
| Toast (error)        | ❓     | Not audited                                                                                                                            |
| Mobile layout        | 🔶     | `AuthSplitLayout` used with `imageSide="right"` ✅. Same general mobile improvements applied. Pixel-perfect not verified.              |
| Empty / error states | ❓     | Not audited — check success state ("Check your email" screen)                                                                          |
| Standards compliance | ✅     |                                                                                                                                        |

**Open items:**

- [ ] Audit `ForgotPasswordForm.tsx` for toast wiring (same pattern as LoginForm fix)
- [ ] Confirm BE endpoint `/auth/forgot-password` is live on staging
- [ ] Verify "check your email" success state exists in UI (should show message, not just clear form)
- [ ] Pixel-perfect pass against Figma mobile frame

---

### FEA-4 · Global Dashboard · `/dashboard`

| Dimension             | Status | Notes                                                                                                                                                                                                                                                                                                                            |
| --------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Figma Hi-Fi           | 🎨     | Desktop + mobile frames visible in "Dashboard Page" section                                                                                                                                                                                                                                                                      |
| Page sliced           | ✅     | `app/(dashboard)/dashboard/page.tsx` + 5 component files                                                                                                                                                                                                                                                                         |
| BE integrated         | ✅     | `GET /dashboard/summary`, `GET /dashboard/pending-reviews`, `GET /deals` (recent deals) all wired                                                                                                                                                                                                                                |
| Toast                 | ✅     | N/A — read-only page                                                                                                                                                                                                                                                                                                             |
| Mobile layout         | 🔶     | Fixed 2026-04-14: stat cards now 2×2 grid ✅, tables get `overflow-x-auto` ✅, page padding `p-4 sm:p-6` ✅, PageHeader scales ✅. **Still to verify:** Figma shows dashboard mobile has a specific stacked layout for the pending reviews rows — current implementation scrolls horizontally which may not match design intent. |
| Empty states          | 🔶     | Functional but not pixel-perfect. Current: plain `<p>` text. Figma may show styled empty state with illustration or icon. Needs side-by-side comparison.                                                                                                                                                                         |
| Sidebar toggle        | ✅     | Fixed 2026-04-14 — `DashboardShell` now owns `sidebarOpen` state, wires to `Navbar` and `Sidebar`                                                                                                                                                                                                                                |
| Mobile sidebar drawer | ✅     | Fixed 2026-04-14 — custom overlay drawer on mobile (<lg), desktop gets width-transition collapse                                                                                                                                                                                                                                 |
| Standards compliance  | ✅     |                                                                                                                                                                                                                                                                                                                                  |

**Open items:**

- [ ] Compare empty states against Figma — "All caught up!" and "No deals yet" text may need icon/illustration and different styling
- [ ] Verify mobile pending-reviews layout against Figma mobile frame — might need card-style stacking instead of horizontal scroll on mobile
- [ ] Stat card label typography check — "Total Deals" etc. at 20px Medium. Verify on mobile (currently unchanged)
- [ ] Dashboard page title scales 28px→40px. Verify Figma mobile uses same scale or different

---

### FEA-5 · Deals List · `/deals`

| Dimension            | Status | Notes                                                                                                |
| -------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| Figma Hi-Fi          | 🎨     | Frame visible in "Deal Page" section (left column, first row)                                        |
| Page sliced          | ✅     | `app/(dashboard)/deals/page.tsx` + `DealsTable` + `DealsFilterTabs`                                  |
| BE integrated        | ✅     | `useDeals` (paginated, filter-aware) + `useDealsCounts` for live tab counts                          |
| Toast                | ✅     | Retry toast on error surface; empty-state CTA to Create Deal                                         |
| Mobile layout        | ✅     | Tabs overflow-x-auto, table horizontal scroll on <sm, search + pagination stack vertically on mobile |
| Empty state          | ✅     | Shared `EmptyState` with FileText icon, "No deals yet" + [Create Deal] CTA                           |
| Standards compliance | ✅     | Hook → service → apiClient, QUERY_KEYS, ROUTES, DEAL_STATUS_TONE via shared Badge                    |

**Open items:**

- [ ] Pixel-perfect pass vs Figma — verify column widths, tab spacing, sort icon placement
- [ ] Shadcn `pagination` primitive — currently using simple Prev/Next buttons. Upgrade when install lands.

---

### FEA-6 · Create Deal · `/deals/create`

| Dimension            | Status | Notes                                                                                                                                    |
| -------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Figma Hi-Fi          | 🎨     | Frame visible in "Deal Page" section                                                                                                     |
| Page sliced          | ✅     | `app/(dashboard)/deals/create/page.tsx` + `CreateDealContainer` + shared `DealForm`                                                      |
| BE integrated        | ✅     | `POST /deals` via `useCreateDeal`, invalidates `DEALS.ALL` + `DEALS.COUNTS`                                                              |
| Toast                | ✅     | `toast.success('Deal created')` on success, `toast.error(message)` on server error (AxiosError message extraction)                       |
| Mobile layout        | ✅     | Responsive sections + grid collapse to single column, stacked footer buttons                                                             |
| Empty state          | ✅     | N/A — form page; validation inline per field                                                                                             |
| Validation           | ✅     | name ≤255 + required, effectiveDate required, terminationDate must be > effectiveDate, description ≤2000 w/ counter, metadata JSON parse |
| Standards compliance | ✅     | Mutation hook invalidates, no inline axios, ROUTES constants, DealStatus / Currency from types                                           |

**Open items:**

- [ ] Upgrade `<input type="date">` to a proper calendar/popover date picker (shadcn `calendar` + `popover` not yet installed)
- [ ] Upgrade native `<select>` to radix Select primitive
- [ ] Metadata JSON editor — consider code-editor/syntax hints (currently monospace textarea)

---

### FEA-7 · Deal Overview · `/deals/:id`

| Dimension                     | Status | Notes                                                                                                                                                                    |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Figma Hi-Fi                   | 🎨     | Frame visible in "Deal Page" section (multiple detail views)                                                                                                             |
| Page sliced                   | ✅     | `app/(dashboard)/deals/[id]/page.tsx` + `DealOverviewContainer` + `DealHeader` + `DealStatCards` + `QuickActionsCard`                                                    |
| BE integrated                 | ✅     | `useDeal(id)` fetches deal + aggregated counts + totalRevenue (all surfaced in stat cards)                                                                               |
| Toast                         | ✅     | N/A read-only; error state uses EmptyState with "Back to Deals" CTA                                                                                                      |
| Mobile layout                 | ✅     | 2-col stat grid on mobile → 4-col at lg; responsive paddings                                                                                                             |
| Empty state                   | ✅     | No-activity deals get `QuickActionsCard` (4-step guided workflow); deals-with-activity show "Recent Activity" placeholder                                                |
| **Deal Context Mode sidebar** | ✅     | Implemented as `DealSidebar` — back link to /deals + deal name + 8 deal-scoped nav items. `DashboardShell` swaps sidebars based on `pathname.match(/^\/deals\/([^/]+)/)` |
| Standards compliance          | ✅     |                                                                                                                                                                          |

**Open items:**

- [ ] Activity feed — current "Recent Activity" section is a placeholder; wire real audit log slice in Sprint 2
- [ ] `LatestSettlementCard` — spec calls for a dedicated card above Quick Actions when latest settlement exists. Currently stat card links to settlement section only. Add in Sprint 2 once settlement runs UI lands.
- [ ] Deal Context sidebar nav items (Participants, Rules, Revenue, Settlement, Documents, Reports, Proof) route to `/deals/:id/<section>` — these pages don't exist yet (Sprint 2+), links are live but will 404 until pages exist

---

### FEA-8 · Edit Deal · `/deals/:id/edit`

| Dimension            | Status | Notes                                                                                                      |
| -------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| Figma Hi-Fi          | 🎨     | Frame visible in "Deal Page" section (mobile + desktop)                                                    |
| Page sliced          | ✅     | `app/(dashboard)/deals/[id]/edit/page.tsx` + `EditDealContainer` + shared `DealForm`                       |
| BE integrated        | ✅     | `useDeal(id)` pre-fills, `useUpdateDeal` saves, `useDeleteDeal` deletes (with confirm)                     |
| Toast                | ✅     | `toast.success('Deal updated')` / `toast.success('Deal deleted')` + AxiosError message extraction on error |
| Mobile layout        | ✅     | Same shared `DealForm` responsive layout + stacked Delete confirmation row                                 |
| Empty / error state  | ✅     | Missing/forbidden deal → EmptyState with back CTA; load skeleton while fetching                            |
| Delete flow          | ✅     | Danger zone card with inline 2-step confirm; destructive button destroyed both detail and list cache       |
| Status options       | ✅     | Edit mode exposes all four (DRAFT/ACTIVE/SUSPENDED/CLOSED) vs Create's DRAFT/ACTIVE only                   |
| Standards compliance | ✅     |                                                                                                            |

**Open items:**

- [ ] Replace inline Danger-zone confirm with shadcn `AlertDialog` once installed
- [ ] `notes` field (shows only when status = SUSPENDED per backend DTO) — currently not exposed in DealForm; add conditional field in Sprint 2 polish

---

## Sprint 1 Summary

| #     | Screen           | Notion        | Figma | Sliced | BE  | Mobile          | Empty State          | Overall                                  |
| ----- | ---------------- | ------------- | ----- | ------ | --- | --------------- | -------------------- | ---------------------------------------- |
| FEA-1 | Login            | Ready for dev | 🎨    | ✅     | ✅  | 🔶 minor        | ✅                   | 🔶 minor polish                          |
| FEA-2 | Register         | Ready for dev | 🎨    | ✅     | ✅  | 🔶 minor        | ✅                   | 🔶 redirect spec deviation               |
| FEA-3 | Forgot Password  | Ready for dev | 🎨    | ✅     | ❓  | 🔶 minor        | ❓                   | 🔶 needs audit                           |
| FEA-4 | Global Dashboard | Ready for dev | 🎨    | ✅     | ✅  | 🔶 mostly fixed | 🔶 not pixel-perfect | 🔶 polish pass needed                    |
| FEA-5 | Deals List       | Ready for dev | 🎨    | ✅     | ✅  | ✅              | ✅                   | ✅ shippable                             |
| FEA-6 | Create Deal      | Ready for dev | 🎨    | ✅     | ✅  | ✅              | ✅                   | ✅ shippable (native date input)         |
| FEA-7 | Deal Overview    | Ready for dev | 🎨    | ✅     | ✅  | ✅              | ✅                   | ✅ shippable + Deal Context sidebar live |
| FEA-8 | Edit Deal        | Ready for dev | 🎨    | ✅     | ✅  | ✅              | ✅                   | ✅ shippable (inline delete confirm)     |

**Sprint 1 completion: 8/8 screens sliced (100%)**  
Auth + Dashboard have minor polish items. All 4 Deals screens and the Deal Context Mode sidebar delivered 2026-04-14.

---

## Sprint 2 — MS-2: Participants & Rules

**Notion sprint:** [Sprint 2](https://app.notion.com/p/32f76aa2eb4b81199ac4e44474be0e14) · Due: Apr 22, 2026 · Status: In Progress  
**FE Build window:** Apr 16–22 (5 working days)  
**Screens:** 6 — Participants List, Add Participant, Participant Detail, Rule Snapshots List, Rule Snapshot Detail, Create Rule Snapshot

---

### FEA-9 · Participants List · `/deals/:id/participants`

| Dimension     | Status | Notes                                                                                   |
| ------------- | ------ | --------------------------------------------------------------------------------------- |
| Figma Hi-Fi   | 🎨     | Frame visible in "Deal Page" section — lists participants for a deal                    |
| Page sliced   | ❌     | **NOT SLICED**                                                                          |
| BE integrated | ❌     | `GET /deals/:id/participants` endpoint exists and verified in Sprint 1 BE check         |
| Mobile layout | ❌     | N/A until sliced                                                                        |
| Empty state   | ❌     | Required — "No participants yet. Add your first participant." + [+ Add Participant] CTA |

**Required to build:**

- `app/(dashboard)/deals/[id]/participants/page.tsx`
- `components/participants/ParticipantsTable.tsx`
- `hooks/participants/useParticipants.ts`
- `services/participants.service.ts` — `list(dealId, params)` method
- **Prerequisite:** Deal Context Mode sidebar must be implemented first

---

### FEA-10 · Add Participant · `/deals/:id/participants/new`

| Dimension     | Status | Notes                                          |
| ------------- | ------ | ---------------------------------------------- |
| Figma Hi-Fi   | 🎨     | Frame visible (recently updated Apr 14)        |
| Page sliced   | ❌     | **NOT SLICED**                                 |
| BE integrated | ❌     | `POST /deals/:id/participants` exists          |
| Toast         | ❌     | Required: `toast.success('Participant added')` |

**Spec highlights (from Notion):**

- Fields: Participant Name (required), Role/Behavior (ParticipantBehavior enum — DISTRIBUTOR, INVESTOR, TALENT, etc.), email, notes
- **Note (FB-002):** ParticipantBehavior enum replaces old ParticipantRole — confirm BE schema matches

---

### FEA-11 · Participant Detail · `/deals/:id/participants/:participantId`

| Dimension     | Status | Notes                                               |
| ------------- | ------ | --------------------------------------------------- |
| Figma Hi-Fi   | 🎨     | Frame visible (updated Apr 10)                      |
| Page sliced   | ❌     | **NOT SLICED**                                      |
| BE integrated | ❌     | `GET /deals/:id/participants/:participantId` exists |
| Empty state   | ❌     | Required — no statement available yet state         |

---

### FEA-12 · Rule Snapshots List · `/deals/:id/rules`

| Dimension     | Status | Notes                                                       |
| ------------- | ------ | ----------------------------------------------------------- |
| Figma Hi-Fi   | 🎨     | Frame visible (updated Apr 10)                              |
| Page sliced   | ❌     | **NOT SLICED**                                              |
| BE integrated | ❌     | `GET /deals/:id/rule-snapshots` exists                      |
| Empty state   | ❌     | Required — "No rules yet. Create your first rule snapshot." |

---

### FEA-13 · Rule Snapshot Detail · `/deals/:id/rules/:snapshotId`

| Dimension     | Status | Notes                                      |
| ------------- | ------ | ------------------------------------------ |
| Figma Hi-Fi   | 🎨     | Frame visible (updated Apr 14)             |
| Page sliced   | ❌     | **NOT SLICED**                             |
| BE integrated | ❌     | `GET /deals/:id/rule-snapshots/:id` exists |
| Empty state   | ❌     | N/A — detail page always has data          |

---

### FEA-14 · Create Rule Snapshot · `/deals/:id/rules/new`

| Dimension     | Status | Notes                                              |
| ------------- | ------ | -------------------------------------------------- |
| Figma Hi-Fi   | 🎨     | Frame visible (updated Apr 14)                     |
| Page sliced   | ❌     | **NOT SLICED**                                     |
| BE integrated | ❌     | `POST /deals/:id/rule-snapshots` exists            |
| Toast         | ❌     | Required: `toast.success('Rule snapshot created')` |

**Spec highlights:**

- Multi-step form or single form with participant allocation table
- Each participant gets a percentage/fixed allocation
- Validation: allocations must sum to 100%

---

## Sprint 2 Summary

| #      | Screen               | Notion      | Figma | Sliced | BE  | Mobile | Empty State | Overall        |
| ------ | -------------------- | ----------- | ----- | ------ | --- | ------ | ----------- | -------------- |
| FEA-9  | Participants List    | In Progress | 🎨    | ❌     | ❌  | ❌     | ❌          | ❌ not started |
| FEA-10 | Add Participant      | In Progress | 🎨    | ❌     | ❌  | ❌     | ❌          | ❌ not started |
| FEA-11 | Participant Detail   | In Progress | 🎨    | ❌     | ❌  | ❌     | ❌          | ❌ not started |
| FEA-12 | Rule Snapshots List  | In Progress | 🎨    | ❌     | ❌  | ❌     | ❌          | ❌ not started |
| FEA-13 | Rule Snapshot Detail | In Progress | 🎨    | ❌     | ❌  | ❌     | ❌          | ❌ not started |
| FEA-14 | Create Rule Snapshot | In Progress | 🎨    | ❌     | ❌  | ❌     | ❌          | ❌ not started |

**Sprint 2 completion: 0/6 screens (0%)**  
FE build window opens Apr 16. All 6 screens not yet started.

---

## Cross-Cutting Gaps

### 1. Deal Context Mode Sidebar — ✅ DELIVERED (2026-04-14)

- `components/layout/DealSidebar.tsx` — back link + deal name + 8 deal-scoped nav items
- `DashboardShell` swaps `Sidebar` ↔ `DealSidebar` based on `/deals/:id` route match (`useMemo(extractDealId(pathname))`)
- Same responsive behaviour as global sidebar: desktop column collapse + mobile overlay drawer (conditionally mounted, not CSS-hidden — avoids the `lg:hidden` bug that broke mobile earlier today)

### 2. shadcn Components — mostly delivered

| Component                 | Status                                                                                                                                                                                              | Used where                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `textarea`                | ✅ installed then Figma-customised (border-border, rounded-8, 16/20 text)                                                                                                                           | DealForm description                                                       |
| `select`                  | ✅ **installed 2026-04-15** — Radix-based with customised trigger (h-48, rounded-8, border-border); full compound API (`Select` / `SelectTrigger` / `SelectContent` / `SelectItem` / `SelectValue`) | DealForm status + currency, DealsFilterBar status                          |
| `popover`                 | ✅ **installed 2026-04-15** — used inside `DatePickerField`                                                                                                                                         | DealForm, DealsFilterBar                                                   |
| `calendar`                | ✅ **installed 2026-04-15** — react-day-picker wrapped by shadcn; used inside `DatePickerField`                                                                                                     | DealForm effective/termination dates, DealsFilterBar effective-from filter |
| custom `Pagination`       | ✅ built from scratch — numbered `‹ 1 2 3 … 10 ›` pattern with ellipsis collapsing                                                                                                                  | DealsTable                                                                 |
| `tabs`                    | 🗑️ **removed** — Figma uses clickable stat cards, not tabs; old `ui/tabs.tsx` + `DealsFilterTabs.tsx` deleted                                                                                       |
| `dialog` / `alert-dialog` | ❌ missing — Edit Deal delete still uses inline 2-step confirm                                                                                                                                      |
| `sheet`                   | ❌ not needed — custom mobile drawer works                                                                                                                                                          |
| `form` (react-hook-form)  | ❌ not adopted — manual controlled state + validation sufficient so far                                                                                                                             |

Remaining install candidates: `pnpm dlx shadcn@latest add dialog alert-dialog` (Edit Deal danger-zone confirmation upgrade).

### 3. Empty State Component — ✅ DELIVERED

- `components/common/EmptyState.tsx` — icon + title + description + optional action (href or onClick)
- Label accepts `ReactNode` so icon+text buttons work
- Used in: Deals List empty, Deal Overview error, Edit Deal not-found

### 4. Breadcrumbs — ✅ DELIVERED

- `components/common/Breadcrumbs.tsx` — `<nav aria-label="Breadcrumb">` + `<ol>`, final item `aria-current="page"`
- Used on all 4 Deals screens

### 5. Deal hooks / service coverage — ✅ COMPLETE

Services: `list`, `counts`, `getById`, `create`, `update`, `remove` — all in `deals.service.ts`.  
Hooks:

- `useDeals(params)` — list
- `useDeal(id)` — single
- `useDealsCounts()` — tab counts
- `useCreateDeal()` — invalidates `DEALS.ALL` + `DEALS.COUNTS`
- `useUpdateDeal(id)` — invalidates `DEALS.DETAIL(id)` + `DEALS.ALL` + `DEALS.COUNTS`
- `useDeleteDeal()` — invalidates `DEALS.ALL` + `DEALS.COUNTS`, removes detail cache

### 6. Type Coverage Gaps (Sprint 2)

Still missing for Sprint 2 builds:

- `src/types/participant.types.ts`
- `src/types/rule.types.ts`

### 7. Service/Hook Gaps (Sprint 2)

- `services/participants.service.ts` + `hooks/participants/*`
- `services/rules.service.ts` + `hooks/rules/*`

---

## Priority Queue (next actions)

### Immediate — Sprint 1 polish

1. **FEA-2 register redirect** — confirm spec with design: `/login` vs `/dashboard`?
2. **FEA-3 forgot-password audit** — toast wiring + success state
3. **FEA-4 dashboard empty states** — pixel-perfect pass vs Figma
4. **Deals List pagination** — upgrade to shadcn `pagination` primitive when installed
5. **Create/Edit Deal date pickers** — upgrade from native to calendar/popover

### Before Sprint 2 FE build (Apr 16)

6. Install missing shadcn components (`calendar`, `popover`, `dialog`, `alert-dialog`, `pagination`)
7. Add `participant.types.ts` and `rule.types.ts`
8. Scaffold `participants.service.ts`, `rules.service.ts` + hooks
9. Build the 4 deal-scoped sub-pages now that the Deal Context sidebar is live (Participants, Rules, Revenue, Settlement placeholder shells so deep links don't 404)

### Sprint 2 (FEA-9 through FEA-14)

10. Participants List + Add Participant (FEA-9, FEA-10)
11. Participant Detail (FEA-11)
12. Rule Snapshots List + Create Rule Snapshot (FEA-12, FEA-14)
13. Rule Snapshot Detail (FEA-13)

---

## Figma Hi-Fi Coverage (what's visible in design file)

Node ID: `384:1709` — File: `Tk5nFtkvsbrDWo7dhIEHm0`

| Section label       | Frames confirmed                                                                                                             | Screens                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Dashboard Layout    | Desktop shell, mobile shell (collapsed sidebar)                                                                              | Layout chrome only         |
| Auth Page           | Login desktop + mobile, Register desktop + mobile, Forgot Password desktop + mobile                                          | FEA-1, FEA-2, FEA-3        |
| Dashboard Page      | Dashboard desktop + mobile (with data + empty state variants)                                                                | FEA-4                      |
| Deal Page           | Deals List desktop + mobile, Deal Detail/Overview desktop + mobile, Create Deal desktop + mobile, Edit Deal desktop + mobile | FEA-5, FEA-6, FEA-7, FEA-8 |
| (Sprint 2 sections) | Participants and Rules screens — frames visible but require individual screenshot to confirm mobile variants                 | FEA-9 through FEA-14       |

All Sprint 1 and Sprint 2 screens have confirmed Hi-Fi frames in the design file. No screen is blocked by missing Figma design.
