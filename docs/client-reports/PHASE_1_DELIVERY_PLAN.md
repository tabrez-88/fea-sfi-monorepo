# FEA Admin Portal — Phase 1 Delivery Plan

**For:** Liang (Client)
**Date:** March 2026
**Scope:** 32 screens from [Phase 1 Overview](CLIENT_ADMIN_PORTAL_OVERVIEW_V2.md)

---

## Overview

This document breaks the 32-screen Phase 1 scope into 5 deliverable milestones. Each milestone is a self-contained batch of screens that goes through design review, your approval, frontend build, and staging deployment — so you see real progress every ~2 weeks instead of waiting months for a big reveal.

All backend APIs are already built. This plan covers design and frontend only.

---

## How Each Milestone Works

Every milestone follows the same cycle:

```
Design (Figma)  →  Your Review  →  Approve  →  FE Build  →  Staging Preview
    5-7 days        1-2 days       ✓ / ✗       3-5 days      Live link
```

- You review the design in Figma first
- If approved, we build it and deploy to staging
- You can interact with it on staging before we move to the next milestone
- If changes needed, we revise before building

---

## Milestone Breakdown

Each milestone groups related screens so you can review and approve them as a complete feature set. We start with the shell (login, navigation, deals), then build inward toward the core settlement engine, and finish with reports and proof.

### MS-1: Shell & Deals (8 screens)

The foundation — navigation, layout, and deal management.

| Screen | Section |
|--------|---------|
| Login | Auth |
| Register | Auth |
| Forgot Password | Auth |
| Global Dashboard | Dashboard |
| Deals List | Deals |
| Create Deal | Deals |
| Deal Overview | Deals |
| Edit Deal | Deals |

**What You'll See:**
- Fully working login/register flow
- Dashboard with deal summary cards and pending action counts
- Create a deal, browse deals by status (Active/Draft/Closed), edit deal details
- Navigation bar: Dashboard - Deals - Settlement - Documents - Report - Proof

---

### MS-2: Participants & Rules (6 screens)

Deal setup — add parties and define the waterfall rules.

| Screen | Section |
|--------|---------|
| Participants List | Participants |
| Add Participant | Participants |
| Participant Detail | Participants |
| Rule Snapshots List | Rules |
| Rule Snapshot Detail | Rules |
| Create Rule Snapshot | Rules |

**What You'll See:**
- Add participants with roles (Distributor, Investor, Talent, etc.) and color-coded badges
- Participant detail with payout history
- Create immutable rule snapshots with a multi-step form (basic settings → participant rules → review & confirm)
- Rule detail page with visual profit split breakdown and plain-English summary
- Live validation: profit percentages must total 100%

---

### MS-3: Revenue & Documents (5 screens)

Input layer — submit revenue and attach supporting files.

| Screen | Section |
|--------|---------|
| Revenue Batches List | Revenue |
| Revenue Batch Detail | Revenue |
| Create Revenue Batch | Revenue |
| Documents List | Documents |
| Upload Document | Documents |

**What You'll See:**
- Submit revenue batches with amount, period, and source
- Status lifecycle with color badges: Pending (yellow) → Validated (green) → Processed (blue)
- Validate or Reject batches with confirmation modals
- Upload and browse deal documents (contracts, invoices, reports)

---

### MS-4: Settlement Core (8 screens)

The money screen — run settlements, view the waterfall, handle corrections.

| Screen | Section |
|--------|---------|
| All Settlements | Settlement |
| Pending Reviews | Settlement |
| Settlement Runs List | Settlement |
| Settlement Run Detail | Settlement |
| Create Settlement Run | Settlement |
| Create Correction Run | Settlement |
| Correction Detail | Settlement |
| Settlement Comparison | Settlement |

**What You'll See:**
- Create a settlement by selecting a rule snapshot + validated revenue batches
- Preview the full waterfall breakdown: Gross Revenue → Distribution Fees → Recoupment → Net Profit Split (phases shown conditionally — simple deals may only show Gross → Split)
- Finalize with irreversible confirmation modal
- Proof hash and timestamp displayed on every finalized settlement
- Create correction runs (original untouched, correction is a separate entry)
- Side-by-side comparison: Original vs Correction per participant

---

### MS-5: Reports & Proof (5 screens)

Output layer — financial reports and cryptographic verification.

| Screen | Section |
|--------|---------|
| Ledger Overview | Financial Reports |
| Journal Detail | Financial Reports |
| Recoupment Report | Financial Reports |
| Participant Statement | Financial Reports |
| Proof Overview | Proof |

**What You'll See:**
- Double-entry ledger: every journal balances (debits = credits)
- Drill into journal postings per participant
- Investor recoupment progress bars with carry-forward tracking
- Exportable participant statements (PDF/CSV)
- Proof table: Settlement → SHA-256 Hash → Timestamp → Status

---

## Timeline Overview

Estimated schedule assuming design and build run in parallel where possible. Each milestone takes ~2 weeks end-to-end. Review/approval time depends on you — faster feedback = faster delivery.

| Milestone | Screens | Design | Review | Build | Staging |
|-----------|:-------:|:------:|:------:|:-----:|:-------:|
| MS-1: Shell & Deals | 8 | Week 1-2 | Week 2 | Week 2-3 | Week 3 |
| MS-2: Participants & Rules | 6 | Week 3-4 | Week 4 | Week 4-5 | Week 5 |
| MS-3: Revenue & Documents | 5 | Week 5-6 | Week 6 | Week 6-7 | Week 7 |
| MS-4: Settlement Core | 8 | Week 7-8 | Week 8 | Week 8-9 | Week 9 |
| MS-5: Reports & Proof | 5 | Week 9-10 | Week 10 | Week 10-11 | Week 11 |

**Total: ~11 weeks for 32 screens**

Each milestone delivers something you can click through on staging. No waiting until the end.

---

## Backend Status

All backend APIs for these 32 screens are **already built and tested**. The engine, database, and endpoints are production-ready. This plan is purely design + frontend.

| Backend | Status |
|---------|--------|
| Deals, Participants | Ready |
| Rule Snapshots + Validation | Ready |
| Revenue Batches + Lifecycle | Ready |
| Settlement Engine (4-phase waterfall) | Ready |
| Ledger (double-entry) | Ready |
| Proof Verification (SHA-256) | Ready |
| Audit Log | Ready |
| Documents | API needed |

---

*32 screens. 5 milestones. Design → Approve → Build → Staging. You see progress every 2 weeks.*
