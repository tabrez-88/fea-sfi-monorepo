# FEA Admin Portal — Page Overview & User Stories

**For:** Liang (Client Review)
**Date:** March 2026
**Total Pages Planned:** 42 screens across 10 sections

---

## What Is This Portal?

A single web app where you manage all your entertainment deals — from creating a deal, adding participants, uploading revenue, running settlements, all the way to financial reports and audit trails.

**Navigation:** Dashboard | Deals | Settlement | Transactions | Audit Log | Profile

---

## At a Glance

| Section | Pages | What It Does |
|---------|:-----:|--------------|
| Login & Auth | 3 | Sign in, register, forgot password |
| Dashboard | 1 | Overview of all deals + pending actions |
| Deals | 5 | Create, view, edit, manage deals |
| Participants | 3 | Add/view parties in a deal |
| Settlement (SFI Core) | 14 | Rules, revenue, settlement runs, corrections |
| Financial Reports | 8 | Ledger, statements, recoupment tracking |
| Documents | 2 | Upload & manage deal documents |
| Users & Roles | 3 | Team members, invites, permissions |
| Audit Log | 2 | Who did what, when |
| Proof & Verification | 1 | Cryptographic proof that settlements are correct |
| **Total** | **42** | |

---

## Section-by-Section Breakdown

### A. Login & Auth (3 pages)

| Page | What the user can do |
|------|---------------------|
| Login | Sign in with email + password |
| Register / Accept Invite | New users join via invite link |
| Forgot Password | Reset password via email |

---

### B. Dashboard (1 page)

| Page | What the user can do |
|------|---------------------|
| Global Dashboard | See all deals at a glance — total deals, active deals, pending reviews, total settled amount. Quick links to items that need attention (e.g., "2 revenue batches need validation"). Recent activity feed. |

---

### C. Deals (5 pages)

| Page | What the user can do |
|------|---------------------|
| Deals List | Browse all deals with tabs: Active / Draft / Closed. Search & filter. |
| Create Deal | Fill in deal name, description, type, currency, dates |
| Deal Overview | Per-deal dashboard — summary stats, participants count, revenue total, settlement status |
| Edit Deal | Update deal details (name, dates, status) |
| Deal Status | Move deal through stages: Draft → Active → Closed |

---

### D. Participants (3 pages)

| Page | What the user can do |
|------|---------------------|
| Participants List | See all parties in a deal — producers, investors, distributors, talent |
| Add Participant | Add a new party — set their name, role, and deal terms (fee %, profit share %, recoupment cap) |
| Participant Detail | View a participant's full profile — their role, terms, and payout history |

---

### E. Settlement — SFI Core (14 pages)

This is the heart of the system.

| Page | What the user can do |
|------|---------------------|
| All Settlements | See every settlement across ALL deals in one view. Filter by status, deal, type. |
| Pending Reviews | Action queue — revenue batches waiting for validation + settlements waiting for finalization |
| Rule Snapshots List | See all versions of deal rules (immutable once created) |
| Rule Snapshot Detail | View frozen deal terms — who gets what %, fee structure, recoupment caps. Auto-generated plain-English summary. |
| Create Rule Snapshot | Define deal terms: distribution fees, investor recoupment, profit splits. System validates totals = 100%. |
| Revenue Batches List | See all revenue submissions for a deal, with status badges |
| Revenue Batch Detail | View batch details — amount, period, line items. Actions: Validate or Reject. |
| Create Revenue Batch | Submit new revenue — enter amount, reporting period, attach source documents |
| Settlement Runs List | See all settlement runs for a deal — status, type (Normal vs Correction), amounts |
| Settlement Run Detail | **The key screen.** Full 4-phase waterfall breakdown: Gross Revenue → Distribution Fees → Investor Recoupment → Net Profit Split. Shows exactly who gets what and why. |
| Create Settlement Run | Pick a rule snapshot + validated revenue batches → create a new settlement |
| Create Correction Run | Fix a finalized settlement without modifying the original — creates a new correction entry |
| Correction Detail | View correction alongside the original — what changed, why, and the accounting impact |
| Settlement Comparison | Side-by-side: Original vs Correction — per-participant payout differences |

---

### F. Financial Reports (8 pages)

| Page | What the user can do |
|------|---------------------|
| Revenue Batches (Global) | See all revenue across all deals in one place |
| Ledger Overview | All accounting journals for a deal — debits and credits, always balanced |
| Journal Detail | Drill into a single journal — see every debit/credit posting per participant |
| Correction Journal | Same as above but for correction entries — clearly marked as additive (originals untouched) |
| Participant Ledger | Per-participant transaction history — every payout they've received, from which settlement |
| Recoupment Report | Investor progress bars — how much of their investment has been recovered, carry-forward tracking |
| Participant Statement | Printable/exportable statement for one participant — all payouts across all settlements. Export as PDF/CSV. |
| Settlement Summary | Financial summary report — total revenue, fees, recoupment, profit distributed. Filterable by deal & period. |

---

### G. Documents (2 pages)

| Page | What the user can do |
|------|---------------------|
| Documents List | Browse all uploaded documents for a deal |
| Upload Document | Attach contracts, invoices, source documents to a deal |

---

### H. Users & Roles (3 pages)

| Page | What the user can do |
|------|---------------------|
| Team Members | See who has access — name, role, status |
| Invite Member | Invite someone via email — assign their role |
| Roles & Permissions | Configure what each role can do (Owner, Admin, Finance, Viewer, etc.) |

---

### I. Audit Log (2 pages)

