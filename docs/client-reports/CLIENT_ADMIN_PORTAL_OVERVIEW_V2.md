# FEA Admin Portal — Phase 1 Scope (Post-Review)

**For:** Liang (Client Review)
**Date:** March 2026
**Version:** 2.0 — Updated after scope discussion
**Phase 1 Total:** 32 screens across 8 sections

---

## Overview

This document outlines the Phase 1 design plan for the FEA Admin Console, updated after our scope review. It covers every page we're building in Phase 1, what each page does, and real-world user stories showing how the portal works in practice.

The goal is to deliver a fully working, self-contained SFI Admin that can be used and demoed, then when FEA is ready with its own deal management, it just calls the same SFI API. Nothing gets rebuilt.

## What Is This Portal?

A single web app where you manage all your entertainment deals, from creating a deal, adding participants, uploading revenue, running settlements, all the way to financial reports and on-chain proof verification.

**Navigation:** Dashboard - Deals - Settlement - Report - Proof

---

## Total Planned Design for Phase 1 In Summary

Below is a high-level summary of all planned for phase 1 pages grouped by section. This gives you a quick overview of the portal's scope before diving into the details.

| Section | Pages | What It Does |
|---------|:-----:|--------------|
| Login & Auth | 3 | Sign in, register, forgot password |
| Dashboard | 1 | Overview of all deals + pending actions |
| Deals | 4 | Create, view, edit deals |
| Participants | 3 | Add/view parties in a deal |
| Settlement | 14 | Rules, revenue, settlement runs, corrections |
| Financial Reports | 4 | Ledger, recoupment, statements |
| Documents | 2 | Upload & manage deal documents |
| Proof & Verification | 1 | Cryptographic proof that settlements are correct |
| **Total** | **32** | |

---

## What's Deferred to Phase 2?

These features are part of the full 42-screen vision but not needed for a working Phase 1. Phase 1 focuses on the core end-to-end flow, everything below gets added once that foundation is solid.

| Feature | Why Phase 2 |
|---------|-------------|
| Users & Roles (3 pages) | Team management, invites, permissions |
| Audit Log UI (2 pages) | Backend still logs everything, UI viewer comes later |
| Advanced Reports (4 pages) | Global Revenue, Correction Journal, Participant Ledger, Settlement Summary |
| Full Proof Explorer | Verify Integrity button, visual trace, correction chain viz |

---

## Section By Section Breakdown

Each section is broken down into individual pages showing exactly what the user can do on each screen. This is the detailed view of everything listed in the summary above.

### Login & Auth (3 pages)

| Page | What the user can do |
|------|---------------------|
| Login | Sign in with email + password |
| Register | Sign up for new account |
| Forgot Password | Reset password via email |

---

### Dashboard (1 page)

| Page | What the user can do |
|------|---------------------|
| Global Dashboard | See all deals at a glance, total deals, active deals, pending reviews, total settled amount. Quick links to items that need attention. |

---

### Deals (4 pages)

| Page | What the user can do |
|------|---------------------|
| Deals List | Browse all deals with tabs: Active / Draft / Closed. Search & filter. |
| Create Deal | Fill in deal name, description, type, currency, dates |
| Deal Overview | Per-deal dashboard, summary stats, participants count, revenue total, settlement status |
| Edit Deal | Update deal details (name, dates, status) |

---

### Participants (3 pages)

| Page | What the user can do |
|------|---------------------|
| Participants List | See all parties in a deal, producers, investors, distributors, talent |
| Add Participant | Add a new party, set their name, role, and deal terms (fee %, profit share %, recoupment cap) |
| Participant Detail | View a participant's full profile, their role, terms, and payout history |

---

### Settlement (14 pages)

