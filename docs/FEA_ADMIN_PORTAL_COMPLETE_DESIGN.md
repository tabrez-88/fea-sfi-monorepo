# FEA Admin Portal — Complete Design Concept

**Purpose:** Full design blueprint for the FEA Admin Console with integrated SFI settlement module
**Context:** "Admin" = Deal/Project Owner who manages deals, participants, revenue, and settlements. Can own multiple deals/projects.
**Date:** March 2026
**Supersedes:** `SFI_ADMIN_PORTAL_DESIGN_CONCEPT.md` (now a subset of this document)

---

## 1. Portal Overview

The FEA Admin Portal is a **single web application** for deal owners to manage their entertainment deals end-to-end: from deal creation, through revenue intake, to automated settlement computation and financial reporting.

```
FEA Admin Portal
│
├── Global: Auth (Login/Register), Top Navbar, Notifications
│
├── Dashboard ──────────── At-a-glance overview of all deals
├── Deals ──────────────── CRUD for deals/projects
│   ├── Active Deals
│   ├── Draft Deals
│   └── Closed/Archived
├── Settlement ─────────── SFI core (cross-deal + per-deal deep dive)
│   ├── All Settlements (across all deals)
│   ├── Pending Reviews (approvals queue)
│   └── Per-Deal Settlement (rules, revenue, runs, ledger)
├── Transactions ───────── Revenue & financial tracking
│   ├── Revenue Batches (cross-deal)
│   ├── Ledger
│   └── Financial Reports
├── Users & Roles ──────── Team management + RBAC
└── Audit Log ──────────── System-wide activity tracking
```

---

## 2. Milestone-to-Screen Mapping

This design covers all features delivered across Milestones 2A, 2B, 2C, and 3.

### Milestone 2A — Core Settlement Computation Engine

| Feature | Screen(s) | Status |
|---------|-----------|--------|
| Recoup logic with caps | E10 (Settlement Run Detail — Phase 3 breakdown) | ✅ BE + Design |
| Multi-tier waterfall | E10 (4-phase waterfall visualization) | ✅ BE + Design |
| Carry-forward balances | E10 (recoupment balance tracking), F5 (Recoupment Report) | ✅ BE, ⚠️ Design expanded |
| Multiple revenue batches | E11 (Create Settlement — multi-batch select) | ✅ BE + Design |
| Deterministic outputs | J1 (Proof hash verification) | ✅ BE + Design |

### Milestone 2B — Rule Snapshots & Revenue Structures

| Feature | Screen(s) | Status |
|---------|-----------|--------|
| Rule snapshot model (immutable) | E3 (List), E4 (Detail + ruleSummary), E5 (Create) | ✅ BE + Design |
| Revenue batch structure & validation | E6 (List), E7 (Detail + validate/reject), E8 (Create) | ✅ BE + Design |
| Revenue → Rule → Engine binding | E11 (Create Settlement — select rule + batches) | ✅ BE + Design |
| Rule versioning + effective dating | E3 (version list with effective dates) | ✅ BE + Design |

### Milestone 2C — Settlement Runs & Result Storage

| Feature | Screen(s) | Status |
|---------|-----------|--------|
| Settlement run lifecycle (Create → Preview → Finalize) | E10 (lifecycle stepper + actions) | ✅ BE, ⚠️ Design expanded below |
| Persisted allocation results | E10 (allocation breakdown by phase) | ✅ BE + Design |
| Settlement metadata & versioning | E10 (metadata panel), E9 (run list with versioning) | ✅ BE, ⚠️ Design expanded |
| Re-run safely without altering history | E10 (re-preview action), E12a (Correction detail) | ✅ BE, ⚠️ Design expanded |

### Milestone 3 — Financial Ledger, Audit System & Settlement Verification

| Feature | Screen(s) | Status |
|---------|-----------|--------|
| Double-entry financial ledger | F2 (Ledger Overview), F3 (Journal Detail) | ✅ BE + Design |
| Journal entries (debit/credit) | F3 (posting-level debit/credit table) | ✅ BE + Design |
| Participant balance tracking | F4 (Participant Ledger), F5 (Recoupment Report) | ✅ BE, ⚠️ Design expanded |
| Settlement proof hashes | J1 (Proof & Audit Trail) | ✅ BE + Design |
| Settlement verification (re-compute & compare) | J1 (Verify Integrity action) | ✅ BE, ⚠️ Design expanded |
| Evidence linking (revenue → payout) | J1 (Audit Trace visualization) | ✅ BE, ⚠️ Design NEW |
| Correction settlements | E12 (Create Correction), E12a (Correction Detail) | ✅ BE, ⚠️ Design NEW |
| Reversal accounting entries | F3a (Correction Journal — reversal postings) | ✅ BE, ⚠️ Design NEW |
| Historical correction tracking | J1 (Correction Chain visualization) | ✅ BE, ⚠️ Design expanded |
| Participant payout history | F4 (Participant Ledger), F6 (Participant Statement) | ✅ BE, ⚠️ Design NEW |
| Settlement records retrieval | E1 (All Settlements), E10 (Detail) | ✅ BE + Design |
| Audit tracing support | J1 (full trace), I1 (Audit Log) | ⚠️ J1=BE ready, I1=needs BE |
| Financial reporting data access | F5 (Recoupment Report), F6 (Participant Statement), F7 (Settlement Summary) | ⚠️ Design NEW, BE partial |

---

## 3. Navigation Structure

### Top Navbar

```
┌──────────────────────────────────────────────────────────────────────────┐
│  FEA Logo    Dashboard │ Deals │ Settlement │ Transactions │ Audit Log  │
│                                                    [🔔 3] [👤 John ▼]  │
└──────────────────────────────────────────────────────────────────────────┘
```

| Nav Item | Sub-items | Description |
|----------|-----------|-------------|
| **Dashboard** | — | Global overview: stats, recent activity, alerts |
| **Deals** | Active / Draft / Closed | Deal CRUD + participants management |
| **Settlement** | All Runs / Pending Reviews / Per-Deal | SFI core — rules, revenue, runs, ledger, proof |
| **Transactions** | Revenue / Ledger / Reports | Cross-deal financial tracking + reporting |
| **Audit Log** | — | System-wide who-did-what tracking |
| **🔔 Notifications** | — | Bell icon with unread count |
| **👤 Profile** | Profile / Team / Settings / Logout | User menu dropdown |

### Secondary Navigation (inside a deal)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← All Deals    "The Last Horizon"                        Status: ACTIVE │
├──────────────────────────────────────────────────────────────────────────┤
│  Overview │ Participants │ Rules │ Revenue │ Settlements │ Ledger │ Docs │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Complete Screen Map

### Section A: Authentication (3 screens)

| # | Screen | Type | BE Status |
|---|--------|------|-----------|
| A1 | Login | Form | ❌ NOT BUILT |
| A2 | Register / Invite Accept | Form | ❌ NOT BUILT |
| A3 | Forgot Password | Form | ❌ NOT BUILT |

### Section B: Dashboard (1 screen)

| # | Screen | Type | BE Status |
|---|--------|------|-----------|
| B1 | Global Dashboard | Read-only | ⚠️ PARTIAL — aggregatable from existing endpoints |

### Section C: Deals (5 screens)

