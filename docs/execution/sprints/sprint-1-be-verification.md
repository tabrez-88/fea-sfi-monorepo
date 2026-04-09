# Sprint 1 — MS-1: Shell & Deals — BE Verification

**Sprint Page:** https://www.notion.so/32f76aa2eb4b813290a2d9166ad1354b
**Milestone:** MS-1: Shell & Deals
**Sprint Duration:** March 11 – April 13, 2026
**Verification Date:** 2026-04-08
**Verifier:** tabrez-wellnite (with Claude)
**Overall Status:** 🔴 **BLOCKED — Cannot start FE for Auth screens; Deal Edit + Dashboard need BE work**

---

## Executive Summary

Sprint 1 contains **8 tickets across 3 epics** (Auth, Dashboard, Deals). Backend coverage is uneven:

- **Auth epic (3 tickets):** 🔴 **Zero backend support.** No `auth` module, no `User` model in Prisma, no endpoints. Cannot ship Login / Register / Forgot Password without first building the entire auth subsystem.
- **Dashboard epic (1 ticket):** 🟡 **Partial.** Basic deal listing exists but no aggregated stat endpoints (active deals count, pending reviews, total settled). Frontend can compose stats client-side as a workaround for now.
- **Deals epic (4 tickets):** 🟡 **Partial.** Create / List / Detail are ✅. **Edit Deal is ❌ blocked** — `UpdateDealDto` exists but the controller has no `PATCH /deals/:id` route. Deals List filter/search query params are also missing.

**Bottom line:** out of 8 screens, **3 are fully BE-ready (Create Deal, Deals List read, Deal Overview read)**, **1 is BE-ready with gaps (Dashboard)**, **1 is partially BE-ready (Deals List filter/search missing)**, and **4 are blocked (Edit Deal + 3 Auth screens)**.

---

## Gate 1 — Notion Readiness

| Task ID | Task Name | Notion Status | Pass |
|---------|-----------|---------------|------|
| FEA-1 | Design & Build: Login Page | Design Review | ⚠️ |
| FEA-2 | Design & Build: Register Page | Design Review | ⚠️ |
| FEA-3 | Design & Build: Forgot Password | Design Review | ⚠️ |
| FEA-4 | Design & Build: Global Dashboard | Design Review | ⚠️ |
| FEA-5 | Design & Build: Deals List | Design Review | ⚠️ |
| FEA-6 | Design & Build: Create Deal | Design Review | ⚠️ |
| FEA-7 | Design & Build: Deal Overview | Design Review | ⚠️ |
| FEA-8 | Design & Build: Edit Deal | Design Review | ⚠️ |

**Gate 1 verdict:** ⚠️ **CONDITIONAL PASS** — All 8 tickets are still in `Design Review` in Notion, **but the user has confirmed verbally that designs are approved and the sprint should proceed to BE verification.** Recommended follow-up: bulk-update these tickets to `Ready for dev` in Notion before opening any FE PRs, so the workflow stays auditable.

---

## Gate 2 — Backend Verification

### Ticket FEA-1 — Design & Build: Login Page

**Screen:** 1.1 Login
**Notion:** https://www.notion.so/32f76aa2eb4b81ea8307e80e65e07f2a
**Layout:** Auth Layout

| Method | Path | Status | Implementation | Notes |
|--------|------|--------|----------------|-------|
| POST | /auth/login | ❌ **Missing** | — | No `auth` module exists in [apps/sfi-api/src/modules/](../../../apps/sfi-api/src/modules/). Confirmed via `app.module.ts` imports list. |

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

| Method | Path | Status | Implementation | Notes |
|--------|------|--------|----------------|-------|
| POST | /auth/register | ❌ **Missing** | — | Same root cause as FEA-1: no auth module |

**Gaps for this ticket:**

1. Depends entirely on the auth module being built (see FEA-1 gaps).
2. **Email uniqueness validation** — needs DB-level unique index on `User.email` plus duplicate-email error handling in service.
3. **Password rules** — design spec says min 8 chars; the BE DTO must enforce this with `class-validator`.

---

### Ticket FEA-3 — Design & Build: Forgot Password

**Screen:** 1.3 Forgot Password
**Notion:** https://www.notion.so/32f76aa2eb4b81e6ade9ff61100e749a

| Method | Path | Status | Implementation | Notes |
|--------|------|--------|----------------|-------|
| POST | /auth/forgot-password | ❌ **Missing** | — | Same root cause |

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

