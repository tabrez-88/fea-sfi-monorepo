# SFI Admin Portal — Design Concept & Screen Specification

**Purpose:** Design blueprint for the SFI section within the FEA-SFI Admin Console
**Context:** "Admin" = Deal/Project Owner (not super admin). SFI lives inside the existing FEA-SFI Admin Console as a per-deal module.
**Date:** March 2026

---

## Portal Architecture

SFI is **not** a standalone portal. It is a **module inside the FEA-SFI Admin Console**, scoped per deal/project.

```
FEA-SFI Admin Console (Liang's Lovable app)
├── Projects / Deals (existing)
├── Users / Team (existing)
├── ... other FEA modules ...
│
└── SFI Module (per deal) ← THIS DOCUMENT
    ├── Deal Dashboard (overview)
    ├── Participants
    ├── Rule Snapshots
    ├── Revenue Batches
    ├── Settlement Runs
    ├── Ledger
    ├── Documents
    └── Proof & Audit
```

**Entry Point:** User selects a Project/Deal in FEA-SFI Admin → clicks into "Settlement" or "SFI" tab → lands on Deal Dashboard.

---

## Screen Inventory

| #   | Screen                | Type                         | API Endpoints Used                                      |
| --- | --------------------- | ---------------------------- | ------------------------------------------------------- |
| 1   | Deal Dashboard        | Read-only overview           | GET deals/:id, GET settlement-runs, GET revenue-batches |
| 2   | Participants List     | CRUD (CR)                    | GET/POST deals/:dealId/participants                     |
| 3   | Participant Detail    | Read                         | GET (from list data)                                    |
| 4   | Rule Snapshots List   | List + Create                | GET/POST deals/:dealId/rule-snapshots                   |
| 5   | Rule Snapshot Detail  | Read (with ruleSummary)      | GET rule-snapshots/:id                                  |
| 6   | Create Rule Snapshot  | Form (complex)               | POST deals/:dealId/rule-snapshots                       |
| 7   | Revenue Batches List  | CRUD (CRU)                   | GET/POST deals/:dealId/revenue-batches                  |
| 8   | Revenue Batch Detail  | Read + Actions               | GET revenue-batches/:id, PATCH validate/reject          |
| 9   | Create Revenue Batch  | Form                         | POST deals/:dealId/revenue-batches                      |
| 10  | Settlement Runs List  | List + Create                | GET/POST deals/:dealId/settlement-runs                  |
| 11  | Settlement Run Detail | Read + Actions               | GET settlement-runs/:id, POST preview/finalize          |
| 12  | Create Settlement Run | Form (select rule + batches) | POST deals/:dealId/settlement-runs                      |
| 13  | Settlement Preview    | Read (allocation breakdown)  | POST settlement-runs/:id/preview                        |
| 14  | Ledger Overview       | Read (per deal)              | GET deals/:dealId/ledger                                |
| 15  | Journal Detail        | Read (postings)              | GET ledger-journals/:id                                 |
| 16  | Participant Ledger    | Read (per participant)       | GET participants/:id/ledger                             |
| 17  | Documents             | CRUD (CRD)                   | GET/POST/DELETE documents                               |
| 18  | Proof & Audit         | Read                         | GET settlement-runs/:id (proofHash)                     |

**Total: 18 screens** (can be reduced to ~12 with modals/drawers for simple forms)

---

## Screen-by-Screen Specification

---

### Screen 1: Deal Dashboard (SFI Overview)

**Purpose:** At-a-glance view of the deal's settlement status when user enters the SFI module.

**URL Pattern:** `/projects/:dealId/sfi` or `/deals/:dealId/settlement`

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Projects    Deal: "The Last Horizon"    Status: ACTIVE │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ 5        │  │ 3        │  │ $200M    │  │ 2        │       │
│  │Participants│ │Snapshots │  │ Revenue  │  │Settlements│      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  ┌─ Latest Settlement ──────────────────────────────────────┐  │
│  │ Run #2 — FINALIZED — Mar 5, 2026                        │  │
│  │ Total Revenue: $200,000,000 → Total Allocated: $200,000,000│
│  │ Rule Snapshot: v3 │ Revenue Batches: 2                   │  │
│  │ Proof: sha256:a3f8b2...  [View Details]                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Quick Actions ──────────────────────────────────────────┐  │
│  │ [+ New Revenue Batch]  [+ New Settlement Run]            │  │
│  │ [View Ledger]          [View Documents]                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Recent Activity ────────────────────────────────────────┐  │
│  │ Mar 5  Settlement Run #2 finalized                       │  │
│  │ Mar 4  Revenue Batch RB-2026-003 validated               │  │
│  │ Mar 3  Rule Snapshot v3 created                          │  │
│  │ Mar 1  Participant "Sarah Chen" added                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources:**