| Page | What the user can do |
|------|---------------------|
| All Settlements | See every settlement across ALL deals in one view. Filter by status, deal, type. |
| Pending Reviews | Action queue, revenue batches waiting for validation + settlements waiting for finalization |
| Rule Snapshots List | See all versions of deal rules (immutable once created) |
| Rule Snapshot Detail | View frozen deal terms, who gets what %, fee structure, recoupment caps. Auto-generated plain-English summary. |
| Create Rule Snapshot | Define deal terms: distribution fees, investor recoupment, profit splits. System validates totals = 100%. |
| Revenue Batches List | See all revenue submissions for a deal, with status badges |
| Revenue Batch Detail | View batch details, amount, period, line items. Actions: Validate or Reject. |
| Create Revenue Batch | Submit new revenue, enter amount, reporting period, attach source documents |
| Settlement Runs List | See all settlement runs for a deal, status, type (Normal vs Correction), amounts |
| Settlement Run Detail | The key screen. Full 4-phase waterfall breakdown: Gross Revenue → Distribution Fees → Investor Recoupment → Net Profit Split. Shows exactly who gets what and why. |
| Create Settlement Run | Pick a rule snapshot + validated revenue batches → create a new settlement |
| Create Correction Run | Fix a finalized settlement without modifying the original, creates a new correction entry |
| Correction Detail | View correction alongside the original, what changed, why, and the accounting impact |
| Settlement Comparison | Side-by-side: Original vs Correction, per-participant payout differences |

---

### Financial Reports (4 pages)

| Page | What the user can do |
|------|---------------------|
| Ledger Overview | All accounting journals for a deal, debits and credits, always balanced |
| Journal Detail | Drill into a single journal, see every debit/credit posting per participant |
| Recoupment Report | Investor progress bars, how much of their investment has been recovered, carry-forward tracking |
| Participant Statement | Printable/exportable statement for one participant, all payouts across all settlements. Export as PDF/CSV. |

---

### Documents (2 pages)

| Page | What the user can do |
|------|---------------------|
| Documents List | Browse all uploaded documents for a deal — contracts, invoices, source documents |
| Upload Document | Attach files to a deal — select document type, add description, upload file |

---

### Proof & Verification (1 page)

| Page | What the user can do |
|------|---------------------|
| Proof Overview | View on-chain proof hash (SHA-256) and timestamp for every finalized settlement. Simple table: Settlement → Hash → Timestamp → Status. SFI flagship feature — cryptographic proof that settlements are correct and untampered. |

---

## User Stories

User stories describe real-world scenarios, step-by-step examples of how someone would actually use the portal. These help us confirm that the design covers all the workflows you need.

---

### Deal Setup

**US-1: Create a new deal**
- I log in → click "New Deal" → enter deal name, type (Film), currency (USD), dates
- Deal is created in DRAFT status
- I can edit it later or move it to ACTIVE when ready

**US-2: Add participants to a deal**
- I open "The Last Horizon" → Participants tab → "Add Participant"
- I add 5 parties:
  - Global Cinema Partners, Distributor, 12% fee
  - Horizon Ventures Fund, Investor, $45M recoupment cap, priority 1
  - Pacific Capital Group, Investor, $25M recoupment cap, priority 2
  - Zenith Pictures, Producer, 65% net profit
  - Sarah Chen, Talent, 8% net profit
- Each participant has a clear role and defined terms

---

### Rules & Revenue

**US-3: Create a rule snapshot (freeze the deal terms)**
- I go to Rules tab → "Create Rule Snapshot"
- I define: 12% distribution fee, recoupment caps, profit split percentages
- System validates that profit splits total 100%
- Once saved, this rule snapshot is permanently frozen, can never be edited
- A plain-English summary is auto-generated so anyone can understand the terms

**US-4: Submit and validate revenue**
- Accountant uploads a revenue batch: $200M, period "Apr–Sep 2026"
- Batch status = PENDING
- I review the batch → check the numbers → click "Validate"
- Status changes to VALIDATED, now it can be used in a settlement
- If something looks wrong, I click "Reject" with a reason