| # | Screen | Type | BE Status |
|---|--------|------|-----------|
| C1 | Deals List (tabs: Active/Draft/Closed) | List + Filter | ✅ GET /deals |
| C2 | Create Deal | Form | ✅ POST /deals |
| C3 | Deal Overview (per-deal dashboard) | Read | ✅ GET /deals/:id |
| C4 | Edit Deal (modal) | Form | ❌ no PATCH /deals/:id |
| C5 | Deal Status Transitions | Actions on C3 | ❌ no status transition endpoints |

### Section D: Participants (3 screens)

| # | Screen | Type | BE Status |
|---|--------|------|-----------|
| D1 | Participants List (per deal) | List | ✅ |
| D2 | Add Participant (modal) | Form | ✅ |
| D3 | Participant Detail (drawer) | Read | ⚠️ PARTIAL |

### Section E: Settlement — SFI Core (14 screens)

| # | Screen | Type | Milestone | BE Status |
|---|--------|------|-----------|-----------|
| E1 | All Settlements (cross-deal) | List + Filter | — | ❌ no global listing |
| E2 | Pending Reviews / Approval Queue | List + Actions | — | ❌ no approval model |
| E3 | Rule Snapshots List (per deal) | List | 2B | ✅ |
| E4 | Rule Snapshot Detail (ruleSummary) | Read | 2B | ✅ |
| E5 | Create Rule Snapshot (multi-step) | Form | 2B | ✅ |
| E6 | Revenue Batches List (per deal) | List + Filter | 2B | ✅ |
| E7 | Revenue Batch Detail (validate/reject) | Read + Actions | 2B | ✅ |
| E8 | Create Revenue Batch | Form | 2B | ✅ |
| E9 | Settlement Runs List (per deal) | List | 2C | ✅ |
| E10 | Settlement Run Detail (lifecycle + waterfall) | Read + Actions | 2C/3 | ✅ |
| E11 | Create Settlement Run | Form | 2C | ✅ |
| E12 | Create Correction Run | Form | 3 | ✅ |
| E12a | **Correction Detail (reversal view)** | Read | 3 | ✅ **NEW** |
| E13 | **Settlement Comparison (original vs correction)** | Read | 3 | ✅ **NEW** |

### Section F: Transactions & Financial Reports (8 screens)

| # | Screen | Type | Milestone | BE Status |
|---|--------|------|-----------|-----------|
| F1 | Revenue Batches (cross-deal) | List + Filter | — | ❌ no global listing |
| F2 | Ledger Overview (per deal) | List | 3 | ✅ |
| F3 | Journal Detail (debit/credit postings) | Read | 3 | ✅ |
| F3a | **Correction Journal (reversal entries)** | Read | 3 | ✅ **NEW** |
| F4 | Participant Ledger (per participant) | Read | 3 | ✅ |
| F5 | **Recoupment Status Report** | Read | 2A/3 | ✅ **NEW** (data from settlement allocations) |
| F6 | **Participant Statement** | Read + Export | 3 | ⚠️ **NEW** (data exists, needs export endpoint) |
| F7 | **Settlement Summary Report** | Read | 3 | ⚠️ **NEW** (data exists, needs aggregation) |

### Section G: Documents (2 screens)

| # | Screen | Type | BE Status |
|---|--------|------|-----------|
| G1 | Documents List (per deal) | List + Filter | ✅ |
| G2 | Upload Document (modal) | Form | ✅ |

### Section H: Users & Roles (3 screens)

| # | Screen | Type | BE Status |
|---|--------|------|-----------|
| H1 | Team Members List | List | ❌ NOT BUILT |
| H2 | Invite Member (modal) | Form | ❌ NOT BUILT |
| H3 | Role & Permissions | Settings | ❌ NOT BUILT |

### Section I: Audit Log (2 screens)

| # | Screen | Type | BE Status |
|---|--------|------|-----------|
| I1 | Audit Log List (filterable) | List | ❌ NOT BUILT |
| I2 | Audit Entry Detail | Read | ❌ NOT BUILT |

### Section J: Proof & Verification (1 screen, expanded)

| # | Screen | Type | Milestone | BE Status |
|---|--------|------|-----------|-----------|
| J1 | Proof, Verification & Audit Trace | Read + Actions | 3 | ✅ (expanded) |

---

## 5. Screen Count Summary

| Section | Screens | BE Ready | BE Needed |
|---------|---------|----------|-----------|
| A. Auth | 3 | 0 | 3 |
| B. Dashboard | 1 | 0 (partial) | 1 |
| C. Deals | 5 | 2 | 3 |
| D. Participants | 3 | 2 | 1 |
| E. Settlement (SFI) | 14 | 11 | 3 |
| F. Transactions & Reports | 8 | 5 | 3 |
| G. Documents | 2 | 2 | 0 |
| H. Users & Roles | 3 | 0 | 3 |
| I. Audit Log | 2 | 0 | 2 |
| J. Proof & Verification | 1 | 1 | 0 |
| **Total** | **42** | **23 (55%)** | **19 (45%)** |

---

## 6. Screen-by-Screen Specification

---

### A1: Login

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    FEA Admin Console                    │
│              Settlement & Financial Infrastructure      │
│                                                         │
│            ┌─────────────────────────────┐              │
│            │ Email                        │              │
│            ├─────────────────────────────┤              │
│            │ Password                     │              │
│            ├─────────────────────────────┤              │
│            │ [       Sign In            ] │              │
│            └─────────────────────────────┘              │
│                                                         │
│            Forgot password?                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**BE Required:**
- POST `/auth/login` → JWT access + refresh tokens
- POST `/auth/refresh` → token rotation
- POST `/auth/logout` → invalidate tokens
- User model with email, hashedPassword, role, status

---

### B1: Global Dashboard

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Dashboard                                                   Mar 10, 2026│
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ 8          │  │ 5          │  │ 3          │  │ $425M      │        │
│  │ Total Deals│  │ Active     │  │ Pending    │  │ Total      │        │
│  │            │  │ Deals      │  │ Reviews    │  │ Settled    │        │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘        │
│                                                                          │
│  ┌─ Pending Actions ─────────────────────────────────────────────────┐  │
│  │  ⚠ 2 Revenue Batches awaiting validation          [Review All →] │  │
│  │  ⚠ 1 Settlement awaiting finalization              [Review All →] │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─ Active Deals ──────────────────┐  ┌─ Settlement Pipeline ────────┐ │
│  │  Deal            │ Revenue      │  │                               │ │
│  │  ─────────────────────────────  │  │  DRAFT(2) → PREVIEW(1) →     │ │
│  │  The Last Horizon │ $200M       │  │  FINALIZED(12)               │ │
│  │  Echoes of Tmrw   │ $75M        │  │  ████  ██  ████████████████  │ │
│  │  Rise of Legends  │ $120M       │  │                               │ │
│  │  [View All →]                   │  │  Total Settled: $425,000,000 │ │
│  └─────────────────────────────────┘  └───────────────────────────────┘ │
│                                                                          │
│  ┌─ Recent Activity ─────────────────────────────────────────────────┐  │
│  │ Today     Revenue Batch RB-2026-004 created — "The Last Horizon" │  │
│  │ Yesterday Settlement Run #2 finalized — "Echoes of Tomorrow"     │  │
│  │ Mar 8     Rule Snapshot v3 created — "The Last Horizon"          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**BE:** ⚠️ Can aggregate from existing per-deal endpoints. Optimal: dedicated GET `/dashboard/summary`.

