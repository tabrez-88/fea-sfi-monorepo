# FEA-SFI Admin — Engineering Execution Workflow

This folder is the **operating manual** for executing each sprint of the FEA-SFI Admin Portal build. It enforces a strict **Notion → Backend → Frontend** sequence so we never start a screen whose endpoints don't exist yet.

The goal is simple: **before any FE work begins on a sprint, every backend dependency for every ticket in that sprint must be confirmed in writing.**

---

## The Three-Gate Workflow

Every sprint passes through three gates. You cannot skip a gate. Each gate produces an artifact that lives in this folder.

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  GATE 1         │     │  GATE 2          │     │  GATE 3          │
│  Notion Check   │ ──▶ │  BE Verification │ ──▶ │  FE Execution    │
│                 │     │                  │     │                  │
│  (this folder)  │     │  (this folder)   │     │  (apps/sfi-admin)│
└─────────────────┘     └──────────────────┘     └──────────────────┘
     artifact:                artifact:                 artifact:
   readiness note         sprint-N-be-verification    PR + screenshots
```

---

## Gate 1 — Notion Readiness Check

**Purpose:** confirm every ticket in the target sprint is design-approved and ready for engineering.

**What to verify in Notion** (Engineering Tasks DB, filtered by Sprint):

| Check           | Pass criteria                                                           |
| --------------- | ----------------------------------------------------------------------- |
| Status          | All tickets are in **"Ready for dev"** (or **"Done"** for design phase) |
| Screen field    | Every ticket has a `Screen` value matching the design spec              |
| Sprint relation | Ticket is correctly linked to the target Sprint page                    |
| Priority        | Must-Have tickets are not blocked or rejected                           |

**If any ticket is still in `Design Review`, `Design Rejected`, `Blocked`, or `Not Started` → STOP.** Resolve with the design owner before opening Gate 2.

**Artifact:** a one-line entry in the sprint verification doc (Gate 2 artifact) under the "Gate 1: Notion Readiness" section, listing each ticket ID, status, and a ✅ / ❌.

---

## Gate 2 — Backend Verification

**Purpose:** prove that every API endpoint, DTO, and database field needed by the sprint's screens already exists in [apps/sfi-api/](../../apps/sfi-api/). No assumptions, no "we'll add it later."

**Process for each screen ticket:**

1. Open the screen design page in Notion (e.g. "Design & Build: Login Page").
2. Find the **`### API Endpoints`** section in the design spec.
3. For each endpoint listed, locate it in the BE source:
   - Controller method exists? ([apps/sfi-api/src/modules/](../../apps/sfi-api/src/modules/))
   - Service method backs it with real Prisma (not mock)?
   - Request DTO matches the screen's field specs?
   - Response DTO returns every field the screen renders?
   - Prisma schema has every column referenced?
4. Mark the endpoint with one of three statuses:

| Status         | Meaning                                                              |
| -------------- | -------------------------------------------------------------------- |
| ✅ **Ready**   | Endpoint exists, returns real data, DTO matches screen needs         |
| ⚠️ **Partial** | Endpoint exists but DTO/filter/field is missing or returns mock data |
| ❌ **Missing** | No controller route, no service method, or no DB support at all      |

5. For every ⚠️ or ❌, write a **gap note** that says exactly what is missing and where it would live (file path + intended method signature).

**Artifact:** [`sprints/sprint-N-be-verification.md`](./sprints/) — see the template section below.

**Exit criteria for Gate 2:** every screen ticket either has all green checks, OR every gap has a tracked follow-up ticket in Notion. No silent gaps.

---

## Gate 3 — Frontend Execution

Only after Gate 2 closes do we touch the FE app. Each screen ticket becomes an FE PR that wires the design to the verified endpoints. Gate 3 lives in the FE app, not in this folder, but the link to the merged PR should be appended to the Gate 2 artifact for traceability.

---

## Folder Layout