| Method | Path | Status | Implementation | Notes |
|--------|------|--------|----------------|-------|
| GET | /deals | ✅ **Ready** | [deals.controller.ts:39](../../../apps/sfi-api/src/modules/deals/controllers/deals.controller.ts#L39) | Returns paginated deals with `meta.total` (covers Total Deals stat) |
| GET | /deals?status=ACTIVE | ⚠️ **Partial** | [deals.service.ts:50](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts#L50) | `findAll` does NOT accept a `status` filter. Cannot derive Active Deals count without it. |
| GET | /deals?sortBy=updatedAt&limit=5 | ✅ **Ready** | [deals.service.ts:51](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts#L51) | `PaginationQueryDto` already supports `sortBy` and `sortOrder` |
| GET | aggregate "Pending Reviews" | ❌ **Missing** | — | No cross-deal endpoint that returns revenue batches with `status=PENDING` and settlement runs with `status=PREVIEWED` in one shot |
| GET | aggregate "Total Settled $" | ❌ **Missing** | — | No endpoint sums `SettlementRun.totalAllocated` across deals |

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

| Method | Path | Status | Implementation | Notes |
|--------|------|--------|----------------|-------|
| GET | /deals | ✅ **Ready** | [deals.controller.ts:39](../../../apps/sfi-api/src/modules/deals/controllers/deals.controller.ts#L39) | Pagination + sort work |
| GET | /deals?status=… | ⚠️ **Partial** | — | Status tabs (All / Active / Draft / Closed) need this filter — not implemented |
| GET | /deals?search=… | ⚠️ **Partial** | — | Search bar needs name filter — not implemented |
| GET | tab counts per status | ❌ **Missing** | — | UI shows `[Active (8)] [Draft (2)] [Closed (2)]` — needs grouped count endpoint |

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

| Method | Path | Status | Implementation | Notes |
|--------|------|--------|----------------|-------|
| POST | /deals | ✅ **Ready** | [deals.controller.ts:26](../../../apps/sfi-api/src/modules/deals/controllers/deals.controller.ts#L26) | Full Prisma write, audit log, returns created deal |

**Field-level checks:** ✅ All match.

| Screen field | DTO field | Match |
|-|-|-|
| Deal Name | `name` (1–255) | ✅ |
| Description | `description` (0–2000) | ✅ |
| Status | `status` (DealStatusDto) | ✅ |
| Effective Date | `effectiveDate` (IsDateString) | ✅ |
| Termination Date | `terminationDate` (optional) | ✅ |
| Metadata | `metadata` (Record) | ✅ |

**Validation note:** Design spec says "Termination Date must be after Effective Date if provided." [`CreateDealDto`](../../../apps/sfi-api/src/modules/deals/dto/index.ts#L22) does **not** enforce this cross-field rule. Minor gap — can be enforced in service layer or with a custom validator. **⚠️ Soft gap.**

**Gaps for this ticket:**

1. **Add cross-field validation** — `terminationDate > effectiveDate` in [deals.service.ts](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts) `create()` method, throw `BadRequestException`. Low effort.

**FEA-6 verdict:** 🟢 **FE-ready.** The single soft gap above can be a follow-up; it doesn't block screen execution.

---

### Ticket FEA-7 — Design & Build: Deal Overview

**Screen:** 3.3 Deal Overview
**Notion:** https://www.notion.so/32f76aa2eb4b8165819bda30b0dce62f
**Layout:** App Layout — Deal Context Mode

| Method | Path | Status | Implementation | Notes |
|--------|------|--------|----------------|-------|
| GET | /deals/:id | ✅ **Ready** | [deals.controller.ts:51](../../../apps/sfi-api/src/modules/deals/controllers/deals.controller.ts#L51) | Returns deal + participants array via Prisma `include` |
| GET | /deals/:dealId/participants | ✅ **Ready** | apps/sfi-api/src/modules/participants/controllers/participants.controller.ts | Confirmed in [ENDPOINT_STATUS.md](../../engineering/ENDPOINT_STATUS.md#2-participants-endpoints) |
| GET | /deals/:dealId/rule-snapshots | ✅ **Ready** | apps/sfi-api/src/modules/rules/controllers/rule-snapshots.controller.ts | Confirmed in ENDPOINT_STATUS.md |
| GET | /deals/:dealId/revenue-batches | ✅ **Ready** | apps/sfi-api/src/modules/revenue/controllers/revenue-batches.controller.ts | Confirmed in ENDPOINT_STATUS.md |
| GET | /deals/:dealId/settlement-runs?limit=1&sortBy=createdAt&sortOrder=desc | ✅ **Ready** | apps/sfi-api/src/modules/settlement/controllers/settlement-runs.controller.ts | Confirmed in ENDPOINT_STATUS.md |
| GET | Recent Activity timeline | ⚠️ **Partial** | [audit-log.controller.ts:28](../../../apps/sfi-api/src/modules/audit-log/controllers/audit-log.controller.ts#L28) | `GET /audit-logs?dealId=…` exists. Need to confirm it returns timestamps + entity names that the timeline UI can render. |

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

| Method | Path | Status | Implementation | Notes |
|--------|------|--------|----------------|-------|
| GET | /deals/:id | ✅ **Ready** | [deals.controller.ts:51](../../../apps/sfi-api/src/modules/deals/controllers/deals.controller.ts#L51) | Used to pre-fill the form |
| PATCH | /deals/:id | ❌ **MISSING** | — | **Hard blocker.** `UpdateDealDto` exists at [dto/index.ts:54](../../../apps/sfi-api/src/modules/deals/dto/index.ts#L54), but neither the controller nor the service has any update method. |

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

| Ticket | Screen | BE Status | Verdict |
|--------|--------|-----------|---------|
| FEA-1 | Login | ❌ Missing | 🔴 Blocked — no auth module |
| FEA-2 | Register | ❌ Missing | 🔴 Blocked — no auth module |
| FEA-3 | Forgot Password | ❌ Missing | 🔴 Blocked — no auth module + no email |
| FEA-4 | Global Dashboard | ⚠️ Partial | 🟡 Workaround possible |
| FEA-5 | Deals List | ⚠️ Partial | 🟡 Workaround possible (no filter/search) |
| FEA-6 | Create Deal | ✅ Ready | 🟢 Go |
| FEA-7 | Deal Overview | ⚠️ Partial | 🟡 Workaround possible |
| FEA-8 | Edit Deal | ❌ Missing | 🔴 Blocked — no PATCH route |

**Tickets fully ready (🟢):** 1 / 8 — FEA-6
**Tickets ready with gaps (🟡):** 3 / 8 — FEA-4, FEA-5, FEA-7
**Tickets blocked (🔴):** 4 / 8 — FEA-1, FEA-2, FEA-3, FEA-8

---

## Consolidated Gap List

| # | Gap | Type | Blocks | Suggested owner |
|---|-----|------|--------|-----------------|
| 1 | No `AuthModule` exists | Missing module | FEA-1, FEA-2, FEA-3 | BE |
| 2 | No `User` model in Prisma schema | Missing DB | FEA-1, FEA-2, FEA-3 | BE |
| 3 | No `PasswordResetToken` model + email provider | Missing DB + infra | FEA-3 | BE + DevOps |
| 4 | `PATCH /deals/:id` route + service method | Missing route | FEA-8 | BE — small |
| 5 | `GET /deals` lacks `status` query param | Missing filter | FEA-4, FEA-5 | BE — small |
| 6 | `GET /deals` lacks `search` query param | Missing filter | FEA-5 | BE — small |
| 7 | No deal status counts endpoint | Missing aggregate | FEA-5 | BE — small |
| 8 | No dashboard summary endpoint | Missing aggregate | FEA-4 | BE — medium |
| 9 | No dashboard pending-reviews aggregate | Missing aggregate | FEA-4 | BE — medium |
| 10 | `DealResponseDto` missing `_count` block (participants/snapshots/revenue/settlements) | Missing fields | FEA-4, FEA-5, FEA-7 | BE — small |
| 11 | `Deal` model has no `currency` field but design shows it | Schema vs design mismatch | FEA-4, FEA-5 | Design + BE |
| 12 | `CreateDealDto` does not enforce `terminationDate > effectiveDate` | Soft validation gap | FEA-6 | BE — trivial |
| 13 | Deal Overview "Total Revenue" sum is not exposed by any endpoint | Missing aggregate | FEA-7 | BE — small |
| 14 | `AuditLogEntryDto` shape vs Recent Activity timeline UI not yet confirmed | Verification only | FEA-7 | BE — verify |

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

## Sign-off

- [ ] All gaps have a Notion follow-up ticket (TBD)
- [ ] Decision made on Currency-on-Deal (gap #11)
- [ ] Decision made on Auth scope (Sprint 1 vs separate sprint)
- [ ] Gate 2 status communicated to FE lead
- [ ] FE execution authorized to begin for the 🟢 / 🟡 tickets

**Authorized by:** _________________  **Date:** _____________