- GET `/deals/:id` → deal info, participant count
- GET `/deals/:dealId/settlement-runs?limit=1&sortBy=createdAt&sortOrder=desc` → latest run
- GET `/deals/:dealId/revenue-batches` → total revenue sum, batch count
- GET `/deals/:dealId/rule-snapshots` → snapshot count, latest version

**Components:**

- 4x Stat Cards (participants, snapshots, revenue total, settlement count)
- Latest Settlement Summary Card
- Quick Action Buttons
- Recent Activity Timeline (derived from timestamps across entities)

---

### Screen 2: Participants List

**Purpose:** View and add participants (parties) in this deal.

**URL:** `/deals/:dealId/sfi/participants`

```
┌─────────────────────────────────────────────────────────────────┐
│  Participants (5)                            [+ Add Participant] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Name                  │ Role         │ Email           │ Added │
│  ─────────────────────────────────────────────────────────────  │
│  Zenith Pictures       │ STUDIO       │ —               │ Feb 1 │
│  Global Cinema Partners│ DISTRIBUTOR  │ gc@cinema.com   │ Feb 1 │
│  Horizon Ventures Fund │ INVESTOR     │ hv@fund.com     │ Feb 1 │
│  Pacific Capital Group │ INVESTOR     │ pc@capital.com  │ Feb 2 │
│  Sarah Chen            │ TALENT       │ sarah@chen.com  │ Feb 3 │
│                                                                 │
│  ◄ 1 of 1 ►                                                    │
└─────────────────────────────────────────────────────────────────┘
```

**CRUD Operations:**

- **Create:** Modal/drawer form → POST `/deals/:dealId/participants`
- **Read:** Table with pagination → GET `/deals/:dealId/participants`
- **Update:** Not supported by API (participants are reference data)
- **Delete:** Not supported by API (cascade risks)

**Create Participant Form Fields:**

| Field       | Type                                | Required | Validation                                                                            |
| ----------- | ----------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| Name        | Text input                          | Yes      | 1-255 chars                                                                           |
| Role        | Dropdown select                     | Yes      | PRODUCER, DISTRIBUTOR, INVESTOR, TALENT, STUDIO, LICENSOR, LICENSEE, COLLECTION_AGENT |
| Email       | Email input                         | No       | Valid email format                                                                    |
| External ID | Text input                          | No       | Max 100 chars (for linking to external systems)                                       |
| Metadata    | JSON editor (optional, collapsible) | No       | Valid JSON                                                                            |

**Role Badge Colors:**

- STUDIO: Blue
- DISTRIBUTOR: Purple
- INVESTOR: Green
- TALENT: Orange
- PRODUCER: Indigo
- LICENSOR/LICENSEE: Teal
- COLLECTION_AGENT: Gray

---

### Screen 3: Participant Detail (Drawer/Modal)

**Purpose:** View participant info + their ledger summary across all settlements.