---

### Settlement

**US-5: Run a settlement end-to-end**
- I go to Settlements tab → "New Settlement"
- I select: Rule Snapshot v3 + 2 validated revenue batches ($200M total)
- Settlement is created as DRAFT
- I click "Preview", system computes the full 4-phase waterfall:
  1. Gross Receipts: $200M
  2. Distribution Fees: Global Cinema gets $24M (12%)
  3. Recoupment: Horizon gets $45M, Pacific gets $25M (investors paid back first)
  4. Net Profit: Remaining $106M split, Zenith 65%, Horizon 15%, Pacific 12%, Sarah 8%
- I review the numbers → click "Finalize"
- Settlement is permanently locked, ledger entries created, proof hash generated
- Revenue batches automatically marked as PROCESSED

**US-6: Handle a revenue correction**
- After finalizing, we discover $5M was under-reported
- I click "Create Correction Run" on the finalized settlement
- I select the correction revenue batch ($5M), enter the reason
- System runs the same 4-phase waterfall on just the $5M
- Original settlement stays untouched, correction is a new, separate entry
- Both settlements are linked in a correction chain

**US-7: Compare original vs correction**
- I open the Comparison view
- Side-by-side table shows:
  - Original: $200M settled
  - Correction: $5M settled
  - Combined: $205M total per participant
- I can confirm the correction delta is correct

---

### Financial Tracking

**US-8: View the financial ledger**
- I go to Ledger tab → see all journals listed
- I click into a journal → every debit and credit posting is visible
- Total debits always equal total credits (balanced)
- Each posting ties to a specific participant and settlement phase

**US-9: Check investor recoupment progress**
- I open the Recoupment Report
- Progress bars show:
  - Horizon Ventures: $45M / $45M = 100% recouped
  - Pacific Capital: $25M / $25M = 100% recouped
- History shows carry-forward: Horizon was only partially recouped in Settlement #1, carried $23.25M forward, completed in Settlement #2

**US-10: Generate a participant statement**
- I click on Horizon Ventures → "Generate Statement"
- One-page summary shows:
  - Settlement #1: Recoupment $21.75M
  - Settlement #2: Recoupment $23.25M + Net Profit $15.9M
  - Settlement #3 (Correction): Net Profit $660K
  - Total: $61.56M
- All amounts are verified against proof hashes
- I export as PDF to send to the investor

---

### Verification

**US-11: View settlement proof**
- I go to Proof page
- Every finalized settlement shows its SHA-256 hash and timestamp
- I can confirm the settlement is cryptographically verified and untampered

---

## Phase 1 Settlement Flow

This is the core workflow — every deal follows this path:

```
1. Create Deal (Draft)
2. Add Participants (define roles & terms)
3. Create Rule Snapshot (freeze the terms)
4. Submit Revenue Batch (PENDING → VALIDATED)
5. Create Settlement Run (DRAFT)
6. Preview Settlement (see the waterfall breakdown)
7. Finalize Settlement (lock it forever)
8. View Ledger & Reports (debits = credits, always balanced)
9. View Proof (hash + timestamp on-chain)
```

If something needs correcting after finalization:

```
10. Create Correction Run (new entry, original untouched)
11. Preview → Finalize the correction
12. Compare original vs correction
```

---

## Key Principles

- **Immutable rules** — Once a rule snapshot is created, it can never be edited. Create a new version instead.
- **Immutable settlements** — Once finalized, a settlement can never be changed. Corrections are separate entries.
- **Double-entry accounting** — Every debit has a matching credit. Ledger is always balanced.
- **On-chain proof** — Every settlement generates a SHA-256 hash. SFI flagship feature.
- **Carry-forward balances** — If an investor isn't fully recouped in one settlement, the balance automatically carries to the next.

---

*32 pages. 11 user stories. Phase 1 — fully working, self-contained SFI Admin.*