---

### C1–C5: Deals

Refer to previous version — no changes needed. Summary:
- **C1:** Deals List with status tabs ✅
- **C2:** Create Deal form ✅
- **C3:** Deal Overview (per-deal dashboard) ✅
- **C4:** Edit Deal modal ❌ needs PATCH `/deals/:id`
- **C5:** Status transitions (buttons on C3) ❌ needs status endpoints

---

### D1–D3: Participants

Refer to previous version — no changes needed. Summary:
- **D1:** Participants List ✅
- **D2:** Add Participant modal ✅
- **D3:** Participant Detail drawer ⚠️

---

### E1: All Settlements (Cross-Deal)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  All Settlements                                                         │
├──────────────────────────────────────────────────────────────────────────┤
│  [All (15)] [Draft (2)] [Previewed (1)] [Finalized (12)] [Voided (0)]   │
│  🔍 Search    Deal: [All ▼]    Type: [All ▼]    📅 Date Range           │
│                                                                          │
│  Deal                   │ Run # │ Type       │ Amount       │ Status     │
│  ─────────────────────────────────────────────────────────────────────── │
│  The Last Horizon        │ #3   │ CORRECTION │ $5,000,000   │ 🟢FINAL   │
│  The Last Horizon        │ #2   │ NORMAL     │ $200,000,000 │ 🟢FINAL   │
│  Echoes of Tomorrow      │ #2   │ NORMAL     │ $75,000,000  │ 🟡PREVIEW │
│  Midnight Protocol       │ #1   │ NORMAL     │ —            │ ⚪DRAFT   │
│                                                                          │
│  [Run #3 corrects Run #2 — linked]                                       │
│  ◄ 1 of 2 ►                                                             │
└──────────────────────────────────────────────────────────────────────────┘
```

**BE Needed:** GET `/settlement-runs` (global, without dealId) ❌

---

### E2: Pending Reviews

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Pending Reviews (3)                                                     │
├──────────────────────────────────────────────────────────────────────────┤
│  [Revenue Batches (2)] [Settlements (1)]                                 │
│                                                                          │
│  ┌─ Revenue Batches Awaiting Validation ─────────────────────────────┐  │
│  │  Batch       │ Deal               │ Amount      │ Submitted       │  │
│  │  RB-2026-004 │ The Last Horizon   │ $50,000,000 │ Mar 8, 2026    │  │
│  │  RB-2026-007 │ Echoes of Tomorrow │ $12,000,000 │ Mar 9, 2026    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─ Settlements Awaiting Finalization ───────────────────────────────┐  │
│  │  Deal               │ Run # │ Total       │ Previewed On          │  │
│  │  Echoes of Tomorrow │ #2    │ $75,000,000 │ Mar 9, 2026           │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**BE Needed:** Cross-deal GET `/revenue-batches?status=PENDING` and GET `/settlement-runs?status=PREVIEWED` ❌

---

### E3–E8: Rules & Revenue (per deal)

Refer to `SFI_ADMIN_PORTAL_DESIGN_CONCEPT.md` for full wireframes. All ✅ BE ready.

- **E3:** Rule Snapshots List (version history with effective dates)
- **E4:** Rule Snapshot Detail (ruleSummary, frozen terms, warnings, bar chart)
- **E5:** Create Rule Snapshot (3-step form with live validation)
- **E6:** Revenue Batches List (status badges, filter tabs, total)
- **E7:** Revenue Batch Detail (metadata, documents, validate/reject actions)
- **E8:** Create Revenue Batch (amount, period, currency, line items)

---

### E9: Settlement Runs List (per deal)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Settlement Runs — "The Last Horizon"                [+ New Settlement]  │
├──────────────────────────────────────────────────────────────────────────┤
│  [All (4)] [Draft (1)] [Previewed (0)] [Finalized (2)] [Voided (1)]     │
│                                                                          │
│  # │ Type       │ Rule │ Batches │ Revenue      │ Allocated    │ Status  │
│  ──────────────────────────────────────────────────────────────────────  │
│  4 │ NORMAL     │ v3   │ 1       │ $50,000,000  │ —            │ ⚪DRAFT │
│  3 │ CORRECTION │ v3   │ 1       │ $5,000,000   │ $5,000,000   │ 🟢FINAL│
│  2 │ NORMAL     │ v3   │ 2       │ $200,000,000 │ $200,000,000 │ 🟢FINAL│
│  1 │ NORMAL     │ v1   │ 1       │ $25,000,000  │ $25,000,000  │ 🔴VOID │
│                                                                          │
│  ┌─ Correction Chain ───────────────────────────────────────────────┐   │
│  │  Run #2 (NORMAL) ──→ Run #3 (CORRECTION)                        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ◄ 1 of 1 ►                                                             │
└──────────────────────────────────────────────────────────────────────────┘
```

**Key (Milestone 2C):** Shows correction chain inline. Type badge distinguishes NORMAL vs CORRECTION. Revenue and Allocated columns make it clear what went in and what came out.

---

### E10: Settlement Run Detail ⭐ (Milestone 2C + 3 core screen)

**Purpose:** The most important screen. Full settlement lifecycle visualization with 4-phase waterfall breakdown, proof verification, and action controls.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Settlements    Settlement Run #2                                      │
│  Type: NORMAL │ Rule Snapshot: v3 │ Created: Mar 5, 2026                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─ Lifecycle ──────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │   ● DRAFT ──────── ● PREVIEWED ──────── ● FINALIZED             │   │
│  │   Created           Computed              Locked                  │   │
│  │   Mar 5, 10:00      Mar 5, 14:00          Mar 5, 16:30           │   │
│  │                                            ▲ current              │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Summary ────────────────────────────────────────────────────────┐   │
│  │  Total Revenue     │ Total Allocated   │ Batches │ Participants  │   │
│  │  $200,000,000      │ $200,000,000      │ 2       │ 5             │   │
│  │  Currency: USD      │ Variance: $0 ✓   │         │               │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Phase 1: Gross Receipts ────────────────────────────────────────┐   │
│  │  Revenue Batch       │ Period         │ Amount                    │   │
│  │  RB-2026-002          │ Apr–Jun 2026   │ $50,000,000              │   │
│  │  RB-2026-003          │ Jul–Sep 2026   │ $150,000,000             │   │
│  │  ─────────────────────────────────────────────────────            │   │
│  │  Total Gross Receipts: $200,000,000                               │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Phase 2: Distribution Fees ─────────────────────────────────────┐   │
│  │  Participant             │ Fee %  │ Amount       │ Calculation    │   │
│  │  Global Cinema Partners  │ 12%    │ $24,000,000  │ 12% × $200M   │   │
│  │  ──────────────────────────────────────────────────────────       │   │
│  │  Total Fees: $24,000,000    Remaining: $176,000,000               │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Phase 3: Recoupment (priority waterfall) ───────────────────────┐   │
│  │                                                                   │   │
│  │  Pri │ Participant            │ Cap        │ Prev    │ This Run  │   │
│  │  ──────────────────────────────────────────────────────────────── │   │
│  │  1   │ Horizon Ventures Fund  │ $45,000,000│ $0      │$45,000,000│   │
│  │      │ ██████████████████████████████████████████ 100% RECOUPED  │   │
│  │      │ Remaining to recoup: $0                                    │   │
│  │  2   │ Pacific Capital Group  │ $25,000,000│ $0      │$25,000,000│   │
│  │      │ ██████████████████████████████████████████ 100% RECOUPED  │   │
│  │      │ Remaining to recoup: $0                                    │   │
│  │  ──────────────────────────────────────────────────────────────── │   │
│  │  Total Recouped: $70,000,000    Remaining: $106,000,000           │   │
│  │                                                                   │   │
│  │  ┌─ Carry-Forward Note ─────────────────────────────────────┐    │   │
│  │  │ All investors fully recouped in this run.                 │    │   │
│  │  │ If partially recouped, balance carries to next settlement.│    │   │
│  │  └──────────────────────────────────────────────────────────┘    │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Phase 4: Net Profit Split ──────────────────────────────────────┐   │
│  │  Participant             │ %    │ Amount       │ Bar              │   │
│  │  Zenith Pictures         │ 65%  │ $68,900,000  │ ████████████████ │   │
│  │  Horizon Ventures Fund   │ 15%  │ $15,900,000  │ ████             │   │
│  │  Pacific Capital Group   │ 12%  │ $12,720,000  │ ███              │   │
│  │  Sarah Chen              │ 8%   │ $8,480,000   │ ██               │   │
│  │  ──────────────────────────────────────────────────────────       │   │
│  │  Total: 100%               $106,000,000                           │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Total Payout Summary ───────────────────────────────────────────┐   │
│  │  Party              │ Dist Fee    │ Recoup     │ Net Profit │Total│   │
│  │  Global Cinema      │ $24,000,000 │ —          │ —          │ $24M│   │
│  │  Horizon Ventures   │ —           │ $45,000,000│ $15,900,000│ $61M│   │
│  │  Pacific Capital    │ —           │ $25,000,000│ $12,720,000│ $38M│   │
│  │  Zenith Pictures    │ —           │ —          │ $68,900,000│ $69M│   │
│  │  Sarah Chen         │ —           │ —          │ $8,480,000 │ $8M │   │
│  │  TOTAL              │ $24M        │ $70M       │ $106M      │$200M│   │
│  │                                                           ✓ Balanced│   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Proof Record (Milestone 3) ─────────────────────────────────────┐   │
│  │  Hash: sha256:a3f8b2c9d1e4f567890abcdef1234567890abcdef          │   │
│  │  Algorithm: SHA-256                                               │   │
│  │  Computed: Mar 5, 2026 16:30:00 UTC                               │   │
│  │  Input: Rule v3 × 2 batches × 5 participants = $200M             │   │
│  │                                                                   │   │
│  │  [📋 Copy Hash]  [🔍 Verify Integrity]  [📄 View Ledger Journal] │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Settlement Metadata ────────────────────────────────────────────┐   │
│  │  Run ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890                    │   │
│  │  Created: Mar 5, 2026 10:00   │  Previewed: Mar 5, 14:00         │   │
│  │  Finalized: Mar 5, 16:30      │  Executed By: John Admin         │   │
│  │  Notes: "Final settlement for Q1-Q3 2026 revenue"                 │   │
│  │  Correction: This run has 1 correction → Run #3 [View →]         │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Actions ────────────────────────────────────────────────────────┐   │
│  │ Status: FINALIZED                                                 │   │
│  │ [Create Correction Run]  [View Ledger Journal]  [Download Report] │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Lifecycle Stepper (Milestone 2C):**
Shows exactly where the settlement is in its lifecycle with timestamps:
- ⚪ DRAFT → ⚪ PREVIEWED → ⚪ FINALIZED
- Each step shows when it happened
- Current step highlighted

**Action Buttons by Status (Milestone 2C):**

| Status | Available Actions |
|--------|-------------------|
| DRAFT | [▶ Preview Settlement] |
| PREVIEWED | [🔒 Finalize Settlement] [↻ Re-Preview] |
| FINALIZED | [Create Correction Run] [View Ledger] [Download Report] |
| VOIDED | No actions (read-only) |

**Re-Preview (Milestone 2C):** When PREVIEWED, user can re-preview to recalculate without altering history. The old preview is overwritten (only finalized results are immutable).

**Finalize Confirmation Modal:**
```
┌─────────────────────────────────────────────────┐
│  ⚠ Finalize Settlement Run #2?                 │
│                                                  │
│  This action is IRREVERSIBLE. Once finalized:    │
│                                                  │
│  • Allocations permanently locked                │
│  • Ledger journal + postings created             │
│  • Revenue batches marked PROCESSED              │
│  • SHA-256 proof hash generated                  │
│  • To make changes, create a Correction Run      │
│                                                  │
│  Total: $200,000,000 → 5 participants            │
│                                                  │
│              [Cancel]    [Finalize ✓]            │
└─────────────────────────────────────────────────┘
```

---

### E11: Create Settlement Run

```
┌──────────────────────────────────────────────────────────────────────────┐
│  New Settlement Run — "The Last Horizon"                                 │
│  ──────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  Rule Snapshot *:                                                        │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ ● v3 (Mar 1, 2026 — Present) — 5 participants, 12% dist. fee     │  │
│  │ ○ v2 (Feb 15 — Mar 1) — CLOSED                                   │  │
│  │ ○ v1 (Feb 1 — Feb 15) — CLOSED                                   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Revenue Batches * (only VALIDATED batches selectable):                   │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ ☑ RB-2026-004 │ $50,000,000  │ Oct–Dec 2026 │ 🟢VALIDATED       │  │
│  │ ☐ RB-2026-003 │ $75,000,000  │ Jul–Sep 2026 │ 🔵PROCESSED (used)│  │
│  │ ☐ RB-2026-002 │ $50,000,000  │ Apr–Jun 2026 │ 🔵PROCESSED (used)│  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Selected: 1 batch │ Total Revenue: $50,000,000                          │
│                                                                          │
│  Notes: [                                                         ]      │
│                                                                          │
│                                   [Cancel]  [Create Settlement Run]      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### E12: Create Correction Run (Milestone 3)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Create Correction Run                                                   │
│  Correcting: Settlement Run #2 (FINALIZED — $200,000,000)               │
│  ──────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  ⚠ This creates a NEW settlement run of type CORRECTION.                │
│    The original Run #2 will NOT be modified.                             │
│    The correction will generate its own ledger entries.                  │
│                                                                          │
│  Rule Snapshot *:                                                        │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ ● v3 (same as original)                                           │  │
│  │ ○ v4 (use updated rules — if available)                           │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Revenue Batches * (select corrected/additional batches):                │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ ☑ RB-2026-005 │ $5,000,000 │ Correction batch │ 🟢VALIDATED      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Correction Reason *:                                                    │
│  [Revenue amount for Q3 Netflix was reported incorrectly.          ]     │
│  [Correction adds the $5M adjustment batch.                        ]     │
│                                                                          │
│                               [Cancel]  [Create Correction Run]          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### E12a: Correction Detail ⭐ NEW (Milestone 3)

**Purpose:** View a correction settlement alongside the original, showing what changed and the reversal accounting impact.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Settlements    Correction Run #3                                      │
│  Corrects: Run #2 │ Type: CORRECTION │ Status: FINALIZED                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─ Correction Context ─────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  Original Run: #2 (FINALIZED Mar 5)    │ This Correction: #3     │   │
│  │  Revenue: $200,000,000                  │ Revenue: $5,000,000     │   │
│  │  Rule: v3                               │ Rule: v3                │   │
│  │  Participants: 5                        │ Participants: 5         │   │
│  │                                                                   │   │
│  │  Reason: "Revenue amount for Q3 Netflix was reported incorrectly. │   │
│  │  Correction adds the $5M adjustment batch."                       │   │
│  │                                                                   │   │
│  │  [View Original Run #2 →]     [Compare Side-by-Side →]            │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Correction Allocations (same 4-phase waterfall) ────────────────┐   │
│  │  Phase 1: Gross Receipts → $5,000,000                            │   │
│  │  Phase 2: Distribution Fees → $600,000 (12% × $5M)               │   │
│  │  Phase 3: Recoupment → $0 (all investors already fully recouped) │   │
│  │  Phase 4: Net Profit → $4,400,000                                │   │
│  │    Zenith Pictures: $2,860,000 (65%)                              │   │
│  │    Horizon Ventures: $660,000 (15%)                               │   │
│  │    Pacific Capital: $528,000 (12%)                                │   │
│  │    Sarah Chen: $352,000 (8%)                                      │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Correction Ledger Journal ──────────────────────────────────────┐   │
│  │  Journal: JRN-2026-00003                                         │   │
│  │  This journal contains ONLY the correction entries.               │   │
│  │  Original entries in JRN-2026-00002 remain unchanged.             │   │
│  │                                                                   │   │
│  │  Account         │ Participant        │ Debit     │ Credit        │   │
│  │  1000-REVENUE    │ —                  │ —         │ $5,000,000    │   │
│  │  2100-PAYABLE    │ Global Cinema      │ $600,000  │ —             │   │
│  │  2100-PAYABLE    │ Zenith Pictures    │ $2,860,000│ —             │   │
│  │  2100-PAYABLE    │ Horizon Ventures   │ $660,000  │ —             │   │
│  │  2100-PAYABLE    │ Pacific Capital    │ $528,000  │ —             │   │
│  │  2100-PAYABLE    │ Sarah Chen         │ $352,000  │ —             │   │
│  │  TOTAL           │                    │ $5,000,000│ $5,000,000    │   │
│  │                                                      ✓ Balanced   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Correction Chain ──────────────────────────────────────────────┐    │
│  │  Run #2 (NORMAL, $200M) ──→ Run #3 (CORRECTION, $5M)           │    │
│  │  ● Original                  ● This correction                  │    │
│  │                                                                  │    │
│  │  Combined Total: $205,000,000                                    │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### E13: Settlement Comparison ⭐ NEW (Milestone 3)

**Purpose:** Side-by-side comparison of original vs correction, or any two settlement runs.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Settlement Comparison                                                   │
│  Original Run #2 vs Correction Run #3                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─ Run #2 (Original) ─────────┐  ┌─ Run #3 (Correction) ──────────┐  │
│  │ Revenue: $200,000,000        │  │ Revenue: $5,000,000             │  │
│  │ Status: FINALIZED            │  │ Status: FINALIZED               │  │
│  │ Finalized: Mar 5             │  │ Finalized: Mar 7                │  │
│  └──────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                          │
│  ┌─ Per-Participant Payout Comparison ──────────────────────────────┐   │
│  │                                                                   │   │
│  │  Participant          │ Original     │ Correction │ Combined      │   │
│  │  ─────────────────────────────────────────────────────────────── │   │
│  │  Global Cinema        │ $24,000,000  │ $600,000   │ $24,600,000  │   │
│  │  Horizon Ventures     │ $60,900,000  │ $660,000   │ $61,560,000  │   │
│  │  Pacific Capital      │ $37,720,000  │ $528,000   │ $38,248,000  │   │
│  │  Zenith Pictures      │ $68,900,000  │ $2,860,000 │ $71,760,000  │   │
│  │  Sarah Chen           │ $8,480,000   │ $352,000   │ $8,832,000   │   │
│  │  ─────────────────────────────────────────────────────────────── │   │
│  │  TOTAL                │ $200,000,000 │ $5,000,000 │ $205,000,000 │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Ledger Impact ──────────────────────────────────────────────────┐   │
│  │  Original Journal: JRN-2026-00002 (D: $200M / C: $200M)         │   │
│  │  Correction Journal: JRN-2026-00003 (D: $5M / C: $5M)           │   │
│  │  No entries were modified. Correction is purely additive.         │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### F2: Ledger Overview (per deal)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Ledger — "The Last Horizon"                                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─ Summary ────────────────────────────────────────────────────────┐   │
│  │  Total Journals: 3    Total Debits: $205M    Total Credits: $205M│   │
│  │  All journals balanced ✓                                          │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Journal #       │ Settlement │ Type       │ Posted      │ Amount       │
│  ──────────────────────────────────────────────────────────────────────  │
│  JRN-2026-00003  │ Run #3     │ CORRECTION │ Mar 7, 2026 │ $5,000,000  │
│  JRN-2026-00002  │ Run #2     │ NORMAL     │ Mar 5, 2026 │ $200,000,000│
│  JRN-2026-00001  │ Run #1     │ NORMAL     │ Feb 15, 2026│ $25,000,000 │
│                                                                          │
│  ◄ 1 of 1 ►                                                             │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### F3: Journal Detail (debit/credit postings) — Milestone 3

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Ledger    JRN-2026-00002                                             │
│  Settlement Run #2 (NORMAL) │ Posted: Mar 5, 2026                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Account           │ Participant          │ Debit        │ Credit       │
│  ──────────────────────────────────────────────────────────────────────  │
│  1000-REVENUE      │ (System)             │ —            │ $200,000,000│
│  2100-PAYABLE      │ Global Cinema        │ $24,000,000  │ —           │
│  2100-PAYABLE      │ Horizon Ventures     │ $60,900,000  │ —           │
│  2100-PAYABLE      │ Pacific Capital      │ $37,720,000  │ —           │
│  2100-PAYABLE      │ Zenith Pictures      │ $68,900,000  │ —           │
│  2100-PAYABLE      │ Sarah Chen           │ $8,480,000   │ —           │
│  ──────────────────────────────────────────────────────────────────────  │
│  TOTAL             │                      │ $200,000,000 │ $200,000,000│
│                                                              ✓ Balanced │
│                                                                          │
│  Accounting Principle: Revenue (credit) = sum of all Payables (debits)  │
│  Each participant's allocation creates a liability (payable) entry.     │
│                                                                          │
│                                                       [📥 Export CSV]   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### F3a: Correction Journal ⭐ NEW (Milestone 3)

**Purpose:** Same layout as F3 but for correction journals. Emphasizes that this is an additive entry, not a modification.

Identical to F3 but with:
- Header shows "CORRECTION" type badge
- Note: "This journal contains only the correction delta. Original journal JRN-2026-00002 is unchanged."
- Link to original journal

---

### F4: Participant Ledger (Milestone 3)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Participants    Ledger: Horizon Ventures Fund                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─ Balance Summary ────────────────────────────────────────────────┐   │
│  │  Total Payable: $61,560,000 (across 2 settlements + 1 correction)│   │
│  │  From Recoupment: $45,000,000                                     │   │
│  │  From Net Profit: $16,560,000                                     │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Recoupment Status ──────────────────────────────────────────────┐   │
│  │  Investment Cap: $45,000,000                                      │   │
│  │  Total Recouped: $45,000,000                                      │   │
│  │  Remaining: $0                                                    │   │
│  │  Status: FULLY RECOUPED ✓                                         │   │
│  │  ██████████████████████████████████████████████████████ 100%       │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Transaction History ────────────────────────────────────────────┐   │
│  │  Journal          │ Settlement│ Phase      │ Amount      │ Date   │   │
│  │  ──────────────────────────────────────────────────────────────── │   │
│  │  JRN-2026-00003   │ Run #3 ⟲ │ NET_PROFIT │ $660,000    │ Mar 7 │   │
│  │  JRN-2026-00002   │ Run #2   │ RECOUPMENT │ $45,000,000 │ Mar 5 │   │
│  │  JRN-2026-00002   │ Run #2   │ NET_PROFIT │ $15,900,000 │ Mar 5 │   │
│  │  ──────────────────────────────────────────────────────────────── │   │
│  │  ⟲ = Correction settlement                                       │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### F5: Recoupment Status Report ⭐ NEW (Milestone 2A/3)

**Purpose:** Cross-participant view of investor recoupment progress for a deal. Shows carry-forward balances.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Recoupment Status — "The Last Horizon"                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Total Investment: $70,000,000    Total Recouped: $70,000,000            │
│  Overall: 100% Recouped ✓                                                │
│                                                                          │
│  ┌─ Investor Progress ──────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  Investor              │ Cap        │ Recouped   │ Remaining │ %  │   │
│  │  ─────────────────────────────────────────────────────────────── │   │
│  │  Horizon Ventures (P1) │ $45,000,000│$45,000,000 │ $0        │100%│   │
│  │  ██████████████████████████████████████████████████████████████  │   │
│  │                                                                   │   │
│  │  Pacific Capital (P2)  │ $25,000,000│$25,000,000 │ $0        │100%│   │
│  │  ██████████████████████████████████████████████████████████████  │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Recoupment History (per settlement) ────────────────────────────┐   │
│  │                                                                   │   │
│  │  Run │ Revenue     │ Horizon Recouped│ Pacific Recouped│ Balance  │   │
│  │  ──────────────────────────────────────────────────────────────── │   │
│  │  #1  │ $25,000,000 │ $21,750,000     │ $0 (no funds)  │ $23.25M+ │   │
│  │  #2  │ $200,000,000│ $23,250,000     │ $25,000,000    │ $0       │   │
│  │                                                                   │   │
│  │  Horizon carried $23.25M forward from Run #1 → completed in #2   │   │
│  │  Pacific received $0 in Run #1 (Horizon had priority) → full in #2│   │
│  └───────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Data Source:** Derived from settlement allocations where phase = RECOUPMENT. Data already exists in BE — this is a FE aggregation view.

---

### F6: Participant Statement ⭐ NEW (Milestone 3)

**Purpose:** Printable/exportable statement for a single participant showing all their payouts across settlements.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Participant Statement                              [📥 Export PDF/CSV]  │
│  ──────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  Participant: Horizon Ventures Fund                                      │
│  Role: INVESTOR                                                          │
│  Deal: The Last Horizon                                                  │
│  Period: All time (Jan 2026 — Present)                                   │
│                                                                          │
│  ┌─ Summary ────────────────────────────────────────────────────────┐   │
│  │  Total Payable: $61,560,000                                       │   │
│  │  ├─ Recoupment:  $45,000,000 (investment fully recovered)         │   │
│  │  └─ Net Profit:  $16,560,000 (15% share)                         │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Settlement-by-Settlement Breakdown ─────────────────────────────┐   │
│  │                                                                   │   │
│  │  Settlement #1 — Feb 15, 2026 (NORMAL)                            │   │
│  │  Revenue: $25,000,000 │ Rule: v1                                  │   │
│  │  ├─ Recoupment: $21,750,000 (partial — $23.25M remaining)         │   │
│  │  └─ Net Profit: $0 (funds exhausted after recoupment)             │   │
│  │  Subtotal: $21,750,000                                            │   │
│  │                                                                   │   │
│  │  Settlement #2 — Mar 5, 2026 (NORMAL)                             │   │
│  │  Revenue: $200,000,000 │ Rule: v3                                 │   │
│  │  ├─ Recoupment: $23,250,000 (carry-forward completed)             │   │
│  │  └─ Net Profit: $15,900,000 (15% of $106M)                       │   │
│  │  Subtotal: $39,150,000                                            │   │
│  │                                                                   │   │
│  │  Settlement #3 — Mar 7, 2026 (CORRECTION of #2)                   │   │
│  │  Revenue: $5,000,000 │ Rule: v3                                   │   │
│  │  ├─ Recoupment: $0 (already fully recouped)                       │   │
│  │  └─ Net Profit: $660,000 (15% of $4.4M)                          │   │
│  │  Subtotal: $660,000                                               │   │
│  │                                                                   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Verification ───────────────────────────────────────────────────┐   │
│  │  All amounts verified against settlement proof hashes.            │   │
│  │  Settlement #1: sha256:7b2e1f... ✓                                │   │
│  │  Settlement #2: sha256:a3f8b2... ✓                                │   │
│  │  Settlement #3: sha256:c9d0e5... ✓                                │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Data Source:** Aggregation of GET `/participants/:id/ledger` + settlement run details. Data exists in BE — this is a FE view + optional PDF export.

**BE Needed (optional):** GET `/participants/:id/statement` for server-rendered PDF ❌

---

### F7: Settlement Summary Report ⭐ NEW (Milestone 3)

**Purpose:** Cross-deal or per-deal financial summary for reporting.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Settlement Summary Report                          [📥 Export CSV/PDF]  │
│  Deal: [The Last Horizon ▼]    Period: [All Time ▼]                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Total Revenue Processed: $230,000,000                                   │
│  Total Settlements: 3 (2 Normal + 1 Correction)                         │
│  Total Distribution Fees: $27,600,000 (12%)                              │
│  Total Recoupment Paid: $70,000,000                                      │
│  Total Net Profit Distributed: $132,400,000                              │
│                                                                          │
│  ┌─ Participant Totals ─────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  Participant          │ Dist Fee    │ Recoup     │ Net Profit│Total│   │
│  │  ─────────────────────────────────────────────────────────────── │   │
│  │  Global Cinema        │ $27,600,000 │ —          │ —         │ $28M│   │
│  │  Horizon Ventures     │ —           │ $45,000,000│$16,560,000│ $62M│   │
│  │  Pacific Capital      │ —           │ $25,000,000│$13,248,000│ $38M│   │
│  │  Zenith Pictures      │ —           │ —          │$93,160,000│ $93M│   │
│  │  Sarah Chen           │ —           │ —          │ $9,832,000│ $10M│   │
│  │  ─────────────────────────────────────────────────────────────── │   │
│  │  TOTAL                │ $27,600,000 │$70,000,000 │$132.8M    │$230M│   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Revenue by Period ──────────────────────────────────────────────┐   │
│  │  Q1 2026: $25,000,000                                            │   │
│  │  Q2 2026: $50,000,000                                            │   │
│  │  Q3 2026: $155,000,000 (includes $5M correction)                 │   │
│  │  ████  ████████  ████████████████████████████████████████████     │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Data Source:** Aggregation from existing settlement allocations and revenue batches. BE has all the data.

**BE Needed (optional):** GET `/reports/settlement-summary?dealId=...&period=...` ❌

---

### G1–G2: Documents

No changes from previous version. ✅ BE ready.

---

### H1–H3: Users & Roles

No changes from previous version. ❌ Entire module needs BE.

---

### I1: Audit Log

No changes from previous version. ❌ Entire module needs BE.

---

### J1: Proof, Verification & Audit Trace ⭐ EXPANDED (Milestone 3)

**Purpose:** Complete audit and verification screen. Combines proof hashes, verification workflow, evidence linking, and correction chain.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Proof & Audit Trail — "The Last Horizon"                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─ Settlement Integrity ───────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  Run │ Status    │ Proof Hash                        │ Verified   │   │
│  │  ──────────────────────────────────────────────────────────────── │   │
│  │  #3  │ FINALIZED │ sha256:c9d0e5f6...                │ ✓ Mar 7   │   │
│  │  #2  │ FINALIZED │ sha256:a3f8b2c9...                │ ✓ Mar 5   │   │
│  │  #1  │ VOIDED    │ sha256:7b2e1f3a...                │ ⚠ Voided  │   │
│  │                                                                   │   │
│  │  [🔍 Verify All]  [📋 Export Proof Records]                       │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Verification Detail (Run #2) ──────────────────────────────────┐   │
│  │                                                                   │   │
│  │  Hash: sha256:a3f8b2c9d1e4f567890abcdef1234567890abcdef          │   │
│  │  Algorithm: SHA-256                                               │   │
│  │  Timestamp: 2026-03-05T16:30:00Z                                  │   │
│  │                                                                   │   │
│  │  Input Summary:                                                   │   │
│  │  ├─ Rule Snapshot: v3 (5 participants, 12% dist. fee)             │   │
│  │  ├─ Revenue Batches: 2 (RB-2026-002, RB-2026-003)                │   │
│  │  ├─ Total Revenue: $200,000,000 (USD)                             │   │
│  │  └─ Participant Count: 5                                          │   │
│  │                                                                   │   │
│  │  Verification:                                                    │   │
│  │  Re-computing with same inputs...                                 │   │
│  │  Result hash: sha256:a3f8b2c9... ✓ MATCH                         │   │
│  │  Settlement is DETERMINISTIC and UNTAMPERED.                      │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Audit Trace: Revenue → Payout ──────────────────────────────────┐   │
│  │                                                                   │   │
│  │  This traces how revenue flows through the system:                │   │
│  │                                                                   │   │
│  │  Revenue Input                  Rules Applied                     │   │
│  │  ┌──────────────────┐          ┌──────────────────┐              │   │
│  │  │ RB-2026-002      │          │ Rule Snapshot v3  │              │   │
│  │  │ $50M, Apr-Jun    │──────┐   │ 12% dist. fee    │              │   │
│  │  └──────────────────┘      │   │ $70M recoup      │              │   │
│  │  ┌──────────────────┐      ├──→│ 65/15/12/8 split │              │   │
│  │  │ RB-2026-003      │      │   └────────┬─────────┘              │   │
│  │  │ $150M, Jul-Sep   │──────┘            │                        │   │
│  │  └──────────────────┘                   ▼                        │   │
│  │                              ┌──────────────────┐                │   │
│  │                              │ Settlement Run #2 │                │   │
│  │                              │ 4-Phase Waterfall │                │   │
│  │                              │ $200M processed   │                │   │
│  │                              └────────┬─────────┘                │   │
│  │                                       │                          │   │
│  │                    ┌──────────────────┤──────────────────┐       │   │
│  │                    ▼                  ▼                  ▼       │   │
│  │             ┌────────────┐  ┌──────────────┐  ┌────────────┐    │   │
│  │             │ Allocations │  │ Proof Record  │  │ Ledger     │    │   │
│  │             │ 5 parties   │  │ sha256:a3f8.. │  │ JRN-00002  │    │   │
│  │             │ $200M total │  │ Verified ✓    │  │ D=C=$200M  │    │   │
│  │             └────────────┘  └──────────────┘  └────────────┘    │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Correction Chain ──────────────────────────────────────────────┐    │
│  │                                                                  │    │
│  │  Run #1      Run #2            Run #3                            │    │
│  │  VOIDED      NORMAL ──────────→ CORRECTION                      │    │
│  │  $25M        $200M              $5M                              │    │
│  │  (discarded) (original)         (adjustment)                     │    │
│  │                                                                  │    │
│  │  Net Effective: $200M + $5M = $205M total settled                │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

**Key Milestone 3 Features Shown:**
1. **Proof hashes** per settlement with verification status
2. **Verification workflow** — re-compute and compare hash (determinism proof)
3. **Evidence linking** — visual trace from revenue inputs → rules → engine → outputs
4. **Correction chain** — shows how corrections relate to originals
5. **Immutability guarantee** — voided runs preserved, corrections additive

---

## 7. User Flow Diagrams

### Flow 1: Complete Settlement (Happy Path) — Milestones 2A-2C

```
Login → Dashboard → Click Deal → Deal Overview
  ├─ 1. Tab: Participants → Add all parties
  ├─ 2. Tab: Rules → Create Rule Snapshot (immutable)
  ├─ 3. Tab: Revenue → Create Batch → Submit (PENDING)
  ├─ 4. Tab: Revenue → Review Batch → [Validate] → VALIDATED
  ├─ 5. Tab: Settlements → Create Run (select rule + batches) → DRAFT
  ├─ 6. Settlement Detail → [Preview] → See waterfall → PREVIEWED
  ├─ 7. Settlement Detail → [Finalize] → Locked forever → FINALIZED
  └─ 8. Tab: Ledger → View journal + postings (debits = credits ✓)
```

### Flow 2: Settlement Correction — Milestone 3

```
Settlement Detail (FINALIZED) → [Create Correction Run]
  ├─ Select rule snapshot + correction revenue batches
  ├─ Enter correction reason
  ├─ Create → DRAFT → [Preview] → PREVIEWED → [Finalize] → FINALIZED
  ├─ New correction journal created (original unchanged)
  └─ Correction chain updated (visible in J1 + E9)
```

### Flow 3: Verify Settlement Integrity — Milestone 3

```
Deal → Tab: Proof & Audit → Select settlement run
  ├─ View proof hash + input summary
  ├─ [Verify Integrity] → System re-computes with same inputs
  ├─ Compare computed hash vs stored hash
  └─ Result: ✓ MATCH (deterministic, untampered) or ✗ MISMATCH (alert)
```

### Flow 4: Generate Participant Statement — Milestone 3

```
Deal → Tab: Participants → Click participant → Detail drawer
  ├─ View balance summary + recoupment status
  ├─ [View Full Ledger] → F4 (transaction history)
  ├─ [Generate Statement] → F6 (participant statement)
  └─ [Export PDF] → downloadable statement
```

### Flow 5: Track Carry-Forward Recoupment — Milestones 2A/3

```
Deal → Tab: Settlements → View runs chronologically
  ├─ Run #1: Investor A partially recouped ($21.75M of $45M)
  │    └─ Carry-forward balance: $23.25M
  ├─ Run #2: Investor A completes recoupment ($23.25M remaining)
  │    └─ Then receives net profit share on remaining funds
  └─ Recoupment Report (F5): visual progress bars per investor
```

---

## 8. Backend Gap Analysis

### TIER 1: Must-Have for Launch

| # | Feature | Endpoints | Screens Unlocked |
|---|---------|-----------|------------------|
| 1 | **Auth Module** | POST `/auth/login`, `/refresh`, `/logout` | A1, A2, A3 |
| 2 | **RBAC Guards** | Middleware + `@Roles()` decorator on all endpoints | All (security) |
| 3 | **Deal Update** | PATCH `/deals/:id`, PATCH `/deals/:id/status` | C4, C5 |
| 4 | **Cross-Deal Listings** | GET `/settlement-runs` (global), GET `/revenue-batches` (global) | E1, E2, F1 |
| 5 | **Audit Log** | AuditLog model + middleware + GET `/audit-logs` | I1, I2 |

### TIER 2: Should-Have

| # | Feature | Endpoints | Screens Unlocked |
|---|---------|-----------|------------------|
| 6 | **User Management** | GET/POST/PATCH/DELETE `/users` | H1, H2, H3 |
| 7 | **Participant CRUD** | GET/PATCH/DELETE `/participants/:id` | D3 (full) |
| 8 | **Dashboard Aggregation** | GET `/dashboard/summary` | B1 (optimized) |
| 9 | **Report Endpoints** | GET `/reports/statement`, `/reports/summary` | F6, F7 (export) |
| 10 | **Notification System** | Notification model + GET `/notifications` | 🔔 bell icon |

### TIER 3: Nice-to-Have

| # | Feature |
|---|---------|
| 11 | Settlement approval workflow |
| 12 | Bulk validate/reject revenue batches |
| 13 | Ledger export (CSV/PDF) |
| 14 | Document download/stream |
| 15 | Deal archival (soft delete) |

### New DB Models Required

```prisma
model User {
  id             String   @id @default(uuid())
  email          String   @unique
  name           String
  hashedPassword String
  role           UserRole @default(VIEWER)
  status         UserStatus @default(ACTIVE)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String
  action     String   // CREATED, VALIDATED, FINALIZED, etc.
  entityType String   // Deal, RevenueBatch, SettlementRun, etc.
  entityId   String
  dealId     String?
  metadata   Json?    // additional context
  timestamp  DateTime @default(now())
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   // BATCH_PENDING, SETTLEMENT_READY, etc.
  title     String
  message   String
  entityId  String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}

enum UserRole {
  OWNER
  ADMIN
  FINANCE_MGR
  ANALYST
  VIEWER
}

enum UserStatus {
  ACTIVE
  INVITED
  DEACTIVATED
}
```

---

## 9. Phased Implementation Plan

### Phase 1: Foundation (enables 30 of 42 screens)

```
BE Work:
├── AuthModule (login, JWT, guards)
├── PATCH /deals/:id (update + status)
├── GET /settlement-runs (global)
└── GET /revenue-batches (global)

FE Work:
├── All deal screens (C1-C5)
├── All SFI screens (E3-E13)
├── All ledger screens (F2-F4)
├── Reports (F5-F7 — FE aggregation)
├── Documents (G1-G2)
└── Proof & Audit (J1)
```

### Phase 2: Admin (enables remaining 12 screens)

```
BE Work:
├── User model + CRUD
├── AuditLog model + middleware
├── RBAC guards
└── Notification model

FE Work:
├── Auth screens (A1-A3)
├── Users & Roles (H1-H3)
├── Audit Log (I1-I2)
└── Dashboard (B1)
```

### Phase 3: Polish

```
├── Ledger/statement PDF export
├── Bulk operations
├── Settlement approval workflow
└── Notification system
```

---

## 10. Technical Architecture for FE

### Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| State | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table |
| Charts | Recharts |
| Auth | NextAuth.js or custom JWT |
| Icons | Lucide React |

### Route Structure

```
/login                           → A1
/dashboard                       → B1
/deals                           → C1
/deals/new                       → C2
/deals/:dealId                   → C3 (Overview tab)
/deals/:dealId/participants      → D1 (Participants tab)
/deals/:dealId/rules             → E3 (Rules tab)
/deals/:dealId/rules/:id         → E4 (Rule detail)
/deals/:dealId/rules/new         → E5 (Create rule)
/deals/:dealId/revenue           → E6 (Revenue tab)
/deals/:dealId/revenue/:id       → E7 (Revenue detail)
/deals/:dealId/revenue/new       → E8 (Create revenue)
/deals/:dealId/settlements       → E9 (Settlements tab)
/deals/:dealId/settlements/:id   → E10 (Settlement detail)
/deals/:dealId/settlements/new   → E11 (Create settlement)
/deals/:dealId/ledger            → F2 (Ledger tab)
/deals/:dealId/ledger/:id        → F3 (Journal detail)
/deals/:dealId/recoupment        → F5 (Recoupment report)
/deals/:dealId/documents         → G1 (Docs tab)
/deals/:dealId/audit             → J1 (Proof & audit tab)
/settlements                     → E1 (All settlements)
/settlements/pending             → E2 (Pending reviews)
/transactions                    → F1 (Cross-deal revenue)
/transactions/reports            → F7 (Settlement summary)
/participants/:id/statement      → F6 (Participant statement)
/team                            → H1 (Users)
/audit-log                       → I1 (Audit log)
```

---

## 11. Status Color Coding

| Color | Hex | Meaning | Used For |
|-------|-----|---------|----------|
| Gray | #6B7280 | Draft | DRAFT deals, DRAFT runs |
| Yellow | #F59E0B | Awaiting action | PENDING batches, PREVIEWED runs |
| Green | #10B981 | Active / Approved | ACTIVE deals, VALIDATED batches, FINALIZED runs |
| Blue | #3B82F6 | Completed | PROCESSED batches, CLOSED deals |
| Red | #EF4444 | Error / Rejected | REJECTED batches, VOIDED runs |
| Purple | #8B5CF6 | Special | CORRECTION runs |

---

## 12. Final Summary

| Metric | Count |
|--------|-------|
| **Total Screens** | **42** |
| Screens with BE Ready | 23 (55%) |
| Screens needing new BE | 19 (45%) |
| **New screens added (this revision)** | **6** (E12a, E13, F3a, F5, F6, F7) |
| Navbar items | 6 |
| FE Routes | 27 |
| New BE Endpoints Needed | ~15-20 |
| New DB Models Needed | 3 (User, AuditLog, Notification) |

### Milestone Coverage

| Milestone | Features | Design Coverage |
|-----------|----------|-----------------|
| 2A — Computation Engine | Waterfall, recoup, carry-forward | ✅ 100% (E10, F5) |
| 2B — Rules & Revenue | Snapshots, batches, binding | ✅ 100% (E3-E8, E11) |
| 2C — Settlement Runs | Lifecycle, storage, re-run | ✅ 100% (E9-E11, lifecycle stepper) |
| 3 — Ledger, Audit, Proof | Ledger, corrections, proof, reports | ✅ 100% (F2-F7, E12a, E13, J1) |

---

*This document maps every backend feature from Milestones 2A–3 to specific UI screens. Use as the complete blueprint for Figma wireframes and frontend implementation.*