```
┌─────────────────────────────────────────────────────┐
│  Participant: Horizon Ventures Fund         [Close] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Role: INVESTOR                                     │
│  Email: hv@fund.com                                 │
│  External ID: HVF-001                               │
│  Added: Feb 1, 2026                                 │
│                                                     │
│  ─── Ledger Summary ───                             │
│  Total Received: $60,900,000                        │
│  From Recoupment: $45,000,000                       │
│  From Net Profit: $15,900,000                       │
│                                                     │
│  ─── Settlement History ───                         │
│  Run #2 │ FINALIZED │ $60,900,000 │ Mar 5           │
│  Run #1 │ FINALIZED │ $22,700,000 │ Feb 15          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Data Sources:**

- Participant data from list
- GET `/participants/:participantId/ledger` → ledger postings summary

---

### Screen 4: Rule Snapshots List

**Purpose:** View version history of settlement rules for this deal.

**URL:** `/deals/:dealId/sfi/rules`

```
┌─────────────────────────────────────────────────────────────────┐
│  Rule Snapshots (3 versions)                [+ Create Snapshot]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Version │ Effective From  │ Effective To │ Participants │Status │
│  ────────────────────────────────────────────────────────────── │
│  v3      │ Mar 1, 2026    │ —  (current) │ 5            │ACTIVE │
│  v2      │ Feb 15, 2026   │ Mar 1, 2026  │ 5            │CLOSED │
│  v1      │ Feb 1, 2026    │ Feb 15, 2026 │ 4            │CLOSED │
│                                                                 │
│  Click a version to view full rule details and ruleSummary      │
└─────────────────────────────────────────────────────────────────┘
```

**Key UX Notes:**

- Active snapshot (no effectiveTo) highlighted with green badge
- Closed snapshots grayed out
- Version number is auto-incremented, not editable
- Each row clickable → opens Rule Snapshot Detail

---

### Screen 5: Rule Snapshot Detail

**Purpose:** View the frozen rules with auto-generated ruleSummary. The most information-dense screen.

**URL:** `/deals/:dealId/sfi/rules/:snapshotId`

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Rules    Rule Snapshot v3                                     │
│  Effective: Mar 1, 2026 — Present (current)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Rule Summary ───────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  Total Participants: 5                                    │  │
│  │                                                           │  │
│  │  Role Breakdown:                                          │  │
│  │  ██ STUDIO (1)  ██ DISTRIBUTOR (1)  ██ INVESTOR (2)      │  │
│  │  ██ TALENT (1)                                            │  │
│  │                                                           │  │
│  │  Distribution Fee: 12% off the top                        │  │
│  │  Total Recoupment Cap: $70,000,000                        │  │
│  │                                                           │  │
│  │  Net Profit Split:                                        │  │
│  │  ┌───────────────────────────────────────────────────┐   │  │
│  │  │ Zenith Pictures          ████████████████  65%    │   │  │
│  │  │ Horizon Ventures Fund    ████             15%    │   │  │
│  │  │ Pacific Capital Group    ███              12%    │   │  │
│  │  │ Sarah Chen               ██               8%    │   │  │
│  │  └───────────────────────────────────────────────────┘   │  │
│  │                                                           │  │
│  │  ⚠ Warnings: None                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Participant Terms (frozen at snapshot creation) ────────┐  │
│  │                                                           │  │
│  │  Name                  │ Role        │ Fee % │ Recoup Cap │ Priority │ Net % │
│  │  Zenith Pictures       │ STUDIO      │ —     │ —          │ —        │ 65%   │
│  │  Global Cinema Partners│ DISTRIBUTOR │ 12%   │ —          │ —        │ —     │
│  │  Horizon Ventures Fund │ INVESTOR    │ —     │ $45,000,000│ 1        │ 15%   │
│  │  Pacific Capital Group │ INVESTOR    │ —     │ $25,000,000│ 2        │ 12%   │
│  │  Sarah Chen            │ TALENT      │ —     │ —          │ —        │ 8%    │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Raw Rules JSON (collapsible) ───────────────────────────┐  │
│  │ ▶ Click to expand                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Data Source:** GET `/rule-snapshots/:id` → includes `ruleSummary` + `participants` + `rules`

**Components:**

- Rule Summary Card (visual: role pie chart, profit split bar chart)
- Participant Terms Table (frozen data from snapshot)
- Collapsible raw JSON viewer (for power users)
- Warnings alert (if ruleSummary.warnings is non-empty)

---

### Screen 6: Create Rule Snapshot (Multi-step Form)

**Purpose:** Define new settlement rules for the deal. Most complex form.

**URL:** `/deals/:dealId/sfi/rules/new`

**Step 1: Basic Settings**

```
┌─────────────────────────────────────────────────────────────────┐
│  Create Rule Snapshot                         Step 1 of 3       │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Effective From: [Date Picker — defaults to today]              │
│                                                                 │
│  Currency: [USD ▼]                                              │
│                                                                 │
│  Notes: [Optional text area]                                    │
│                                                                 │
│                                              [Cancel] [Next →]  │
└─────────────────────────────────────────────────────────────────┘
```

**Step 2: Participant Rules**

```
┌─────────────────────────────────────────────────────────────────┐
│  Create Rule Snapshot                         Step 2 of 3       │
│  Define rules for each participant                              │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Select participants to include: [Select All] [Clear]           │
│                                                                 │
│  ☑ Zenith Pictures (STUDIO)                                     │
│    └─ Net Profit %: [65  ]                                      │
│                                                                 │
│  ☑ Global Cinema Partners (DISTRIBUTOR)                         │
│    └─ Distribution Fee %: [12  ]                                │
│                                                                 │
│  ☑ Horizon Ventures Fund (INVESTOR)                             │
│    ├─ Recoup Cap: [$45,000,000]                                 │
│    ├─ Priority: [1]                                             │
│    └─ Net Profit %: [15  ]                                      │
│                                                                 │
│  ☑ Pacific Capital Group (INVESTOR)                             │
│    ├─ Recoup Cap: [$25,000,000]                                 │
│    ├─ Priority: [2]                                             │
│    └─ Net Profit %: [12  ]                                      │
│                                                                 │
│  ☑ Sarah Chen (TALENT)                                          │
│    └─ Net Profit %: [8   ]                                      │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  Running Total — Net Profit: 100% ✓  │  Dist. Fee: 12%         │
│  Total Recoup: $70,000,000                                      │
│                                                                 │
│                                        [← Back] [Next →]       │
└─────────────────────────────────────────────────────────────────┘
```

**Step 3: Review & Confirm**

```
┌─────────────────────────────────────────────────────────────────┐
│  Create Rule Snapshot                         Step 3 of 3       │
│  Review before locking (cannot be edited after creation)        │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ⚠ Once created, this snapshot is IMMUTABLE.                    │
│    To change rules, you must create a new version.              │
│                                                                 │
│  [Preview of ruleSummary — same layout as Screen 5]             │
│                                                                 │
│                                 [← Back] [Create Snapshot ✓]   │
└─────────────────────────────────────────────────────────────────┘
```

**Validation (live, client-side + server-side):**

- Net profit % running total shown in real-time (warning if > 100%)
- Fee % must be 0-100
- Recoup cap must be > 0
- At least 1 participant selected
- Role-specific fields shown dynamically (DISTRIBUTOR shows fee, INVESTOR shows recoup, etc.)

---

### Screen 7: Revenue Batches List

**Purpose:** View all revenue batches for this deal with status lifecycle.

**URL:** `/deals/:dealId/sfi/revenue`

```
┌─────────────────────────────────────────────────────────────────┐
│  Revenue Batches (4)     [Filter: All ▼]    [+ New Batch]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Batch #     │ Period              │ Amount      │ Currency│Status    │
│  ──────────────────────────────────────────────────────────────  │
│  RB-2026-004 │ Oct–Dec 2026        │ $50,000,000 │ USD    │🟡PENDING  │
│  RB-2026-003 │ Jul–Sep 2026        │ $75,000,000 │ USD    │🟢VALIDATED│
│  RB-2026-002 │ Apr–Jun 2026        │ $50,000,000 │ USD    │🔵PROCESSED│
│  RB-2026-001 │ Jan–Mar 2026        │ $25,000,000 │ USD    │🔵PROCESSED│
│                                                                 │
│  Total Revenue: $200,000,000                                    │
│                                                                 │
│  ◄ 1 of 1 ►                                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Status Badges & Colors:**