```
docs/execution/
├── README.md                              ← this file (the workflow itself)
└── sprints/
    ├── sprint-1-be-verification.md        ← MS-1: Shell & Deals
    ├── sprint-2-be-verification.md        ← MS-2: Participants & Rules  (when reached)
    ├── sprint-3-be-verification.md        ← MS-3: Revenue & Documents   (when reached)
    ├── sprint-4-be-verification.md        ← MS-4: Settlement Core       (when reached)
    └── sprint-5-be-verification.md        ← MS-5: Reports & Proof       (when reached)
```

One file per sprint. Never edit a closed sprint's file — corrections go to a follow-up ticket and are recorded on the next sprint's file.

---

## Sprint Verification Doc — Template

Copy this template into a new file under `sprints/` when starting a sprint.

```markdown
# Sprint N — MS-N: <Milestone Name> — BE Verification

**Sprint Page:** <Notion URL>
**Milestone:** MS-N: <Name>
**Verification Date:** YYYY-MM-DD
**Verifier:** <name>
**Overall Status:** 🟢 Ready for FE / 🟡 Ready with gaps / 🔴 Blocked

---

## Gate 1 — Notion Readiness

| Task ID | Task Name | Notion Status | Pass |
| ------- | --------- | ------------- | ---- |
| FEA-1   | …         | Ready for dev | ✅   |
| FEA-2   | …         | Design Review | ❌   |

**Gate 1 verdict:** PASS / FAIL — <one-line reason>

---

## Gate 2 — Backend Verification

### Ticket: FEA-X — <Task Name>

**Screen:** X.Y <Screen Name>
**Notion:** <URL>
**Design spec endpoints:**

| Method | Path        | Status     | Implementation                                                    | Notes                 |
| ------ | ----------- | ---------- | ----------------------------------------------------------------- | --------------------- |
| POST   | /auth/login | ❌ Missing | —                                                                 | No auth module exists |
| GET    | /deals      | ✅ Ready   | apps/sfi-api/src/modules/deals/controllers/deals.controller.ts:39 | —                     |

**Field-level checks** (only when an endpoint is ⚠️ Partial):

- DTO `XxxResponseDto` is missing field `participantsCount` needed by stat card
- GET /deals does not accept `status` query param needed by Deals List filter tabs

**Gaps for this ticket:**

1. **<short title>** — file: `…`, intended signature: `…`, blocks screen section: `…`
2. **<short title>** — …

---

### Ticket: FEA-Y — <next>

…

---

## Summary

**Tickets fully ready:** N / total
**Tickets with gaps:** N
**Tickets blocked:** N

### Consolidated gap list (drives follow-up work)

| #   | Gap                             | Type           | Owner | Notion ticket |
| --- | ------------------------------- | -------------- | ----- | ------------- |
| 1   | POST /auth/login does not exist | Missing module | BE    | <create one>  |

---

## Sign-off

- [ ] All gaps have a Notion follow-up ticket
- [ ] Gate 2 status communicated to FE lead
- [ ] FE execution authorized to begin

**Authorized by:** ********\_******** **Date:** ******\_******
```

---

## Status Legend (used everywhere in this folder)

| Symbol | Meaning                                                                    |
| ------ | -------------------------------------------------------------------------- |
| ✅     | Ready — fully implemented, real data, matches screen needs                 |
| ⚠️     | Partial — exists but incomplete (missing field, mock data, missing filter) |
| ❌     | Missing — no implementation at all                                         |
| 🟢     | Sprint is FE-ready                                                         |
| 🟡     | Sprint is FE-ready with tracked gaps                                       |
| 🔴     | Sprint is blocked, FE must not start                                       |

---

## Why this exists

We learned the hard way that starting FE work against assumed endpoints wastes a lot of time when the backend turns out not to support a filter, a field, or a whole resource. This folder makes the dependency check **explicit, written, and reviewable** — so the only surprises during the sprint are the ones we chose to accept up-front.
