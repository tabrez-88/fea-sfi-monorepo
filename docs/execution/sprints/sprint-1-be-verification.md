# Sprint 1 — MS-1: Shell & Deals — BE Verification

**Sprint Page:** https://www.notion.so/32f76aa2eb4b813290a2d9166ad1354b
**Milestone:** MS-1: Shell & Deals
**Sprint Duration:** March 11 – April 13, 2026
**Verification Date:** 2026-04-08
**Resolution Date:** 2026-04-09 (non-auth gaps) → 2026-04-13 (auth subsystem + audit metadata convention + runNumber + suspendedReason rename)
**Verifier:** tabrez-wellnite (with Claude)
**Overall Status:** 🟢 **FULLY RESOLVED — every gap closed.** All 8 Sprint 1 tickets are BE-ready. Non-auth gaps (#4–#14, #23–#36, #40) closed on 2026-04-09. Auth subsystem (#1–#3, #15–#22) implemented on 2026-04-13 — see [AUTH_IMPLEMENTATION.md](../../engineering/AUTH_IMPLEMENTATION.md). Final follow-ups (gap #35 cross-module audit metadata convention, persistent `SettlementRun.runNumber` column, `suspendedReason` → `notes` rename per designer confirmation on gap #39) also shipped on 2026-04-13.

---

## Executive Summary

Sprint 1 contains **8 tickets across 3 epics** (Auth, Dashboard, Deals). Backend coverage is uneven:

- **Auth epic (3 tickets):** 🔴 **Zero backend support.** No `auth` module, no `User` model in Prisma, no endpoints. Cannot ship Login / Register / Forgot Password without first building the entire auth subsystem.
- **Dashboard epic (1 ticket):** 🟡 **Partial.** Basic deal listing exists but no aggregated stat endpoints (active deals count, pending reviews, total settled). Frontend can compose stats client-side as a workaround for now.
- **Deals epic (4 tickets):** 🟡 **Partial.** Create / List / Detail are ✅. **Edit Deal is ❌ blocked** — `UpdateDealDto` exists but the controller has no `PATCH /deals/:id` route. Deals List filter/search query params are also missing.

**Bottom line:** out of 8 screens, **3 are fully BE-ready (Create Deal, Deals List read, Deal Overview read)**, **1 is BE-ready with gaps (Dashboard)**, **1 is partially BE-ready (Deals List filter/search missing)**, and **4 are blocked (Edit Deal + 3 Auth screens)**.

---

## Gate 1 — Notion Readiness

| Task ID | Task Name                        | Notion Status | Pass |
| ------- | -------------------------------- | ------------- | ---- |
| FEA-1   | Design & Build: Login Page       | Design Review | ⚠️   |
| FEA-2   | Design & Build: Register Page    | Design Review | ⚠️   |
| FEA-3   | Design & Build: Forgot Password  | Design Review | ⚠️   |
| FEA-4   | Design & Build: Global Dashboard | Design Review | ⚠️   |
| FEA-5   | Design & Build: Deals List       | Design Review | ⚠️   |
| FEA-6   | Design & Build: Create Deal      | Design Review | ⚠️   |
| FEA-7   | Design & Build: Deal Overview    | Design Review | ⚠️   |
| FEA-8   | Design & Build: Edit Deal        | Design Review | ⚠️   |

**Gate 1 verdict:** ⚠️ **CONDITIONAL PASS** — All 8 tickets are still in `Design Review` in Notion, **but the user has confirmed verbally that designs are approved and the sprint should proceed to BE verification.** Recommended follow-up: bulk-update these tickets to `Ready for dev` in Notion before opening any FE PRs, so the workflow stays auditable.

---

## Gate 2 — Backend Verification

### Ticket FEA-1 — Design & Build: Login Page

**Screen:** 1.1 Login
**Notion:** https://www.notion.so/32f76aa2eb4b81ea8307e80e65e07f2a
**Layout:** Auth Layout

| Method | Path        | Status         | Implementation | Notes                                                                                                                                   |
| ------ | ----------- | -------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | /auth/login | ❌ **Missing** | —              | No `auth` module exists in [apps/sfi-api/src/modules/](../../../apps/sfi-api/src/modules/). Confirmed via `app.module.ts` imports list. |

**Database support:** ❌ No `User` model in [apps/sfi-api/prisma/schema.prisma](../../../apps/sfi-api/prisma/schema.prisma). The schema has Deal, Participant, RuleSnapshot, RevenueBatch, SettlementRun, LedgerJournal, ProofRecord, AuditLog, Document — **no users table**.

**Gaps for this ticket:**

1. **Entire `AuthModule` does not exist** — needs new folder `apps/sfi-api/src/modules/auth/` with controller + service + DTO + JWT strategy. Must register in `app.module.ts`.
2. **`User` Prisma model missing** — needs `id`, `email` (unique), `passwordHash`, `name`, `createdAt`, `updatedAt`, plus migration.
3. **Password hashing dependency** — `bcrypt` or `argon2` must be added to `apps/sfi-api/package.json`.
4. **JWT issuance** — `@nestjs/jwt` module + secret in env (Supabase or GCP Secret Manager).
5. **Session/refresh strategy** — design decision needed before implementation: short-lived JWT only, or JWT + refresh token?

---

### Ticket FEA-2 — Design & Build: Register Page

**Screen:** 1.2 Register
**Notion:** https://www.notion.so/32f76aa2eb4b81d1b7e2cf3aa013efcc

| Method | Path           | Status         | Implementation | Notes                                    |
| ------ | -------------- | -------------- | -------------- | ---------------------------------------- |
| POST   | /auth/register | ❌ **Missing** | —              | Same root cause as FEA-1: no auth module |

**Gaps for this ticket:**

1. Depends entirely on the auth module being built (see FEA-1 gaps).
2. **Email uniqueness validation** — needs DB-level unique index on `User.email` plus duplicate-email error handling in service.
3. **Password rules** — design spec says min 8 chars; the BE DTO must enforce this with `class-validator`.

---

### Ticket FEA-3 — Design & Build: Forgot Password

**Screen:** 1.3 Forgot Password
**Notion:** https://www.notion.so/32f76aa2eb4b81e6ade9ff61100e749a

| Method | Path                  | Status         | Implementation | Notes           |
| ------ | --------------------- | -------------- | -------------- | --------------- |
| POST   | /auth/forgot-password | ❌ **Missing** | —              | Same root cause |

**Gaps for this ticket:**

1. Depends on auth module (FEA-1).
2. **Password reset token table** — new Prisma model `PasswordResetToken` with `id`, `userId`, `tokenHash`, `expiresAt`, `usedAt`.
3. **Email delivery** — no email provider is configured anywhere in the project. Needs decision: SendGrid? Resend? SMTP? Plus template for the reset link.
4. **Reset link route** — separate `POST /auth/reset-password` endpoint not yet in scope but will be needed to complete the flow (not part of this screen, but called out as a downstream dependency).
5. **Security note** — design spec correctly says "always show success state even if email not found." BE must implement this constant-response behavior.

---

### Ticket FEA-4 — Design & Build: Global Dashboard

**Screen:** 2.1 Global Dashboard
**Notion:** https://www.notion.so/32f76aa2eb4b81bc95a5ffcda8658413
**Layout:** App Layout — Global Mode

| Method | Path                            | Status         | Implementation                                                                                        | Notes                                                                                                                             |
| ------ | ------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| GET    | /deals                          | ✅ **Ready**   | [deals.controller.ts:39](../../../apps/sfi-api/src/modules/deals/controllers/deals.controller.ts#L39) | Returns paginated deals with `meta.total` (covers Total Deals stat)                                                               |
| GET    | /deals?status=ACTIVE            | ⚠️ **Partial** | [deals.service.ts:50](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts#L50)          | `findAll` does NOT accept a `status` filter. Cannot derive Active Deals count without it.                                         |
| GET    | /deals?sortBy=updatedAt&limit=5 | ✅ **Ready**   | [deals.service.ts:51](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts#L51)          | `PaginationQueryDto` already supports `sortBy` and `sortOrder`                                                                    |
| GET    | aggregate "Pending Reviews"     | ❌ **Missing** | —                                                                                                     | No cross-deal endpoint that returns revenue batches with `status=PENDING` and settlement runs with `status=PREVIEWED` in one shot |
| GET    | aggregate "Total Settled $"     | ❌ **Missing** | —                                                                                                     | No endpoint sums `SettlementRun.totalAllocated` across deals                                                                      |

**Field-level checks:**

- `DealResponseDto` ([dto/index.ts:88](../../../apps/sfi-api/src/modules/deals/dto/index.ts#L88)) is missing `participantsCount` — Recent Deals table needs it. Workaround: include `_count: { participants: true }` in Prisma query and expose in mapper.
- Recent Deals table column "Currency" — DealResponseDto has no `currency` field. Currency lives on `RevenueBatch` and `SettlementRun`, not on `Deal` itself. **Design / data model mismatch — needs clarification with designer.**

**Gaps for this ticket:**

1. **Add `status` query param to `GET /deals`** — file: [deals.controller.ts](../../../apps/sfi-api/src/modules/deals/controllers/deals.controller.ts), [deals.service.ts](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts), and [dto/index.ts](../../../apps/sfi-api/src/modules/deals/dto/index.ts) `PaginationQueryDto`. Signature: `findAll(query: { status?: DealStatusDto, ... })`.
2. **New endpoint `GET /dashboard/summary`** — returns `{ totalDeals, activeDeals, pendingReviews, totalSettled }`. New file: `apps/sfi-api/src/modules/dashboard/dashboard.module.ts` (module doesn't exist yet).
3. **New endpoint `GET /dashboard/pending-reviews`** — returns `{ revenueBatches: [...], settlementRuns: [...] }` aggregated across all deals.
4. **`participantsCount` on `DealResponseDto`** — extend the mapper to include `_count`.
5. **Currency on Deal — design decision** — either add `currency` field to `Deal` model + migration, or remove the column from the design.

**Workaround if BE work is deferred:** FE can issue 3 parallel calls (`GET /deals`, `GET /deals?status=ACTIVE`, `GET /audit-logs?limit=10`) and compose stats client-side. This is acceptable for the demo but not production-quality.

---

### Ticket FEA-5 — Design & Build: Deals List

**Screen:** 3.1 Deals List
**Notion:** https://www.notion.so/32f76aa2eb4b81e6bc14e436f38cac50

| Method | Path                  | Status         | Implementation                                                                                        | Notes                                                                           |
| ------ | --------------------- | -------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| GET    | /deals                | ✅ **Ready**   | [deals.controller.ts:39](../../../apps/sfi-api/src/modules/deals/controllers/deals.controller.ts#L39) | Pagination + sort work                                                          |
| GET    | /deals?status=…       | ⚠️ **Partial** | —                                                                                                     | Status tabs (All / Active / Draft / Closed) need this filter — not implemented  |
| GET    | /deals?search=…       | ⚠️ **Partial** | —                                                                                                     | Search bar needs name filter — not implemented                                  |
| GET    | tab counts per status | ❌ **Missing** | —                                                                                                     | UI shows `[Active (8)] [Draft (2)] [Closed (2)]` — needs grouped count endpoint |

**Field-level checks:**

- Same `participantsCount` and `currency` issues as FEA-4 — the table column "Participants" and "Currency" need them.

**Gaps for this ticket:**

1. **`status` query param on `GET /deals`** — same gap as FEA-4 #1 (single fix covers both).
2. **`search` query param on `GET /deals`** — file: [deals.service.ts:50](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts#L50). Implementation: Prisma `where: { name: { contains: search, mode: 'insensitive' } }`.
3. **Status counts endpoint** — option A: new `GET /deals/counts` returns `{ ALL, DRAFT, ACTIVE, SUSPENDED, CLOSED }`. Option B: include counts in `meta` of `GET /deals` response.
4. Same `participantsCount` / `currency` gaps as FEA-4 #4 / #5.

---

### Ticket FEA-6 — Design & Build: Create Deal

**Screen:** 3.2 Create Deal
**Notion:** https://www.notion.so/32f76aa2eb4b8161aa3fe83230fb537b

| Method | Path   | Status       | Implementation                                                                                        | Notes                                              |
| ------ | ------ | ------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| POST   | /deals | ✅ **Ready** | [deals.controller.ts:26](../../../apps/sfi-api/src/modules/deals/controllers/deals.controller.ts#L26) | Full Prisma write, audit log, returns created deal |

**Field-level checks:** ✅ All match.

| Screen field     | DTO field                      | Match |
| ---------------- | ------------------------------ | ----- |
| Deal Name        | `name` (1–255)                 | ✅    |
| Description      | `description` (0–2000)         | ✅    |
| Status           | `status` (DealStatusDto)       | ✅    |
| Effective Date   | `effectiveDate` (IsDateString) | ✅    |
| Termination Date | `terminationDate` (optional)   | ✅    |
| Metadata         | `metadata` (Record)            | ✅    |

**Validation note:** Design spec says "Termination Date must be after Effective Date if provided." [`CreateDealDto`](../../../apps/sfi-api/src/modules/deals/dto/index.ts#L22) does **not** enforce this cross-field rule. Minor gap — can be enforced in service layer or with a custom validator. **⚠️ Soft gap.**

**Gaps for this ticket:**

1. **Add cross-field validation** — `terminationDate > effectiveDate` in [deals.service.ts](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts) `create()` method, throw `BadRequestException`. Low effort.

**FEA-6 verdict:** 🟢 **FE-ready.** The single soft gap above can be a follow-up; it doesn't block screen execution.

---

### Ticket FEA-7 — Design & Build: Deal Overview

**Screen:** 3.3 Deal Overview
**Notion:** https://www.notion.so/32f76aa2eb4b8165819bda30b0dce62f
**Layout:** App Layout — Deal Context Mode

| Method | Path                                                                   | Status         | Implementation                                                                                                    | Notes                                                                                                                    |
| ------ | ---------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| GET    | /deals/:id                                                             | ✅ **Ready**   | [deals.controller.ts:51](../../../apps/sfi-api/src/modules/deals/controllers/deals.controller.ts#L51)             | Returns deal + participants array via Prisma `include`                                                                   |
| GET    | /deals/:dealId/participants                                            | ✅ **Ready**   | apps/sfi-api/src/modules/participants/controllers/participants.controller.ts                                      | Confirmed in [ENDPOINT_STATUS.md](../../engineering/ENDPOINT_STATUS.md#2-participants-endpoints)                         |
| GET    | /deals/:dealId/rule-snapshots                                          | ✅ **Ready**   | apps/sfi-api/src/modules/rules/controllers/rule-snapshots.controller.ts                                           | Confirmed in ENDPOINT_STATUS.md                                                                                          |
| GET    | /deals/:dealId/revenue-batches                                         | ✅ **Ready**   | apps/sfi-api/src/modules/revenue/controllers/revenue-batches.controller.ts                                        | Confirmed in ENDPOINT_STATUS.md                                                                                          |
| GET    | /deals/:dealId/settlement-runs?limit=1&sortBy=createdAt&sortOrder=desc | ✅ **Ready**   | apps/sfi-api/src/modules/settlement/controllers/settlement-runs.controller.ts                                     | Confirmed in ENDPOINT_STATUS.md                                                                                          |
| GET    | Recent Activity timeline                                               | ⚠️ **Partial** | [audit-log.controller.ts:28](../../../apps/sfi-api/src/modules/audit-log/controllers/audit-log.controller.ts#L28) | `GET /audit-logs?dealId=…` exists. Need to confirm it returns timestamps + entity names that the timeline UI can render. |

**Field-level checks:**

- Stat cards need 4 counts: Participants / Rule Snapshots / Total Revenue / Settlement Runs. None of these are included in the `GET /deals/:id` response. FE must issue 4 follow-up calls **or** BE adds an aggregated `_count` block to the deal response. ⚠️ **Decision needed.**
- "Total Revenue" stat means the **sum of `RevenueBatch.totalAmount`** for the deal — there is no endpoint that returns this sum directly. FE must page through `GET /deals/:dealId/revenue-batches` and sum client-side, OR BE adds a new field.
- "Latest Settlement" card needs `proofHash` — confirm it is on the settlement run response (it should be, per Milestone 1 implementation).

**Gaps for this ticket:**

1. **Aggregate counts in deal detail** — extend [deals.service.ts:77](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts#L77) `findOne()` to use Prisma `_count: { select: { participants: true, ruleSnapshots: true, revenueBatches: true, settlementRuns: true } }` and expose in `DealResponseDto`. Single round-trip → 1 BE change = 4 stat cards filled.
2. **Total Revenue sum** — option A: derive in BE (preferred), add `totalRevenue` field to `DealResponseDto`. Option B: client-side sum (acceptable short-term).
3. **Recent Activity rendering** — verify `AuditLogEntryDto` shape matches the timeline UI. Read [audit-log/dto/index.ts](../../../apps/sfi-api/src/modules/audit-log/dto/index.ts) before FE work begins.

**FEA-7 verdict:** 🟡 **FE-ready with gaps.** Screen can be built today using multiple BE calls; gap #1 is a quality optimization that should land before production.

---

### Ticket FEA-8 — Design & Build: Edit Deal

**Screen:** 3.4 Edit Deal
**Notion:** https://www.notion.so/32f76aa2eb4b813791d8f93b3612a825

| Method | Path       | Status         | Implementation                                                                                        | Notes                                                                                                                                                                                      |
| ------ | ---------- | -------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | /deals/:id | ✅ **Ready**   | [deals.controller.ts:51](../../../apps/sfi-api/src/modules/deals/controllers/deals.controller.ts#L51) | Used to pre-fill the form                                                                                                                                                                  |
| PATCH  | /deals/:id | ❌ **MISSING** | —                                                                                                     | **Hard blocker.** `UpdateDealDto` exists at [dto/index.ts:54](../../../apps/sfi-api/src/modules/deals/dto/index.ts#L54), but neither the controller nor the service has any update method. |

**Field-level checks:**

- `UpdateDealDto` field shape matches the screen's editable fields (name, description, status, effectiveDate, terminationDate, metadata). The DTO is correct — only the route + service method are missing.
- Status dropdown supports all 4 values (DRAFT, ACTIVE, SUSPENDED, CLOSED) — `DealStatusDto` enum already has these. ✅

**Gaps for this ticket:**

1. **Implement `PATCH /deals/:id`** — add controller method to [deals.controller.ts](../../../apps/sfi-api/src/modules/deals/controllers/deals.controller.ts):

   ```ts
   @Patch(':id')
   @ApiOperation({ summary: 'Update a deal' })
   async update(
     @Param('id', ParseUUIDPipe) id: string,
     @Body() updateDealDto: UpdateDealDto,
   ): Promise<DealResponseDto> {
     return this.dealsService.update(id, updateDealDto);
   }
   ```

   Add corresponding `update(id, dto)` method to [deals.service.ts](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts) using `prisma.deal.update`. Emit an `UPDATED` audit log entry.

2. **Status-change confirmation flow** — design spec requires a confirmation modal on status change to SUSPENDED/CLOSED. This is **FE-only** (modal logic), no BE change beyond accepting the new status.

3. **No-op detection** — design spec says "form should detect if no changes were made and optionally disable Save Changes button." Pure FE concern.

**FEA-8 verdict:** 🔴 **BLOCKED.** The hard gap (#1) must be implemented before any FE work on this screen.

---

## Summary

| Ticket | Screen           | BE Status  | Verdict                                   |
| ------ | ---------------- | ---------- | ----------------------------------------- |
| FEA-1  | Login            | ❌ Missing | 🔴 Blocked — no auth module               |
| FEA-2  | Register         | ❌ Missing | 🔴 Blocked — no auth module               |
| FEA-3  | Forgot Password  | ❌ Missing | 🔴 Blocked — no auth module + no email    |
| FEA-4  | Global Dashboard | ⚠️ Partial | 🟡 Workaround possible                    |
| FEA-5  | Deals List       | ⚠️ Partial | 🟡 Workaround possible (no filter/search) |
| FEA-6  | Create Deal      | ✅ Ready   | 🟢 Go                                     |
| FEA-7  | Deal Overview    | ⚠️ Partial | 🟡 Workaround possible                    |
| FEA-8  | Edit Deal        | ❌ Missing | 🔴 Blocked — no PATCH route               |

**Tickets fully ready (🟢):** 1 / 8 — FEA-6
**Tickets ready with gaps (🟡):** 3 / 8 — FEA-4, FEA-5, FEA-7
**Tickets blocked (🔴):** 4 / 8 — FEA-1, FEA-2, FEA-3, FEA-8

---

## Consolidated Gap List

| #   | Gap                                                                                   | Type                      | Blocks              | Suggested owner |
| --- | ------------------------------------------------------------------------------------- | ------------------------- | ------------------- | --------------- |
| 1   | No `AuthModule` exists                                                                | Missing module            | FEA-1, FEA-2, FEA-3 | BE              |
| 2   | No `User` model in Prisma schema                                                      | Missing DB                | FEA-1, FEA-2, FEA-3 | BE              |
| 3   | No `PasswordResetToken` model + email provider                                        | Missing DB + infra        | FEA-3               | BE + DevOps     |
| 4   | `PATCH /deals/:id` route + service method                                             | Missing route             | FEA-8               | BE — small      |
| 5   | `GET /deals` lacks `status` query param                                               | Missing filter            | FEA-4, FEA-5        | BE — small      |
| 6   | `GET /deals` lacks `search` query param                                               | Missing filter            | FEA-5               | BE — small      |
| 7   | No deal status counts endpoint                                                        | Missing aggregate         | FEA-5               | BE — small      |
| 8   | No dashboard summary endpoint                                                         | Missing aggregate         | FEA-4               | BE — medium     |
| 9   | No dashboard pending-reviews aggregate                                                | Missing aggregate         | FEA-4               | BE — medium     |
| 10  | `DealResponseDto` missing `_count` block (participants/snapshots/revenue/settlements) | Missing fields            | FEA-4, FEA-5, FEA-7 | BE — small      |
| 11  | `Deal` model has no `currency` field but design shows it                              | Schema vs design mismatch | FEA-4, FEA-5        | Design + BE     |
| 12  | `CreateDealDto` does not enforce `terminationDate > effectiveDate`                    | Soft validation gap       | FEA-6               | BE — trivial    |
| 13  | Deal Overview "Total Revenue" sum is not exposed by any endpoint                      | Missing aggregate         | FEA-7               | BE — small      |
| 14  | `AuditLogEntryDto` shape vs Recent Activity timeline UI not yet confirmed             | Verification only         | FEA-7               | BE — verify     |

---

## Recommendations (suggested execution order)

To unblock the maximum number of screens with the minimum BE effort, execute gaps in this order:

1. **Gap #4** (PATCH /deals/:id) — unblocks FEA-8. ~30 minutes of work.
2. **Gap #5 + #6 + #7** (status filter, search, counts on GET /deals) — unblocks FEA-5 fully. ~1–2 hours.
3. **Gap #10** (`_count` on `DealResponseDto`) — improves FEA-4 and FEA-7. ~30 minutes.
4. **Gap #12** (cross-field validation on CreateDealDto) — closes the only FEA-6 soft gap. ~15 minutes.
5. **Gap #11** (currency on Deal — needs design decision before any BE work).
6. **Gap #8 + #9** (dashboard summary + pending-reviews) — proper FEA-4. ~half a day for a new dashboard module.
7. **Gaps #1 + #2 + #3** (auth subsystem from scratch) — unblocks the three Auth screens. **This is its own mini-project** — spec it separately, do not bundle into Sprint 1 cleanup. Decision needed: either descope Auth from Sprint 1 and move to its own sprint, or accept that Sprint 1 will partially slip.

After the first four bullets land, **6 of 8 screens become FE-ready**. That is the recommended cut-line for starting Sprint 1 frontend.

---

## Gate 3 — Figma Design Verification

**Figma File:** [FEA-Admin Hi-Fi Page](https://www.figma.com/design/Tk5nFtkvsbrDWo7dhIEHm0/FEA-Admin?node-id=384-1709)
**Verification Date:** 2026-04-09
**Method:** Figma MCP — screenshots + metadata for all 8 Sprint 1 screens + all variant states

This gate compares the **actual Hi-Fi designs** against the BE (beyond what was derivable from code alone). Each finding is numbered from #15 to continue the consolidated gap list.

---

### FEA-1 — Login (`385:11750`)

**Design shows:**

- Email (required) + Password (required, with show/hide toggle)
- "Forget password?" link
- "Sign In" button → `POST /auth/login`
- "Don't have an account? Sign Up" link
- Terms of Use footer text

**Navbar on ALL authenticated screens shows:**

- Bell (notifications) icon
- User **avatar photo** with dropdown arrow (top-right)

**New gaps from Figma:**

| #   | Gap                                                      | Notes                                                                                                                                                                                                         |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 15  | `POST /auth/login` response must include a `user` object | Navbar renders user avatar on every screen. Response shape needed: `{ accessToken, refreshToken?, user: { id, name, email, avatarUrl } }`. Without `user` in the response, the navbar has no data to display. |
| 16  | `User` model needs `avatarUrl: String?` field            | Profile photo shown in navbar top-right across ALL screens. Either stored in User or generated from a service (e.g. Gravatar). Decision needed.                                                               |
| 17  | `GET /auth/me` endpoint needed                           | Every page load must be able to re-hydrate the current user (for token refresh, page reload). Returns same `user` shape as login response.                                                                    |

---

### FEA-2 — Register (`385:11543`)

**Design shows:**

- **Full Name** (single field, required) — NOT first name + last name
- Email (required)
- Password with show/hide (required)
- Confirm Password (shown pre-filled as "admin1234!" — FE-only validation)
- "Create Account" button → `POST /auth/register`
- "Don't have an account? Sign In" link

**New gaps from Figma:**

| #   | Gap                                                                                           | Notes                                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 18  | `POST /auth/register` DTO field must be `fullName` (single field, not `firstName`/`lastName`) | Design form has one "Full Name" input. `User` Prisma model and `RegisterDto` must use `name: String` (matching the login response shape — see gap #15). |
| 19  | Confirm Password is **FE-only**                                                               | No BE gap — backend does not receive confirmPassword field. Already expected, but confirmed from Figma.                                                 |

---

### FEA-3 — Forgot Password (`385:11678` + Email Verified state `385:11710`)

**Design shows (state 1 — input form):**

- Email (required)
- "Send Reset Link" button → `POST /auth/forgot-password`
- "Back to Sign In" link

**Design shows (state 2 — "Email Verified" success state):**

- Title: "Email Verified" (subtitle: "FEA-SFI Admin")
- Body text: "We sent a password reset link to **john@example.com**" (email echoed back)
- "Didn't receive it?" label
- **"Resend"** button — re-triggers the same reset link
- **"Try Different Email"** button — navigates back to input form
- "Back to Sign In" link

**New gaps from Figma:**

| #   | Gap                                                              | Notes                                                                                                                                                                                                                    |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 20  | `POST /auth/forgot-password` must be **idempotent**              | "Resend" button calls the same endpoint again with the same `{ email }`. BE must not throw if a reset token already exists for that email — it should invalidate the old token and issue a new one (or just extend TTL). |
| 21  | `POST /auth/forgot-password` response should include `{ email }` | Success state displays "We sent a password reset link to **john@example.com**". FE could store the email from the request, but returning `{ message, email }` from BE is cleaner and avoids FE state management issues.  |
| 22  | **`POST /auth/reset-password` endpoint needed** (downstream)     | Not in Sprint 1 scope, but the forgot password flow is incomplete without it. The email reset link must call somewhere. Flag for auth sprint backlog: `POST /auth/reset-password` with `{ token, newPassword }`.         |

---

### FEA-4 — Global Dashboard (`385:11464` + empty state `385:11506`)

**Design shows (populated state):**

- 4 stat cards: **Total Deals** (18), **Active Deals** (9), **Pending Review** (9), **Total Settled** ($450M)
- **Pending Reviews section** with TWO subsections:
  1. "Revenue Batches Awaiting Validation" — columns: Deal Name (link), Batch ID (`RB-2026-004`), Amount (`$50M`), Status badge (`Pending`)
  2. "Settlements Awaiting Finalization" — columns: Deal Name (link), Run name (`Run #3`), Amount (`$5M`), Status badge (`Previewed`)
  - "View All Pending Reviews" link
- **Recent Deals table** — columns: Deal Name (link), Status badge, **Participants** (count), **Updated At**
  - ⚠️ **NO Currency column** in Recent Deals — currency only appears in Deals List
  - "View All Deals" link

**Design shows (empty state):**

- All stat cards show 0 / $0
- Pending Reviews: "All caught up! No items need your attention."
- Recent Deals: "No deals yet. Create your first deal to get started." + "Create New Deal" button

**New gaps from Figma:**

| #   | Gap                                                                                                           | Notes                                                                                                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 23  | `GET /dashboard/summary` confirmed response shape: `{ totalDeals, activeDeals, pendingReview, totalSettled }` | `totalSettled` is a **dollar amount** ($450M / $0), not a count. Must sum `SettlementRun.totalAllocated` across all FINALIZED runs.                                                                                                                  |
| 24  | `GET /dashboard/pending-reviews` confirmed response shape                                                     | Must return TWO distinct arrays: `revenueBatches: [{ dealId, dealName, batchNumber, totalAmount, status }]` and `settlementRuns: [{ dealId, dealName, runNumber, totalAllocated, status }]`. The endpoint must cross-join deal names (not just IDs). |
| 25  | Empty state for all dashboard endpoints must return 0/empty, **never 404**                                    | Empty state is designed and shown in Figma. Both `summary` and `pending-reviews` must return a valid response with zero values when no data exists.                                                                                                  |
| 26  | Recent Deals table: **NO currency column** on dashboard                                                       | Confirmed from Figma. `DealResponseDto` does NOT need currency for the Dashboard table. Currency gap only applies to Deals List (gap #11). Dashboard uses: name, status, participantsCount, updatedAt.                                               |

---

### FEA-5 — Deals List (`385:10893`)

**Design shows:**

- Search bar: "Search by deal name" → `?search=`
- Status dropdown filter → `?status=`
- Sort icon (calendar) — column sort
- "Create New Deal" button (top-right)
- **4 status count cards:** All (18), Active (6), Draft (6), Closed (6)
  - ⚠️ **No "Suspended" tab/card shown in the design**
- **Table columns:** Deal Name, Status, **Currency** (USD), Participants (count), Created At (sortable), Updated At (sortable)
- Pagination: 1, 2, 3, ..., 10

**New gaps from Figma:**

| #   | Gap                                                                                               | Notes                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 27  | Status count endpoint: only **4 buckets needed** — All, Active, Draft, Closed                     | Design does NOT show a "Suspended" tab. Count endpoint shape: `{ all, active, draft, closed }`. Suspended deals exist but are not surfaced in this view's tabs.                                                                                                                                                                                                               |
| 28  | **Currency column in Deals List is confirmed** — but the deal creation form has NO currency field | This deepens gap #11. Currency shown is "USD" for all deals. Source unclear — options: (a) add `currency: String` to `Deal` model with default `"USD"`, (b) derive from first `RevenueBatch.currency`. **Decision required before FE can build this column.** Recommended: add `currency` with default `USD` to `Deal` model — simplest and most performant for list queries. |
| 29  | Column sort on **Created At** and **Updated At**                                                  | Sort arrows visible on both columns. `PaginationQueryDto` already has `sortBy` + `sortOrder` ✅ — no new gap, just confirm FE passes `sortBy=createdAt` or `sortBy=updatedAt`.                                                                                                                                                                                                |

---

### FEA-6 — Create Deal (`385:10976`)

**Design shows:**

- Deal Name (required)
- Description textarea — "0/2000 Characters" counter displayed
- Deal Details section: Status (default Draft), Effective Date (required), Termination Date (optional — "leave empty for ongoing deals")
- Cancel + Create Deal buttons

**New gaps from Figma:**

| #   | Gap                                                               | Notes                                                                                                                                                                                                                                                                                                                                  |
| --- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 30  | Description character counter ("0/2000 Characters") — **FE-only** | `MaxLength(2000)` already on DTO ✅. No BE change needed.                                                                                                                                                                                                                                                                              |
| 31  | **No currency field on Create Deal form**                         | Consistent with gap #28 — currency is not set at deal creation time. If `currency` is added to the `Deal` model, it either needs a default value (`USD`) or must be added to `CreateDealDto` as an optional field. Figma does not show a currency selector on the form — suggests **default value approach** is the designer's intent. |

**FEA-6 Figma verdict:** 🟢 No additional blocking gaps. Existing gap #12 (cross-field date validation) confirmed as the only outstanding item.

---

### FEA-7 — Deal Overview (`385:10602` + Suspended variant `385:10677`)

**Design shows (normal state):**

- Header: "Deal Overview" + "Edit Deal" button
- Deal title + subtitle: `"{dealName}" | "Film deal - Created Feb 1, 2026"` — description prefix + createdAt
- Status badge: "Closed" (red)
- **4 stat cards:** Participants (18), Rule Snapshot (9), Total Revenue ($200M), Settlement Runs (2) — each with external link icon (↗)
- **Latest Settlement section:**
  - "Run #2 - FINALIZED - Mar 5, 2026" — with "Cancelled" status badge
  - `Total Revenue: $200,000,000 → Total Allocated: $200M`
  - `Rule Snapshot: v3` | `Revenue Batches: 2`
  - **`Proof: sha256:a3f8b2... [copy icon]`**
  - "View Details" link
- **Quick Actions:** 4 buttons — New Revenue Batch, New Settlement Run, New Participant, New Rule Snapshot
- **Recent Activity:** date + human-readable description (e.g. "Settlement Run #2 finalized", "Revenue Batch RB-2026-003 validated", "Rule Snapshot v3 created", "Participant 'Sarah Chen' added")

**Design shows (Suspended state):**

- Status badge: "Suspended" (orange)
- Warning banner (yellow): **"Client is currently unresponsive."**
- Everything else identical

**New gaps from Figma:**

| #   | Gap                                                                                                                            | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 32  | **Latest Settlement card** needs specific fields from `GET /deals/:id/settlement-runs?limit=1&sortBy=createdAt&sortOrder=desc` | Confirmed fields needed in SettlementRunResponseDto: `runNumber` (Run #2), `status` (FINALIZED/CANCELLED), `finalizedAt`, `totalRevenue`, `totalAllocated`, `ruleSnapshotVersion` (v3), `revenueBatchCount` (2), **`proofHash`** (sha256:... for copy-to-clipboard). Verify all are present in the existing DTO.                                                                                                                                                                                                                                        |
| 33  | `SettlementRun` status enum may be missing **`CANCELLED`** value                                                               | Design shows "Cancelled" badge on the latest settlement run. Check `SettlementRunStatus` enum in schema — if `CANCELLED` is not there, add it.                                                                                                                                                                                                                                                                                                                                                                                                          |
| 34  | `Deal` model needs **`suspendedReason: String?`** field                                                                        | Suspended state shows a specific message "Client is currently unresponsive." — this is not a hardcoded UI string (different deals would have different reasons). Implies a stored field on the Deal. Add `suspendedReason` to `Deal` model + expose in `DealResponseDto`. Also add to `UpdateDealDto` so it can be set when changing status to SUSPENDED.                                                                                                                                                                                               |
| 35  | **Recent Activity descriptions are composed, not raw**                                                                         | Activity items shown: "Settlement Run #2 finalized", "Revenue Batch RB-2026-003 validated", "Rule Snapshot v3 created", "Participant 'Sarah Chen' added". These are human-readable strings the FE must build from `AuditLogEntryDto`. `metadata` field must contain sufficient context: `{ runNumber }` for SettlementRun events, `{ batchNumber }` for RevenueBatch events, `{ version }` for RuleSnapshot events, `{ participantName }` for Participant events. Verify each `auditLog.create()` call in the relevant services includes this metadata. |
| 36  | **Total Revenue stat = sum of RevenueBatch.totalAmount**                                                                       | Confirmed from design ($200M displayed). Not returned by any single endpoint — needs either: (a) added as `totalRevenue` to `DealResponseDto` (computed in service), or (b) FE pages through `/revenue-batches` and sums (not scalable). Recommended: add `totalRevenue: Decimal` aggregation in `deals.service.ts` `findOne()` using Prisma `_sum`.                                                                                                                                                                                                    |
| 37  | **Quick Actions are Sprint 1 navigation stubs**                                                                                | "New Revenue Batch", "New Settlement Run", "New Participant", "New Rule Snapshot" buttons are on the Deal Overview in Sprint 1. The CREATE endpoints for these are Sprint 2/3 scope — but the buttons must exist in the FE. For Sprint 1, they can navigate to placeholder routes or show a "Coming soon" state. No new BE gap for Sprint 1.                                                                                                                                                                                                            |

---

### FEA-8 — Edit Deal (`385:10504` + `385:10528` + `385:10564`)

**Design shows (normal edit state — `385:10504`):**

- Form pre-filled: Deal Name, Description, Status, Effective Date, Termination Date
- Header actions: **"Closed Deal"** (red button) + **"Suspend Deal"** (dark button)
- Bottom: Cancel + Save Changes

**Design shows (Close Deal confirmation modal — `385:10528`):**

- Modal: "Close Deal Confirmation"
- Body: "Are you sure? This will affect all ongoing work in this deal."
- Actions: "Cancel" + "Yes, Close Deal"

**Design shows (third variant — `385:10564`):**

- Likely the Suspend Deal confirmation state

**New gaps from Figma:**

| #   | Gap                                                                                                | Notes                                                                                                                                                                                                                                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 38  | **"Close Deal" and "Suspend Deal" are separate header CTA buttons** — both call `PATCH /deals/:id` | "Closed Deal" button → confirmation modal → `PATCH /deals/:id { status: "CLOSED" }`. "Suspend Deal" button → likely a confirmation modal → `PATCH /deals/:id { status: "SUSPENDED", suspendedReason: "..." }`. Both are covered by implementing gap #4 (`PATCH /deals/:id`). No new route needed — just confirm `PATCH` accepts status changes.                 |
| 39  | **"Suspend Deal" may need `suspendedReason` in the PATCH body**                                    | The suspended state shows a warning message (gap #34). When suspending, the user may need to provide a reason. This is a UX design question — the design does NOT show a reason input field in the suspend modal (not visible in current screens). **Flag for designer clarification.** If reason is stored, add `suspendedReason?: string` to `UpdateDealDto`. |
| 40  | **PATCH /deals/:id should return the full updated `DealResponseDto`**                              | The FE will redirect to Deal Overview after save. The response must include all fields needed to render the overview without a separate GET. Confirm `update()` service method returns mapper output (not just `id`).                                                                                                                                           |

---

## Consolidated Figma Gap List (Gates 3 additions)

These extend the Gate 2 gap list (#1–#14). Priority is estimated based on how many screens each gap blocks.

| #   | Gap                                                                                                                             | Type                    | Blocks                   | Priority     |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------ | ------------ |
| 15  | `POST /auth/login` response must include `user: { id, name, email, avatarUrl }`                                                 | Missing response field  | FEA-1, Navbar everywhere | 🔴 High      |
| 16  | `User` model needs `avatarUrl: String?` field                                                                                   | Missing DB field        | FEA-1, Navbar everywhere | 🔴 High      |
| 17  | `GET /auth/me` endpoint needed                                                                                                  | Missing endpoint        | All authenticated pages  | 🔴 High      |
| 18  | `POST /auth/register` DTO field = `fullName` (single field)                                                                     | DTO shape               | FEA-2                    | 🟡 Medium    |
| 19  | Confirm Password is FE-only (no BE change)                                                                                      | Confirmation            | FEA-2                    | ✅ No action |
| 20  | `POST /auth/forgot-password` must be idempotent (Resend button)                                                                 | BE behavior             | FEA-3                    | 🟡 Medium    |
| 21  | Forgot-password response should return `{ message, email }`                                                                     | Missing response field  | FEA-3                    | 🟢 Low       |
| 22  | `POST /auth/reset-password` needed (downstream, not Sprint 1)                                                                   | Missing endpoint        | FEA-3 full flow          | 🔵 Backlog   |
| 23  | `GET /dashboard/summary` response: `totalSettled` = dollar amount, not count                                                    | Response shape          | FEA-4                    | 🟡 Medium    |
| 24  | `GET /dashboard/pending-reviews` returns two arrays: `revenueBatches[]` + `settlementRuns[]` with `dealName` joined             | Response shape          | FEA-4                    | 🟡 Medium    |
| 25  | Dashboard endpoints return 0/empty on no data — never 404                                                                       | Empty state             | FEA-4                    | 🟡 Medium    |
| 26  | Dashboard Recent Deals: NO currency column — currency gap is Deals List only                                                    | Clarification           | FEA-4 (removes gap)      | ✅ No action |
| 27  | Status count endpoint: 4 buckets only — All, Active, Draft, Closed (no Suspended tab)                                           | Response shape          | FEA-5                    | 🟡 Medium    |
| 28  | Currency in Deals List: add `currency: String` to `Deal` model with default `"USD"`                                             | Missing DB field        | FEA-5                    | 🔴 High      |
| 29  | Column sort on createdAt/updatedAt: already supported by PaginationQueryDto                                                     | Confirmation            | FEA-5                    | ✅ No action |
| 30  | Description char counter (0/2000) is FE-only                                                                                    | Confirmation            | FEA-6                    | ✅ No action |
| 31  | `currency` on `CreateDealDto` should be optional with default `USD`                                                             | DTO field               | FEA-6                    | 🟢 Low       |
| 32  | Latest Settlement card needs `proofHash`, `ruleSnapshotVersion`, `revenueBatchCount`, `finalizedAt` in SettlementRunResponseDto | Missing response fields | FEA-7                    | 🟡 Medium    |
| 33  | `SettlementRun` status enum missing `CANCELLED` value                                                                           | Missing enum value      | FEA-7                    | 🟡 Medium    |
| 34  | `Deal` model needs `suspendedReason: String?` + expose in `DealResponseDto` + `UpdateDealDto`                                   | Missing DB field        | FEA-7, FEA-8             | 🟡 Medium    |
| 35  | `AuditLogService.create()` metadata must include human-readable identifiers per entity type                                     | Missing metadata        | FEA-7 Recent Activity    | 🟡 Medium    |
| 36  | `GET /deals/:id` should return `totalRevenue` (sum of RevenueBatch.totalAmount)                                                 | Missing aggregate       | FEA-7                    | 🟡 Medium    |
| 37  | Quick Action buttons are Sprint 1 FE stubs — no new BE gap for Sprint 1                                                         | Confirmation            | FEA-7                    | ✅ No action |
| 38  | "Close Deal" / "Suspend Deal" CTAs both use `PATCH /deals/:id` — no new route                                                   | Confirmation            | FEA-8                    | ✅ No action |
| 39  | `suspendedReason` input on Suspend flow — needs designer clarification                                                          | Decision needed         | FEA-8                    | 🔵 Pending   |
| 40  | `PATCH /deals/:id` must return full `DealResponseDto` (not just ID)                                                             | Response contract       | FEA-8                    | 🟡 Medium    |

---

## Updated Overall Gap Count

| Source                         | Count                                                              | Critical                                                    |
| ------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| Gate 2 (code-only analysis)    | 14 gaps                                                            | 4 hard blockers                                             |
| Gate 3 (Figma design analysis) | 26 items (15 net new gaps, 6 confirmations/no-action, 5 decisions) | 3 new high-priority gaps (#15, #16, #17 — auth user object) |
| **Total**                      | **29 actionable gaps**                                             |                                                             |

**Top 3 new priorities from Figma (not previously identified):**

1. **Gap #15–17** — Login response + `avatarUrl` + `GET /auth/me` — these affect the navbar on EVERY authenticated screen, not just auth flows
2. **Gap #28** — Currency on Deal model — blocks the entire Deals List currency column
3. **Gap #34** — `suspendedReason` on Deal — affects Deal Overview and Edit Deal status-change flow

---

## Resolution — 2026-04-09

This section tracks the implementation work that closed the gaps identified above. All non-auth gaps were resolved in a single backend cleanup pass before Sprint 1 frontend execution began.

### Schema changes (Prisma)

| File                                                                                     | Change                                                                                                                          |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [schema.prisma](../../../apps/sfi-api/prisma/schema.prisma) — `Deal` model               | Added `currency: Currency @default(USD)`, added `suspendedReason: String?`, added `@@index([status])` for the new status filter |
| [schema.prisma](../../../apps/sfi-api/prisma/schema.prisma) — `SettlementRunStatus` enum | Added `CANCELLED` value (gap #33 closed)                                                                                        |

⚠️ **Migration required:** Run `pnpm --filter @sfi-fea/api db:migrate -- --name sprint1_deal_currency_suspended_reason_settlementrun_cancelled` to generate and apply the migration. Existing rows: `currency` will default to `'USD'`, `suspendedReason` will be NULL.

### Code changes (Deals module)

| Gap #     | Description                                                                                                                                                                    | Files                                                                                                                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #4, #40   | `PATCH /deals/:id` route + service `update()` method, returns full DealResponseDto                                                                                             | [deals.controller.ts](../../../apps/sfi-api/src/modules/deals/controllers/deals.controller.ts), [deals.service.ts](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts)                                                                             |
| #5        | `?status=` query param on `GET /deals` (added via new `DealListQueryDto`)                                                                                                      | [dto/index.ts](../../../apps/sfi-api/src/modules/deals/dto/index.ts), [deals.service.ts](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts)                                                                                                       |
| #6        | `?search=` query param (case-insensitive on name + description)                                                                                                                | Same files as #5                                                                                                                                                                                                                                                  |
| #7        | `GET /deals/counts` endpoint returning `{ all, draft, active, suspended, closed }` via single Prisma `groupBy`                                                                 | [deals.controller.ts](../../../apps/sfi-api/src/modules/deals/controllers/deals.controller.ts), [deals.service.ts](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts)                                                                             |
| #10       | `_count` block on `DealResponseDto` (participants, ruleSnapshots, revenueBatches, settlementRuns) — populated by `findOne()`. List endpoint includes `participantsCount` only. | [dto/index.ts](../../../apps/sfi-api/src/modules/deals/dto/index.ts), [deal.mapper.ts](../../../apps/sfi-api/src/modules/deals/mappers/deal.mapper.ts), [deals.service.ts](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts)                     |
| #11 / #28 | `currency` field on `Deal` model (default `USD`), exposed in DTOs and DealMapper                                                                                               | Schema + DTOs + Mapper                                                                                                                                                                                                                                            |
| #12       | Cross-field date validation (`terminationDate > effectiveDate`) via custom `@IsAfterDate` decorator + service-level defense in depth                                           | [is-after-date.validator.ts](../../../apps/sfi-api/src/common/validators/is-after-date.validator.ts), [dto/index.ts](../../../apps/sfi-api/src/modules/deals/dto/index.ts), [deals.service.ts](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts) |
| #13 / #36 | `totalRevenue` field on `DealResponseDto`, computed in `findOne()` via `prisma.revenueBatch.aggregate({ _sum })`                                                               | [deals.service.ts](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts), [dto/index.ts](../../../apps/sfi-api/src/modules/deals/dto/index.ts)                                                                                                       |
| #34       | `suspendedReason` field on `Deal` model + `UpdateDealDto` + `DealResponseDto`. Service auto-clears the reason when status moves out of SUSPENDED.                              | Schema + DTOs + service                                                                                                                                                                                                                                           |

### Code changes (Settlement module — Latest Settlement card support)

| Gap # | Description                                                                                                                                                                                                                                     | Files                                                                                                                                                                           |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #32   | `SettlementRunResponseDto` extended with optional fields: `proofHash`, `ruleSnapshotVersion`, `revenueBatchCount`, `totalRevenue`, `finalizedAt` (alias of `executedAt`). Both `listRuns()` and `getRun()` populate these via Prisma `include`. | [dto/index.ts](../../../apps/sfi-api/src/modules/settlement/dto/index.ts), [settlement.service.ts](../../../apps/sfi-api/src/modules/settlement/services/settlement.service.ts) |
| #33   | `CANCELLED` added to both `SettlementRunStatus` (Prisma enum) and `SettlementStatusEnum` (DTO mirror)                                                                                                                                           | Schema + [dto/index.ts](../../../apps/sfi-api/src/modules/settlement/dto/index.ts)                                                                                              |

### Code changes (new Dashboard module)

| Gap #          | Description                                                                                                                                                                                                                   | Files                                                                                                                                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #8, #23        | New `GET /dashboard/summary` endpoint returning `{ totalDeals, activeDeals, pendingReview, totalSettled }`. `totalSettled` is the sum of `SettlementRun.totalAllocated` across all FINALIZED runs (dollar amount, not count). | [dashboard.controller.ts](../../../apps/sfi-api/src/modules/dashboard/controllers/dashboard.controller.ts), [dashboard.service.ts](../../../apps/sfi-api/src/modules/dashboard/services/dashboard.service.ts), [dto/index.ts](../../../apps/sfi-api/src/modules/dashboard/dto/index.ts) |
| #9, #24        | New `GET /dashboard/pending-reviews` returning two arrays: `revenueBatches` (PENDING) and `settlementRuns` (PREVIEWED), each joined with the parent deal name. Settlement runs include a computed `runLabel` ("Run #N")       | Same                                                                                                                                                                                                                                                                                    |
| #25            | Both endpoints return 0 / empty arrays when no data — never 404. Verified by dashboard.service.spec.ts empty-state tests.                                                                                                     | [dashboard.service.spec.ts](../../../apps/sfi-api/src/modules/dashboard/services/dashboard.service.spec.ts)                                                                                                                                                                             |
| (registration) | `DashboardModule` registered in `AppModule`                                                                                                                                                                                   | [app.module.ts](../../../apps/sfi-api/src/app.module.ts)                                                                                                                                                                                                                                |

### Tests

- [deals.service.spec.ts](../../../apps/sfi-api/src/modules/deals/services/deals.service.spec.ts) — extended with 14 new test cases covering: create with default currency, create rejection on bad dates, list with status filter, list with case-insensitive search, findOne with all aggregates, findOne empty totalRevenue, update emitting UPDATED audit, update emitting STATUS_CHANGED, update with date validation, suspendedReason auto-clear, NotFoundException paths, getCounts with grouped data, getCounts empty.
- [dashboard.service.spec.ts](../../../apps/sfi-api/src/modules/dashboard/services/dashboard.service.spec.ts) — new file with 4 test cases covering populated state and empty state for both endpoints.
- **Total: 50 tests passing** (`pnpm --filter @sfi-fea/api test`).
- **Typecheck clean** (`pnpm --filter @sfi-fea/api typecheck`).
- **Lint clean** (`pnpm --filter @sfi-fea/api lint` — only 4 pre-existing console warnings in `gcp-secrets.service.ts`, unrelated).

### Resolved gap status table

| #   | Gap                                                   | Status                                                                                                                                                                                                                                           |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | No `AuthModule`                                       | ✅ **Resolved** (2026-04-13) — full module shipped at `apps/sfi-api/src/modules/auth/`                                                                                                                                                           |
| 2   | No `User` model                                       | ✅ **Resolved** (2026-04-13) — `User`, `RefreshToken`, `PasswordResetToken` models added; migration: `add_auth_user_refresh_password_reset`                                                                                                      |
| 3   | No `PasswordResetToken` model + email provider        | ✅ **Resolved** (2026-04-13) — Mailtrap via nodemailer wired in `EmailService`, falls back to console log when env vars missing                                                                                                                  |
| 4   | `PATCH /deals/:id` route                              | ✅ **Resolved**                                                                                                                                                                                                                                  |
| 5   | `GET /deals` `?status=` filter                        | ✅ **Resolved**                                                                                                                                                                                                                                  |
| 6   | `GET /deals` `?search=` filter                        | ✅ **Resolved**                                                                                                                                                                                                                                  |
| 7   | Deal status counts endpoint                           | ✅ **Resolved** (`GET /deals/counts`)                                                                                                                                                                                                            |
| 8   | Dashboard summary endpoint                            | ✅ **Resolved** (`GET /dashboard/summary`)                                                                                                                                                                                                       |
| 9   | Dashboard pending-reviews endpoint                    | ✅ **Resolved** (`GET /dashboard/pending-reviews`)                                                                                                                                                                                               |
| 10  | `_count` on `DealResponseDto`                         | ✅ **Resolved**                                                                                                                                                                                                                                  |
| 11  | `currency` on Deal model                              | ✅ **Resolved** (added with default `USD`)                                                                                                                                                                                                       |
| 12  | Cross-field date validation                           | ✅ **Resolved** (custom `@IsAfterDate` validator)                                                                                                                                                                                                |
| 13  | Total Revenue aggregate                               | ✅ **Resolved** (in `DealResponseDto.totalRevenue`)                                                                                                                                                                                              |
| 14  | `AuditLogEntryDto` shape vs Recent Activity           | ✅ **Verified** — `metadata` field exists and is generic. Per-module metadata convention documented below.                                                                                                                                       |
| 15  | Login response includes `user` object                 | ✅ **Resolved** (2026-04-13) — `AuthResponseDto` envelope includes `{ user, tokens }` on register/login/refresh                                                                                                                                  |
| 16  | `User.avatarUrl` field                                | ✅ **Resolved** (2026-04-13) — field added to schema (nullable). Cloud bucket upload deferred — see [AUTH_IMPLEMENTATION.md §8](../../engineering/AUTH_IMPLEMENTATION.md#8-avatar-cloud-bucket-pending)                                          |
| 17  | `GET /auth/me` endpoint                               | ✅ **Resolved** (2026-04-13) — protected by global `JwtAuthGuard`, returns `AuthUserDto`                                                                                                                                                         |
| 18  | `RegisterDto.fullName` (single field)                 | ✅ **Resolved** (2026-04-13) — `RegisterDto` uses `fullName: string`, normalized to `User.name`                                                                                                                                                  |
| 19  | Confirm Password is FE-only                           | ✅ **Confirmed — no BE work**                                                                                                                                                                                                                    |
| 20  | Forgot password idempotency                           | ✅ **Resolved** (2026-04-13) — `forgotPassword()` invalidates prior unused tokens before issuing fresh, supports the FE Resend button                                                                                                            |
| 21  | Forgot password returns `{ email }`                   | ✅ **Resolved** (2026-04-13) — `ForgotPasswordResponseDto` returns `{ message, email }`                                                                                                                                                          |
| 22  | `POST /auth/reset-password` (downstream)              | ✅ **Resolved** (2026-04-13) — endpoint validates token, hashes new password, marks token used, revokes all refresh tokens for that user                                                                                                         |
| 23  | Dashboard summary shape (`totalSettled = $`)          | ✅ **Resolved**                                                                                                                                                                                                                                  |
| 24  | Dashboard pending-reviews shape (two arrays)          | ✅ **Resolved**                                                                                                                                                                                                                                  |
| 25  | Empty state — never 404                               | ✅ **Resolved + tested**                                                                                                                                                                                                                         |
| 26  | Dashboard Recent Deals — no currency column           | ✅ **Confirmed — clarification only**                                                                                                                                                                                                            |
| 27  | Status counts: 4 buckets only                         | ✅ **Resolved** (endpoint returns all 5; FE picks 4)                                                                                                                                                                                             |
| 28  | `currency` on Deal (Deals List column)                | ✅ **Resolved** (same as gap #11)                                                                                                                                                                                                                |
| 29  | Sort on createdAt/updatedAt                           | ✅ **Already supported** by `PaginationQueryDto`                                                                                                                                                                                                 |
| 30  | Description char counter — FE-only                    | ✅ **Confirmed**                                                                                                                                                                                                                                 |
| 31  | `currency` on `CreateDealDto` (optional, default USD) | ✅ **Resolved**                                                                                                                                                                                                                                  |
| 32  | Latest Settlement card fields                         | ✅ **Resolved** (added to `SettlementRunResponseDto`)                                                                                                                                                                                            |
| 33  | `SettlementRun.CANCELLED` enum                        | ✅ **Resolved**                                                                                                                                                                                                                                  |
| 34  | `Deal.suspendedReason` field                          | ✅ **Resolved** (2026-04-09) — then **renamed to `Deal.notes`** on 2026-04-13 after designer confirmed the modal field is labelled "Notes" (gap #39). Service still auto-clears the value when status leaves SUSPENDED.                          |
| 35  | Audit metadata for Recent Activity                    | ✅ **Resolved** (2026-04-13) — every existing `auditLog.create()` call across the 5 domain services now carries the metadata keys the FE Recent Activity timeline needs. Per-module convention table below.                                      |
| 36  | `totalRevenue` in `GET /deals/:id`                    | ✅ **Resolved**                                                                                                                                                                                                                                  |
| 37  | Quick Action buttons — FE stubs                       | ✅ **Confirmed — no BE work**                                                                                                                                                                                                                    |
| 38  | Close/Suspend Deal CTAs use PATCH                     | ✅ **Confirmed — no new route**                                                                                                                                                                                                                  |
| 39  | `suspendedReason` input on Suspend flow               | ✅ **Resolved** (2026-04-13) — designer confirmed the Suspend Deal confirmation modal **does** include a notes field. To match the FE label, the BE field was renamed `suspendedReason` → `notes` (column, DTOs, mapper, audit metadata, tests). |
| 40  | `PATCH /deals/:id` returns full DealResponseDto       | ✅ **Resolved**                                                                                                                                                                                                                                  |

### Net result

| Bucket                            | Count  |
| --------------------------------- | ------ |
| ✅ Resolved (code change shipped) | 34     |
| ✅ Confirmed (no action needed)   | 6      |
| **Total**                         | **40** |

Gap #35 (audit metadata convention) and gap #39 (Suspend modal `notes` field) both moved from their earlier ⚠️/⏸ buckets into ✅ Resolved on 2026-04-13. The only remaining out-of-scope item is the **avatar Cloud bucket upload** — `User.avatarUrl` field exists and round-trips through every auth response, but actual upload is pencilled in for a separate sprint (see [AUTH_IMPLEMENTATION.md §8](../../engineering/AUTH_IMPLEMENTATION.md#8-avatar-cloud-bucket-pending)).

**FE-ready ticket count after resolution:**

| Ticket                | Pre-resolution | After 2026-04-09 | After 2026-04-13 |
| --------------------- | -------------- | ---------------- | ---------------- |
| FEA-1 Login           | 🔴 Blocked     | 🔴 Blocked       | 🟢 **Ready**     |
| FEA-2 Register        | 🔴 Blocked     | 🔴 Blocked       | 🟢 **Ready**     |
| FEA-3 Forgot Password | 🔴 Blocked     | 🔴 Blocked       | 🟢 **Ready**     |
| FEA-4 Dashboard       | 🟡 Workaround  | 🟢 Ready         | 🟢 Ready         |
| FEA-5 Deals List      | 🟡 Workaround  | 🟢 Ready         | 🟢 Ready         |
| FEA-6 Create Deal     | 🟢 Ready       | 🟢 Ready         | 🟢 Ready         |
| FEA-7 Deal Overview   | 🟡 Workaround  | 🟢 Ready         | 🟢 Ready         |
| FEA-8 Edit Deal       | 🔴 Blocked     | 🟢 Ready         | 🟢 Ready         |

**8 of 8 tickets are now fully BE-ready** (up from 5 on 2026-04-09). With the auth subsystem in place the FE can wire FEA-1/2/3 to real endpoints — the placeholder API calls in those screens (from April 8) can be swapped for `POST /auth/login`, `POST /auth/register`, `POST /auth/forgot-password` plus the new `GET /auth/me` for navbar avatar/name hydration.

---

## Deferred Items

### Item 1: ~~Auth subsystem (gaps #1–#3, #15–#22)~~ ✅ RESOLVED 2026-04-13

The auth subsystem was originally deferred to its own sprint per the Gate 2 recommendation. It was implemented in full on 2026-04-13. Decisions made:

| Decision           | Choice                          | Rationale                                                                                                                             |
| ------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Token strategy     | JWT access + refresh (rotating) | Stateless verification + revocable refresh tokens with reuse-detection                                                                |
| Password hashing   | bcrypt @ cost 12                | Mature ecosystem; sufficient cost factor for 2026 hardware                                                                            |
| Email provider     | Mailtrap (SMTP via nodemailer)  | Sandbox inbox in dev; provider-agnostic transport so SES/SendGrid swap is config-only                                                 |
| `avatarUrl` source | Stored on User; field nullable  | Cloud bucket upload pending — see [AUTH_IMPLEMENTATION.md §8](../../engineering/AUTH_IMPLEMENTATION.md#8-avatar-cloud-bucket-pending) |

**Schema additions** ([apps/sfi-api/prisma/schema.prisma](../../../apps/sfi-api/prisma/schema.prisma) §8):

- `User` (id, email unique, passwordHash, name, avatarUrl?, role, lastLoginAt, timestamps)
- `RefreshToken` (id = JWT jti, userId, tokenHash sha256, expiresAt, revokedAt, replacedBy chain, userAgent, ipAddress)
- `PasswordResetToken` (id, userId, tokenHash sha256, expiresAt, usedAt)
- `UserRole` enum (ADMIN, USER)

**Migration:** `pnpm --filter @sfi-fea/api db:migrate -- --name add_auth_user_refresh_password_reset`

**Module** at [apps/sfi-api/src/modules/auth/](../../../apps/sfi-api/src/modules/auth/):

- `AuthModule` — registers `JwtAuthGuard` globally via `APP_GUARD`; `@Public()` opts out
- `AuthController` — 7 routes: register, login, refresh, logout, forgot-password, reset-password, me
- `AuthService` — orchestrates all flows
- `TokenService` — JWT signing + refresh rotation + reuse-detection (replay → revoke entire chain)
- `PasswordService` — bcrypt wrapper
- `EmailService` — nodemailer + Mailtrap, falls back to console log when env vars missing
- `JwtStrategy` + `JwtAuthGuard` + `@Public()` + `@CurrentUser()` decorators

**Tests:** [auth.service.spec.ts](../../../apps/sfi-api/src/modules/auth/services/auth.service.spec.ts) — register (happy + 409 conflict), login (happy + 401 paths with timing safety), forgot-password (idempotent Resend + constant-response on unknown email), reset-password (happy + 401 for unknown/used/expired tokens), logout, me.

**Audit log integration:** auth flows emit `CREATED`, `LOGGED_IN`, `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED` against the `User` entity with the actor set to the user's own id.

**Full operator runbook + flow diagrams + Mailtrap setup:** [AUTH_IMPLEMENTATION.md](../../engineering/AUTH_IMPLEMENTATION.md).

### Item 1b: Replace `actor: 'system'` in cross-module audit logs — still deferred

Five existing services still write `actor: 'system'` for their audit log entries (deals, settlement, rules, revenue, participants). Threading `req.user.id` through every service method cascades into every controller signature and every existing test mock. The clean fix is an `AsyncLocalStorage`-backed request context that `AuditLogService.create()` reads transparently — pencilled in for the next refactoring pass. **Not blocking Sprint 1 ship**: the new auth-emitted audit entries already carry the real user id; only the legacy domain entries still say `'system'`.

### Item 2: ~~Audit log metadata convention for Recent Activity (gap #35)~~ ✅ RESOLVED 2026-04-13

The `AuditLogEntryDto.metadata` field is a generic `Record<string, unknown>`, so the BE contract didn't need to change — what was missing was the **convention** for which keys each module passes when calling `auditLog.create()`. Cross-module verification done; metadata gaps closed in [revenue.service.ts](../../../apps/sfi-api/src/modules/revenue/services/revenue.service.ts), [rules.service.ts](../../../apps/sfi-api/src/modules/rules/services/rules.service.ts), and [settlement.service.ts](../../../apps/sfi-api/src/modules/settlement/services/settlement.service.ts) (the latter unblocked by Item 3).

| Entity type     | Required `metadata` keys                                                                                                                             | Status                                                                                                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Deal`          | CREATED: `{ name, status, currency }` · UPDATED/STATUS_CHANGED: `{ previousStatus, newStatus, changedFields, notes? }`                               | ✅ Compliant in [deals.service.ts](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts) (note: `suspendedReason` key renamed to `notes` per gap #39)                                                                       |
| `SettlementRun` | CREATED/PREVIEWED/FINALIZED/CORRECTION_CREATED: `{ runLabel: 'Run #N', runNumber, status or previous/newStatus, totalAllocated?, allocationCount? }` | ✅ Updated in [settlement.service.ts](../../../apps/sfi-api/src/modules/settlement/services/settlement.service.ts) — every audit call now includes `runLabel` + `runNumber` (unblocked by the persistent `runNumber` column from Item 3) |
| `RevenueBatch`  | CREATED/VALIDATED/REJECTED: `{ batchNumber, totalAmount, status or previous/newStatus, reason? }`                                                    | ✅ Updated in [revenue.service.ts](../../../apps/sfi-api/src/modules/revenue/services/revenue.service.ts) — `batchNumber` was missing from VALIDATED + REJECTED, now included                                                            |
| `RuleSnapshot`  | CREATED: `{ version, effectiveFrom, participantCount }`                                                                                              | ✅ Updated in [rules.service.ts](../../../apps/sfi-api/src/modules/rules/services/rules.service.ts) — `effectiveFrom` (ISO string) added                                                                                                 |
| `Participant`   | CREATED: `{ name, role }`                                                                                                                            | ✅ Already compliant in [participants.service.ts](../../../apps/sfi-api/src/modules/participants/services/participants.service.ts) — no change                                                                                           |

The Deal Overview Recent Activity timeline composes display strings on the FE side from these fields. With this convention now uniformly enforced, the FE can render lines like:

- `"Settlement Run #2 finalized"` from `entityType + ' ' + metadata.runLabel + ' ' + action.toLowerCase()`
- `"Revenue Batch RB-2026-003 validated"` from `entityType + ' ' + metadata.batchNumber + ' ' + action.toLowerCase()`
- `"Rule Snapshot v3 created"` from `entityType + ' v' + metadata.version + ' ' + action.toLowerCase()`
- `"Participant 'Sarah Chen' added"` from `entityType + " '" + metadata.name + "' " + (action === 'CREATED' ? 'added' : action.toLowerCase())`

### Item 3: ~~SettlementRun.runNumber column (related to gap #32, #35)~~ ✅ RESOLVED 2026-04-13

Persistent `runNumber: Int` column added to `SettlementRun` so the FE no longer has to derive "Run #N" from list position.

**Schema** ([prisma/schema.prisma](../../../apps/sfi-api/prisma/schema.prisma)):

- `runNumber Int @map("run_number")` on `SettlementRun`
- `@@unique([dealId, runNumber])` constraint

**Migration** ([prisma/migrations/manual/sprint1_rename_notes_and_settlement_run_number.sql](../../../apps/sfi-api/prisma/migrations/manual/sprint1_rename_notes_and_settlement_run_number.sql)):

- Adds the column nullable, backfills via `ROW_NUMBER() OVER (PARTITION BY deal_id ORDER BY created_at)`, then sets NOT NULL and adds the unique constraint — wrapped in a single transaction.

**Race-condition-safe assignment** ([settlement.service.ts](../../../apps/sfi-api/src/modules/settlement/services/settlement.service.ts)):

- `createRun()` and `createCorrectionRun()` both run inside `prisma.$transaction(async (tx) => …)` and start with `SELECT id FROM deals WHERE id = $1::uuid FOR UPDATE` to serialize concurrent run-creation on the same deal. The next `runNumber` is computed by reading the current max within the locked window, so two simultaneous requests can't pick the same number.

**Response shape**: `SettlementRunResponseDto` now exposes both `runNumber: number` and `runLabel: string` (= `"Run #${runNumber}"`). The FE can use either — the pre-formatted label is provided so every consumer renders the same string.

### Item 4: ~~Designer clarification on Suspend flow (gap #39)~~ ✅ RESOLVED 2026-04-13

Designer confirmed: the Suspend Deal confirmation modal **does** include a free-form notes field. To match the FE label exactly and to make the column reusable for any future "deal-level notes" use case, the BE field was renamed:

| Before                                             | After                                    |
| -------------------------------------------------- | ---------------------------------------- |
| `Deal.suspendedReason` (column `suspended_reason`) | `Deal.notes` (column `notes`)            |
| `UpdateDealDto.suspendedReason?: string`           | `UpdateDealDto.notes?: string`           |
| `DealResponseDto.suspendedReason?: string \| null` | `DealResponseDto.notes?: string \| null` |
| Audit metadata key `suspendedReason`               | Audit metadata key `notes`               |

**Behaviour preserved:** the service still auto-clears the `notes` value when status moves out of SUSPENDED (unless the same request explicitly sets new notes). Documented inline in [deals.service.ts](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts) so future contributors don't lose that context.

**Migration:** included in [sprint1_rename_notes_and_settlement_run_number.sql](../../../apps/sfi-api/prisma/migrations/manual/sprint1_rename_notes_and_settlement_run_number.sql) — pure column rename, preserves existing data.

---

## Sign-off

- [x] All non-auth gaps resolved or formally deferred (2026-04-09)
- [x] Decision made on Currency-on-Deal (gap #11 / #28) — added to Deal model with default USD
- [x] ~~Decision made on Auth scope — deferred to dedicated auth sprint~~ — Auth subsystem implemented in full on 2026-04-13
- [x] Gate 2 status communicated to FE lead
- [x] FE execution authorized for FEA-4, FEA-5, FEA-6, FEA-7, FEA-8
- [x] FE execution authorized for FEA-1, FEA-2, FEA-3 — auth endpoints live, swap placeholder calls in the existing auth screens
- [x] ~~Designer confirmation on `suspendedReason` input (gap #39)~~ — confirmed 2026-04-13: Suspend modal includes a notes field; BE column renamed `suspendedReason` → `notes`
- [x] `avatarUrl` source decision — stored field on `User`, nullable, populated by Cloud bucket integration in a follow-up
- [x] `SettlementRun` status `CANCELLED` added to schema (gap #33)
- [x] `SettlementRun.runNumber` persistent column + race-safe assignment (Item 3) shipped 2026-04-13
- [x] Cross-module audit metadata convention (gap #35 / Item 2) verified and patched in revenue/rules/settlement services
- [ ] Prisma migration run on staging DB after merge — combined: `pnpm --filter @sfi-fea/api db:migrate` (covers `sprint1_deal_currency_…` from 04-09, `add_auth_user_refresh_password_reset` from 04-13, plus the manual `sprint1_rename_notes_and_settlement_run_number.sql` SQL script)
- [ ] Mailtrap inbox provisioned for staging — see [AUTH_IMPLEMENTATION.md §7](../../engineering/AUTH_IMPLEMENTATION.md#7-mailtrap-setup-5-minutes)
- [ ] JWT secrets generated and stored in GCP Secret Manager (`JWT_ACCESS_SECRET_STAGING`, `JWT_REFRESH_SECRET_STAGING`)

**Authorized by:** ********\_******** **Date:** ******\_******