- PENDING: Yellow — awaiting validation
- VALIDATED: Green — ready for settlement
- PROCESSED: Blue — used in finalized settlement
- REJECTED: Red — data quality issue

**Filter Options:** All, Pending, Validated, Processed, Rejected

---

### Screen 8: Revenue Batch Detail

**Purpose:** View batch details + take actions (validate/reject).

**URL:** `/deals/:dealId/sfi/revenue/:batchId`

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Revenue Batches    RB-2026-004                 Status: PENDING│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Amount: $50,000,000                                            │
│  Currency: USD                                                  │
│  Period: Oct 1, 2026 — Dec 31, 2026                             │
│  Source: "Q4 2026 Streaming Revenue — Netflix + Disney+"        │
│  Created: Mar 8, 2026                                           │
│                                                                 │
│  ┌─ Metadata ───────────────────────────────────────────────┐  │
│  │ Line Items:                                               │  │
│  │   Netflix Streaming: $30,000,000                          │  │
│  │   Disney+ Licensing: $15,000,000                          │  │
│  │   Merchandise: $5,000,000                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Documents (2) ──────────────────────────────────────────┐  │
│  │ 📄 netflix_q4_report.pdf     │ REVENUE_REPORT │ 2.3 MB   │  │
│  │ 📄 disney_license_stmt.pdf   │ REVENUE_REPORT │ 1.1 MB   │  │
│  │                                            [+ Upload Doc] │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Actions ────────────────────────────────────────────────┐  │
│  │ [✓ Validate Batch]     [✗ Reject Batch]                  │  │
│  │                                                           │  │
│  │ Validate = approve for use in settlement runs             │  │
│  │ Reject = mark as invalid (cannot be used)                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Action Buttons (conditional):**

- PENDING → Show both [Validate] and [Reject]
- VALIDATED → Show only [Reject] (can still reject before processed)
- PROCESSED → No actions (locked)
- REJECTED → No actions (terminal state)

**Validate/Reject triggers confirmation modal:**

```
┌─────────────────────────────────────────┐
│  Validate Revenue Batch?                │
│                                         │
│  Batch: RB-2026-004                     │
│  Amount: $50,000,000                    │
│                                         │
│  Validation Notes: [text area]          │
│                                         │
│  This will make the batch eligible      │
│  for settlement runs.                   │
│                                         │
│            [Cancel]  [Confirm Validate] │
└─────────────────────────────────────────┘
```

---

### Screen 9: Create Revenue Batch

**Purpose:** Register new revenue for the deal.

**URL:** `/deals/:dealId/sfi/revenue/new`