| Page | What the user can do |
|------|---------------------|
| Audit Log | Searchable log of every action — who created/edited/finalized what, when. Filter by user, action type, date. |
| Audit Entry Detail | Full detail of a single action — before/after values, user info, timestamp |

---

### J. Proof & Verification (1 page)

| Page | What the user can do |
|------|---------------------|
| Proof & Audit Trail | View SHA-256 proof hashes for every finalized settlement. One-click "Verify Integrity" re-computes and confirms the settlement hasn't been tampered with. Visual trace: revenue in → rules applied → settlement engine → payouts out. Correction chain visualization. |

---

## User Stories

Each story follows a real scenario. Grouped by what the user is trying to accomplish.

---

### Deal Setup

**US-1: Create a new deal**
- I log in → click "New Deal" → enter deal name, type (Film), currency (USD), dates
- Deal is created in DRAFT status
- I can edit it later or move it to ACTIVE when ready

**US-2: Add participants to a deal**
- I open "The Last Horizon" → Participants tab → "Add Participant"
- I add 5 parties:
  - **Global Cinema Partners** — Distributor, 12% fee
  - **Horizon Ventures Fund** — Investor, $45M recoupment cap, priority 1
  - **Pacific Capital Group** — Investor, $25M recoupment cap, priority 2
  - **Zenith Pictures** — Producer, 65% net profit
  - **Sarah Chen** — Talent, 8% net profit
- Each participant has a clear role and defined terms

---

### Rules & Revenue

**US-3: Create a rule snapshot (freeze the deal terms)**
- I go to Rules tab → "Create Rule Snapshot"
- I define: 12% distribution fee, recoupment caps, profit split percentages
- System validates that profit splits total 100%
- Once saved, this rule snapshot is **permanently frozen** — can never be edited
- A plain-English summary is auto-generated so anyone can understand the terms

**US-4: Submit and validate revenue**
- Accountant uploads a revenue batch: $200M, period "Apr–Sep 2026"
- Batch status = PENDING
- I review the batch → check the numbers → click "Validate"
- Status changes to VALIDATED — now it can be used in a settlement
- If something looks wrong, I click "Reject" with a reason

---

### Settlement (Core Flow)

**US-5: Run a settlement end-to-end**
- I go to Settlements tab → "New Settlement"
- I select: Rule Snapshot v3 + 2 validated revenue batches ($200M total)
- Settlement is created as DRAFT
- I click "Preview" — system computes the full 4-phase waterfall:
  1. **Gross Receipts:** $200M
  2. **Distribution Fees:** Global Cinema gets $24M (12%)
  3. **Recoupment:** Horizon gets $45M, Pacific gets $25M (investors paid back first)
  4. **Net Profit:** Remaining $106M split — Zenith 65%, Horizon 15%, Pacific 12%, Sarah 8%
- I review the numbers → click "Finalize"
- Settlement is **permanently locked** — ledger entries created, proof hash generated
- Revenue batches automatically marked as PROCESSED

**US-6: Handle a revenue correction**
- After finalizing, we discover $5M was under-reported
- I click "Create Correction Run" on the finalized settlement
- I select the correction revenue batch ($5M), enter the reason
- System runs the same 4-phase waterfall on just the $5M
- Original settlement **stays untouched** — correction is a new, separate entry
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
  - Horizon Ventures: $45M / $45M = **100% recouped**
  - Pacific Capital: $25M / $25M = **100% recouped**
- History shows carry-forward: Horizon was only partially recouped in Settlement #1, carried $23.25M forward, completed in Settlement #2

**US-10: Generate a participant statement**
- I click on Horizon Ventures → "Generate Statement"
- One-page summary shows:
  - Settlement #1: Recoupment $21.75M
  - Settlement #2: Recoupment $23.25M + Net Profit $15.9M
  - Settlement #3 (Correction): Net Profit $660K
  - **Total: $61.56M**
- All amounts are verified against proof hashes
- I export as PDF to send to the investor

---

### Verification & Audit

**US-11: Verify a settlement hasn't been tampered with**
- I go to Proof & Audit Trail
- Every finalized settlement shows its SHA-256 hash
- I click "Verify Integrity" on Settlement #2
- System re-computes using the same inputs (rule + revenue)
- Result: hash matches → **settlement is deterministic and untampered**

**US-12: Track who did what**
- I open Audit Log
- I can see entries like:
  - "John finalized Settlement Run #2 — Mar 5, 16:30"
  - "Sarah validated Revenue Batch RB-2026-003 — Mar 4, 10:15"
  - "Admin created Rule Snapshot v3 — Mar 1, 09:00"
- I can filter by user, action type, or date range

---

### Team Management

**US-13: Invite a team member**
- I go to Team → "Invite Member"
- I enter their email and assign a role (e.g., Finance Manager)
- They receive an invite email → click link → set password → they're in
- Their access is limited to what their role allows

---

## Settlement Flow Summary

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
```

If something needs correcting after finalization:

```
9.  Create Correction Run (new entry, original untouched)
10. Preview → Finalize the correction
11. Compare original vs correction
```

---

## Key Principles

- **Immutable rules** — Once a rule snapshot is created, it can never be edited. Create a new version instead.
- **Immutable settlements** — Once finalized, a settlement can never be changed. Corrections are separate entries.
- **Double-entry accounting** — Every debit has a matching credit. Ledger is always balanced.
- **Cryptographic proof** — Every settlement generates a SHA-256 hash. Re-verify anytime.
- **Full audit trail** — Every action is logged with who, what, and when.
- **Carry-forward balances** — If an investor isn't fully recouped in one settlement, the balance automatically carries to the next.

---

*42 pages. 13 user stories. Covers Milestones 2A through 3.*