```
┌─────────────────────────────────────────────────────────────────┐
│  New Revenue Batch                                              │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Total Amount *:  [$               ]                            │
│  Currency *:      [USD ▼]                                       │
│                                                                 │
│  Period Start *:  [Date picker]                                 │
│  Period End *:    [Date picker]                                 │
│                                                                 │
│  Source:          [Text input — e.g., "Q4 2026 Netflix Revenue"]│
│                                                                 │
│  ─── Metadata (optional, collapsible) ───                       │
│  Line Items:                                                    │
│    [+ Add Line Item]                                            │
│    Platform: [        ]  Amount: [$         ]                   │
│    Platform: [        ]  Amount: [$         ]                   │
│                                                                 │
│  Supporting Documents:                                          │
│    [+ Upload Document]                                          │
│                                                                 │
│                                     [Cancel] [Create Batch]     │
└─────────────────────────────────────────────────────────────────┘
```

**Validation:**

- Amount ≥ 0
- Period Start < Period End (live check)
- Currency from supported list (USD, EUR, GBP, JPY, CHF, CAD, AUD)

---

### Screen 10: Settlement Runs List

**Purpose:** View all settlement runs and their statuses.

**URL:** `/deals/:dealId/sfi/settlements`

```
┌─────────────────────────────────────────────────────────────────┐
│  Settlement Runs (3)     [Filter: All ▼]   [+ New Settlement]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  # │ Type       │ Rule │ Batches │ Total Allocated │ Status     │
│  ──────────────────────────────────────────────────────────────  │
│  3 │ CORRECTION │ v3   │ 1       │ $5,000,000      │ 🟢FINALIZED│
│  2 │ NORMAL     │ v3   │ 2       │ $200,000,000    │ 🟢FINALIZED│
│  1 │ NORMAL     │ v1   │ 1       │ —               │ 🟡PREVIEWED│
│                                                                 │
│  [Run #3 is a correction of Run #2 — linked]                   │
│                                                                 │
│  ◄ 1 of 1 ►                                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Status Badges:**

- DRAFT: Gray — created, not yet computed
- PREVIEWED: Yellow — computed but not locked
- FINALIZED: Green — locked, ledger entries created
- VOIDED: Red — invalidated

---

### Screen 11: Settlement Run Detail

**Purpose:** The core screen — view settlement computation results, take actions.

**URL:** `/deals/:dealId/sfi/settlements/:runId`

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Settlements    Settlement Run #2           Status: PREVIEWED │
│  Type: NORMAL │ Rule Snapshot: v3 │ Created: Mar 5, 2026        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Summary ────────────────────────────────────────────────┐  │
│  │ Total Revenue: $200,000,000    Total Allocated: $200,000,000│
│  │ Currency: USD                  Revenue Batches: 2          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Phase 1: Gross Receipts ────────────────────────────────┐  │
│  │ Total: $200,000,000                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Phase 2: Distribution Fees ─────────────────────────────┐  │
│  │ Global Cinema Partners │ 12% │ $24,000,000               │  │
│  │ Remaining: $176,000,000                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Phase 3: Recoupment ────────────────────────────────────┐  │
│  │ Horizon Ventures Fund  │ Cap: $45M │ Recouped: $45M │ ✓  │  │
│  │ Pacific Capital Group  │ Cap: $25M │ Recouped: $25M │ ✓  │  │
│  │ Remaining: $106,000,000                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Phase 4: Net Profit Split ──────────────────────────────┐  │
│  │ Zenith Pictures        │ 65% │ $68,900,000               │  │
│  │ Horizon Ventures Fund  │ 15% │ $15,900,000               │  │
│  │ Pacific Capital Group  │ 12% │ $12,720,000               │  │
│  │ Sarah Chen             │  8% │ $8,480,000                │  │
│  │ Remaining: $0                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Total Payout Summary ───────────────────────────────────┐  │
│  │ Party              │ Dist Fee   │ Recoup    │ Net Profit │ Total        │
│  │ Global Cinema      │ $24,000,000│ —         │ —          │ $24,000,000  │
│  │ Horizon Ventures   │ —          │ $45,000,000│ $15,900,000│ $60,900,000 │
│  │ Pacific Capital    │ —          │ $25,000,000│ $12,720,000│ $37,720,000 │
│  │ Zenith Pictures    │ —          │ —         │ $68,900,000│ $68,900,000  │
│  │ Sarah Chen         │ —          │ —         │ $8,480,000 │ $8,480,000   │
│  │ TOTAL              │ $24,000,000│ $70,000,000│$106,000,000│$200,000,000 │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Proof ──────────────────────────────────────────────────┐  │
│  │ Hash: sha256:a3f8b2c9d1e4f567...                         │  │
│  │ Algorithm: SHA-256                                        │  │
│  │ Timestamp: 2026-03-05T14:30:00Z                           │  │
│  │ [Copy Hash]  [Verify]                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Actions ────────────────────────────────────────────────┐  │
│  │ [🔒 Finalize Settlement]    [Create Correction Run]       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Action Buttons (conditional by status):**

- DRAFT → [Preview Settlement]
- PREVIEWED → [Finalize Settlement] [Re-Preview]
- FINALIZED → [Create Correction Run] [View Ledger] [Download Report]
- VOIDED → No actions

**Finalize Confirmation Modal:**

```
┌─────────────────────────────────────────┐
│  ⚠ Finalize Settlement?                │
│                                         │
│  This action is IRREVERSIBLE.           │
│                                         │
│  • Allocations will be permanently locked│
│  • Ledger entries will be created       │
│  • Revenue batches will be marked       │
│    as PROCESSED                         │
│  • Proof record will be generated       │
│                                         │
│  Total Allocated: $200,000,000          │
│  Participants: 5                        │
│                                         │
│          [Cancel]  [Finalize ✓]         │
└─────────────────────────────────────────┘
```

---

### Screen 12: Create Settlement Run

**Purpose:** Select rule snapshot and revenue batches to create a new settlement run.

**URL:** `/deals/:dealId/sfi/settlements/new`

```
┌─────────────────────────────────────────────────────────────────┐
│  New Settlement Run                                             │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Rule Snapshot *:                                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ○ v3 (Mar 1, 2026 — Present) — 5 participants, 12% fee   │ │
│  │ ○ v2 (Feb 15 — Mar 1) — CLOSED                           │ │
│  │ ○ v1 (Feb 1 — Feb 15) — CLOSED                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Revenue Batches * (select validated batches):                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ☑ RB-2026-003 │ $75,000,000  │ Jul–Sep 2026 │ VALIDATED  │ │
│  │ ☑ RB-2026-002 │ $50,000,000  │ Apr–Jun 2026 │ VALIDATED  │ │
│  │ ☐ RB-2026-001 │ $25,000,000  │ Jan–Mar 2026 │ PROCESSED  │ │
│  └───────────────────────────────────────────────────────────┘ │
│  Only VALIDATED batches can be selected.                        │
│  PROCESSED batches shown but disabled.                          │
│                                                                 │
│  Selected Revenue Total: $125,000,000                           │
│                                                                 │
│  Notes: [Optional text area]                                    │
│                                                                 │
│                            [Cancel] [Create Settlement Run]     │
└─────────────────────────────────────────────────────────────────┘
```

**Validation:**

- Must select exactly 1 rule snapshot
- Must select at least 1 revenue batch
- Only VALIDATED batches selectable
- Rule snapshot must belong to this deal

---

### Screen 13: Settlement Preview (inline on Screen 11)

Not a separate screen — the preview results are shown **on Screen 11** after the user clicks [Preview Settlement]. The status changes from DRAFT → PREVIEWED and the allocation breakdown appears.

---

### Screen 14: Ledger Overview

**Purpose:** Double-entry accounting view for the deal.

**URL:** `/deals/:dealId/sfi/ledger`

```
┌─────────────────────────────────────────────────────────────────┐
│  Ledger — "The Last Horizon"                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Journal #      │ Settlement │ Posted         │ Debits      │ Credits     │
│  ──────────────────────────────────────────────────────────────  │
│  JRN-2026-00002 │ Run #2     │ Mar 5, 2026    │ $200,000,000│ $200,000,000│
│  JRN-2026-00001 │ Run #1     │ Feb 15, 2026   │ $75,000,000 │ $75,000,000 │
│                                                                 │
│  All journals balance (debits = credits) ✓                      │
│                                                                 │
│  ◄ 1 of 1 ►                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

### Screen 15: Journal Detail

**Purpose:** View individual debit/credit postings for a settlement.

**URL:** `/deals/:dealId/sfi/ledger/:journalId`

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Ledger    JRN-2026-00002                                     │
│  Settlement Run #2 │ Posted: Mar 5, 2026                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Account              │ Participant          │ Debit       │ Credit      │
│  ──────────────────────────────────────────────────────────────  │
│  1000-REVENUE         │ —                    │ —           │ $200,000,000│
│  2100-PAYABLE         │ Global Cinema        │ $24,000,000 │ —           │
│  2100-PAYABLE         │ Horizon Ventures     │ $60,900,000 │ —           │
│  2100-PAYABLE         │ Pacific Capital      │ $37,720,000 │ —           │
│  2100-PAYABLE         │ Zenith Pictures      │ $68,900,000 │ —           │
│  2100-PAYABLE         │ Sarah Chen           │ $8,480,000  │ —           │
│  ──────────────────────────────────────────────────────────────  │
│  TOTAL                │                      │ $200,000,000│ $200,000,000│
│                                                                 │
│  ✓ Balanced                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

### Screen 16: Participant Ledger

**Purpose:** View all ledger postings for a specific participant across all settlements.

**URL:** `/deals/:dealId/sfi/participants/:participantId/ledger`

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Participants    Ledger: Horizon Ventures Fund                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Journal         │ Date         │ Account     │ Debit       │ Credit │
│  ──────────────────────────────────────────────────────────────  │
│  JRN-2026-00002  │ Mar 5, 2026  │ 2100-PAYABLE│ $60,900,000 │ —      │
│  JRN-2026-00001  │ Feb 15, 2026 │ 2100-PAYABLE│ $22,700,000 │ —      │
│  ──────────────────────────────────────────────────────────────  │
│  Total Payable: $83,600,000                                     │
│                                                                 │
│  ┌─ Recoupment Status ──────────────────────────────────────┐  │
│  │ Cap: $45,000,000                                          │  │
│  │ Recouped: $45,000,000                                     │  │
│  │ Remaining: $0                                             │  │
│  │ Status: FULLY RECOUPED ✓                                  │  │
│  │ ██████████████████████████████████████████ 100%            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Screen 17: Documents

**Purpose:** Manage supporting documents attached to the deal, revenue batches, or settlements.

**URL:** `/deals/:dealId/sfi/documents`

```
┌─────────────────────────────────────────────────────────────────┐
│  Documents (6)    [Filter: All Types ▼]      [+ Upload]         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  File Name                │ Type            │ Linked To      │ Size │ Date     │
│  ──────────────────────────────────────────────────────────────  │
│  deal_contract_v1.pdf     │ CONTRACT        │ Deal           │ 5.2MB│ Feb 1    │
│  amendment_01.pdf         │ AMENDMENT       │ Deal           │ 1.1MB│ Feb 15   │
│  netflix_q4_report.pdf    │ REVENUE_REPORT  │ RB-2026-004    │ 2.3MB│ Mar 8    │
│  disney_license.pdf       │ REVENUE_REPORT  │ RB-2026-004    │ 1.1MB│ Mar 8    │
│  settlement_run2.pdf      │ SETTLEMENT_REPORT│ Run #2        │ 3.0MB│ Mar 5    │
│  audit_proof.pdf          │ AUDIT_REPORT    │ Run #2         │ 0.5MB│ Mar 6    │
│                                                                 │
│  ◄ 1 of 1 ►                                                    │
└─────────────────────────────────────────────────────────────────┘
```

**CRUD Operations:**

- **Create:** Upload form (file + docType + optional link to batch/run)
- **Read:** List with filters + detail view (metadata)
- **Delete:** Only if not linked to finalized settlement

---

### Screen 18: Proof & Audit Trail

**Purpose:** View all proof records and verify settlement integrity.

**URL:** `/deals/:dealId/sfi/audit`

```
┌─────────────────────────────────────────────────────────────────┐
│  Proof & Audit Trail                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Settlement Integrity ───────────────────────────────────┐  │
│  │                                                           │  │
│  │  Run #2 — FINALIZED                                       │  │
│  │  Hash: sha256:a3f8b2c9d1e4f567890abcdef...               │  │
│  │  Algorithm: SHA-256                                       │  │
│  │  Computed: Mar 5, 2026 14:30:00 UTC                       │  │
│  │  Input: Rule v3 × 2 batches × 5 participants             │  │
│  │  Total Revenue: $200,000,000                              │  │
│  │                                                           │  │
│  │  [🔍 Verify Integrity]  [📋 Copy Hash]                    │  │
│  │                                                           │  │
│  │  Run #1 — FINALIZED                                       │  │
│  │  Hash: sha256:7b2e1f3a8c9d0e5...                         │  │
│  │  ...                                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Correction Chain ───────────────────────────────────────┐  │
│  │                                                           │  │
│  │  Run #2 (NORMAL) ──→ Run #3 (CORRECTION)                 │  │
│  │    Original            Adjustment                         │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Navigation Structure

```
SFI Module (within FEA-SFI Admin Console)
│
├── 📊 Dashboard (/deals/:id/sfi)
│     └── Overview stats, latest settlement, quick actions
│
├── 👥 Participants (/deals/:id/sfi/participants)
│     ├── List view (table)
│     ├── Add participant (modal)
│     └── Participant detail (drawer) → includes ledger
│
├── 📋 Rules (/deals/:id/sfi/rules)
│     ├── Version list
│     ├── Create snapshot (multi-step form)
│     └── Snapshot detail (ruleSummary + frozen terms)
│
├── 💰 Revenue (/deals/:id/sfi/revenue)
│     ├── Batch list (with status filter)
│     ├── Create batch (form)
│     └── Batch detail (view + validate/reject actions)
│
├── ⚙️ Settlements (/deals/:id/sfi/settlements)
│     ├── Run list
│     ├── Create run (select rules + batches)
│     └── Run detail (waterfall breakdown + finalize)
│
├── 📒 Ledger (/deals/:id/sfi/ledger)
│     ├── Journal list
│     ├── Journal detail (debit/credit postings)
│     └── Participant ledger (per participant view)
│
├── 📎 Documents (/deals/:id/sfi/documents)
│     ├── Document list (with type filter)
│     └── Upload document (form)
│
└── 🔐 Audit (/deals/:id/sfi/audit)
      ├── Proof records
      └── Correction chain visualization
```

---

## Screen Count Summary

| Category     | Screens             | Implementation                                 |
| ------------ | ------------------- | ---------------------------------------------- |
| Dashboard    | 1                   | Full page                                      |
| Participants | 2                   | Page + modal/drawer                            |
| Rules        | 3                   | List page + detail page + multi-step form      |
| Revenue      | 3                   | List page + detail page + form                 |
| Settlements  | 2                   | List page + detail page (with inline preview)  |
| Ledger       | 3                   | Overview + journal detail + participant ledger |
| Documents    | 1                   | Page with upload modal                         |
| Audit        | 1                   | Full page                                      |
| **Total**    | **16 unique views** | **8 full pages + 8 modals/drawers/sub-views**  |

---

## Optimal Screen Reduction (if needed)

If Liang wants fewer screens for MVP, here's the minimum viable set:

| Priority | Screen                                          | Covers                   |
| -------- | ----------------------------------------------- | ------------------------ |
| P0       | Participants List + Add Modal                   | Managing parties         |
| P0       | Create Rule Snapshot (form)                     | Defining waterfall rules |
| P0       | Revenue Batch List + Create + Validate          | Revenue input lifecycle  |
| P0       | Settlement Run Detail (with preview + finalize) | Core computation flow    |
| P1       | Deal Dashboard                                  | Overview stats           |
| P1       | Rule Snapshot Detail                            | Viewing ruleSummary      |
| P1       | Ledger Overview + Journal Detail                | Accounting audit         |
| P2       | Documents                                       | Supporting files         |
| P2       | Audit Trail                                     | Proof verification       |

**MVP (P0): 4 screens** — enough to run a complete settlement end-to-end.
**Full (P0+P1): 7 screens** — production-ready admin experience.
**Complete (P0+P1+P2): 9 screens** — everything mapped to backend.

---

## Technical Integration Notes

### API Base URL

```
Production: https://sfi-api.{domain}/api/v1
Development: http://localhost:3001/api/v1
```

### All Endpoints Used (by screen)

| Endpoint                           | Method       | Used In Screen     |
| ---------------------------------- | ------------ | ------------------ |
| `/deals/:id`                       | GET          | Dashboard          |
| `/deals/:dealId/participants`      | GET, POST    | Participants       |
| `/deals/:dealId/rule-snapshots`    | GET, POST    | Rules              |
| `/rule-snapshots/:id`              | GET          | Rule Detail        |
| `/deals/:dealId/revenue-batches`   | GET, POST    | Revenue            |
| `/revenue-batches/:id`             | GET          | Revenue Detail     |
| `/revenue-batches/:id/validate`    | PATCH        | Revenue Detail     |
| `/revenue-batches/:id/reject`      | PATCH        | Revenue Detail     |
| `/deals/:dealId/settlement-runs`   | GET, POST    | Settlements        |
| `/settlement-runs/:id`             | GET          | Settlement Detail  |
| `/settlement-runs/:id/preview`     | POST         | Settlement Detail  |
| `/settlement-runs/:id/finalize`    | POST         | Settlement Detail  |
| `/settlement-runs/:id/corrections` | POST         | Settlement Detail  |
| `/deals/:dealId/ledger`            | GET          | Ledger             |
| `/ledger-journals/:id`             | GET          | Journal Detail     |
| `/participants/:id/ledger`         | GET          | Participant Ledger |
| `/documents`                       | POST, DELETE | Documents          |
| `/deals/:dealId/documents`         | GET, POST    | Documents          |

### Pagination Standard

All list endpoints support:

- `page` (default: 1)
- `limit` (default: 10)
- `sortBy` (field name)
- `sortOrder` (asc/desc)

### Status Color Coding Convention

| Color  | Meaning               | Used For                                        |
| ------ | --------------------- | ----------------------------------------------- |
| Gray   | Not started / Draft   | DRAFT deals, DRAFT settlement runs              |
| Yellow | Awaiting action       | PENDING batches, PREVIEWED runs                 |
| Green  | Active / Approved     | ACTIVE deals, VALIDATED batches, FINALIZED runs |
| Blue   | Completed / Processed | PROCESSED batches                               |
| Red    | Error / Rejected      | REJECTED batches, VOIDED runs, SUSPENDED deals  |
| Purple | Special               | CORRECTION runs                                 |

---

_This document maps every backend capability to a specific UI screen for the SFI admin portal. Use as the design blueprint for Figma wireframes and frontend implementation._
