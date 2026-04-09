# SFI-FEA Platform — Milestone 1: Settlement Computation Engine

**Prepared for:** Client Review
**Date:** February 2026
**Version:** 1.0
**Status:** Delivered & Verified

---

## Overview

Milestone 1 delivers the **core financial settlement engine** — the brain of the SFI-FEA platform. This engine automates the complex process of splitting revenue among multiple parties in entertainment deals, replacing manual spreadsheet calculations with an **instant, auditable, and tamper-proof computation system**.

What previously required hours of manual work by financial teams now runs in **milliseconds** with **zero margin of error**.

---

## What We Built

### Settlement Computation Engine

A purpose-built financial computation engine that processes revenue through a **4-phase waterfall pipeline**:

```
    $150,000,000 Total Revenue
            │
            ▼
  ┌─────────────────────┐
  │  Phase 1: GROSS      │   Sum all revenue batches
  │  RECEIPTS            │   ─────────────────────────
  │                      │   → $150,000,000 confirmed
  └──────────┬──────────┘
             ▼
  ┌─────────────────────┐
  │  Phase 2: DISTRIBUTION│  Distributor takes their
  │  FEES                 │  fee off the top
  │                      │   ─────────────────────────
  │  15% × $150M         │   → $22,500,000 to Distributor
  │                      │   → $127,500,000 remaining
  └──────────┬──────────┘
             ▼
  ┌─────────────────────┐
  │  Phase 3: RECOUPMENT │  Investors recoup their
  │                      │  original investment
  │                      │   ─────────────────────────
  │  Investor A: $30M    │   → Investors get $50M back
  │  Investor B: $20M    │   → $77,500,000 remaining
  └──────────┬──────────┘
             ▼
  ┌─────────────────────┐
  │  Phase 4: NET PROFIT │  Remaining split by
  │  SPLIT               │  agreed percentages
  │                      │   ─────────────────────────
  │  70% / 15% / 10% / 5%│  → Everyone gets their share
  └─────────────────────┘
```

### Technical Highlights

| Feature | Detail |
|---------|--------|
| **Computation Speed** | Settlement calculated in <50ms regardless of deal complexity |
| **Deterministic Output** | Same input always produces the exact same result — verified with 100-run automated tests |
| **SHA-256 Proof Hash** | Every calculation generates a cryptographic fingerprint, making results tamper-proof and auditable |
| **Financial Precision** | All monetary calculations use 2-decimal fixed-point arithmetic — no floating-point rounding errors |
| **Atomic Transactions** | Settlement finalization writes allocations, proof records, and ledger entries in a single database transaction — all succeed or all fail |
| **Double-Entry Bookkeeping** | Automatic ledger journal creation with debit/credit postings per allocation |
| **Input Validation** | Engine validates participant references, percentage totals (must equal 100%), and negative amounts before processing |
| **Carry-Forward Balances** | Investors who haven't fully recouped from one revenue batch automatically carry the balance into the next |

### Test Coverage

The engine is backed by **29 automated tests** covering:

- Full waterfall computation with 5 participants and $150M revenue
- Partial recoupment when revenue is insufficient
- Multi-investor priority ordering
- Carry-forward balances across multiple revenue batches
- Zero revenue edge case
- Distribution fees combined with recoupment
- Input validation (5 error scenarios)
- Determinism verification (100 identical runs)

**All 29 tests pass.**

---

## Case Study: "The Last Horizon" — Feature Film Settlement

To demonstrate how the engine works in a real-world scenario, let's walk through a complete settlement for a fictional feature film deal.

### The Deal

**Film:** The Last Horizon (Sci-Fi Feature Film)
**Total Revenue:** $200,000,000 (worldwide box office + streaming)

**Parties Involved:**

| Party | Role | Deal Terms |
|-------|------|------------|
| **Zenith Pictures** | Production Studio | Receives 65% of net profits |
| **Global Cinema Partners** | Distributor | Receives 12% distribution fee (off the top) |
| **Horizon Ventures Fund** | Lead Investor | Invested $45,000,000 — recoups first, then 15% of net profits |
| **Pacific Capital Group** | Co-Investor | Invested $25,000,000 — recoups second, then 12% of net profits |
| **Sarah Chen** | Director/Talent | Receives 8% of net profits |

### Expected Calculation

**Phase 1 — Gross Receipts:**
$200,000,000 total revenue confirmed

**Phase 2 — Distribution Fees:**
Global Cinema Partners takes 12% off the top
→ $24,000,000 to Global Cinema Partners
→ $176,000,000 remaining

**Phase 3 — Recoupment (priority order):**
Horizon Ventures Fund recoups $45,000,000 (Priority 1)
→ $131,000,000 remaining
Pacific Capital Group recoups $25,000,000 (Priority 2)
→ $106,000,000 remaining

**Phase 4 — Net Profit Split ($106,000,000):**

| Party | Percentage | Amount |
|-------|-----------|--------|
| Zenith Pictures | 65% | $68,900,000 |
| Horizon Ventures Fund | 15% | $15,900,000 |
| Pacific Capital Group | 12% | $12,720,000 |
| Sarah Chen | 8% | $8,480,000 |
| **Total Net Profit Split** | **100%** | **$106,000,000** |

### Total Payout Summary

| Party | Distribution Fee | Recoupment | Net Profit | **Grand Total** |
|-------|-----------------|------------|------------|-----------------|
| Global Cinema Partners | $24,000,000 | — | — | **$24,000,000** |
| Horizon Ventures Fund | — | $45,000,000 | $15,900,000 | **$60,900,000** |
| Pacific Capital Group | — | $25,000,000 | $12,720,000 | **$37,720,000** |
| Zenith Pictures | — | — | $68,900,000 | **$68,900,000** |
| Sarah Chen | — | — | $8,480,000 | **$8,480,000** |
| **TOTAL** | **$24,000,000** | **$70,000,000** | **$106,000,000** | **$200,000,000** |

Every dollar is accounted for. No rounding errors. No discrepancies.

---

## Live Implementation — Step by Step in Swagger

You can reproduce the full settlement scenario above using our interactive API documentation.

**Two guides are provided:**

1. **[Swagger Tutorial](SWAGGER_TUTORIAL.md)** — If you are new to Swagger UI, start here. This guide explains how to open, navigate, and execute API calls step by step with screenshots.

2. **[Settlement Live Demo](SETTLEMENT_LIVE_DEMO.md)** — The complete 9-step walkthrough to create a deal, add participants, define rules, register revenue, and run the settlement engine. Each step includes:
   - What the step does and why it matters
   - The exact request body to send
   - The full expected response (matching the actual API format)
   - What to check in the response to confirm it worked
   - Which IDs to save for the next step

### Quick Overview of the 9 Steps

| Step | Endpoint | Action | Key Output |
|------|----------|--------|------------|
| 1 | `POST /api/v1/deals` | Create the deal | Deal ID |
| 2 | `POST /api/v1/deals/{dealId}/participants` | Add 5 participants | 5 Participant IDs |
| 3 | `POST /api/v1/deals/{dealId}/rule-snapshots` | Define settlement rules | Rule Snapshot ID |
| 4 | `POST /api/v1/deals/{dealId}/revenue-batches` | Register $200M revenue | Revenue Batch ID |
| 5 | `PATCH /api/v1/revenue-batches/{id}/validate` | Approve revenue | Status: VALIDATED |
| 6 | `POST /api/v1/deals/{dealId}/settlement-runs` | Create settlement run | Settlement Run ID |
| 7 | `POST /api/v1/settlement-runs/{id}/preview` | Run the engine | Full allocation breakdown |
| 8 | `POST /api/v1/settlement-runs/{id}/finalize` | Lock results permanently | Proof hash + Ledger entries |
| 9 | `GET /api/v1/settlement-runs/{id}` | View complete audit trail | Full settlement record |

Open the Swagger documentation at: **http://localhost:3001/docs**

---

## API Endpoints Summary

### Settlement Flow (9 endpoints used in demo)

| # | Endpoint | Method | Purpose |
|---|----------|--------|---------|
| 1 | `/api/v1/deals` | POST | Create a new deal |
| 2 | `/api/v1/deals/{dealId}/participants` | POST | Add participant to deal |
| 3 | `/api/v1/deals/{dealId}/rule-snapshots` | POST | Define settlement rules (immutable snapshot) |
| 4 | `/api/v1/deals/{dealId}/revenue-batches` | POST | Register revenue for settlement |
| 5 | `/api/v1/revenue-batches/{id}/validate` | PATCH | Approve revenue (compliance gate) |
| 6 | `/api/v1/deals/{dealId}/settlement-runs` | POST | Create settlement run in draft |
| 7 | `/api/v1/settlement-runs/{id}/preview` | POST | Execute engine — compute allocations |
| 8 | `/api/v1/settlement-runs/{id}/finalize` | POST | Lock results + create ledger entries |
| 9 | `/api/v1/settlement-runs/{id}` | GET | View complete settlement details |

### Additional Endpoints (available)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/deals` | GET | List all deals (with pagination) |
| `/api/v1/deals/{id}` | GET | Get deal details with participants |
| `/api/v1/deals/{dealId}/participants` | GET | List participants (with pagination) |
| `/api/v1/deals/{dealId}/rule-snapshots` | GET | List rule versions |
| `/api/v1/rule-snapshots/{id}` | GET | Get specific rule snapshot detail |
| `/api/v1/deals/{dealId}/revenue-batches` | GET | List revenue batches |
| `/api/v1/revenue-batches/{id}` | GET | Get revenue batch detail |
| `/api/v1/revenue-batches/{id}/reject` | PATCH | Reject a revenue batch |
| `/api/v1/deals/{dealId}/settlement-runs` | GET | List all settlement runs |
| `/api/v1/settlement-runs/{id}/corrections` | POST | Create correction run for adjustments |
| `/api/v1/health` | GET | System health check |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                 (Browser / Postman / Swagger UI)                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS REST API
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                            │
│                                                                  │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│   │   Deals    │  │   Rules    │  │  Revenue   │  │Settlement│ │
│   │ Controller │  │ Controller │  │ Controller │  │Controller│ │
│   └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └────┬─────┘ │
│         │               │               │               │       │
│   ┌─────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐  ┌────▼─────┐ │
│   │   Deals    │  │   Rules    │  │  Revenue   │  │Settlement│ │
│   │  Service   │  │  Service   │  │  Service   │  │ Service  │ │
│   └────────────┘  └────────────┘  └────────────┘  └────┬─────┘ │
│                                                         │       │
│                                                  ┌──────▼──────┐│
│                                                  │ SETTLEMENT  ││
│                                                  │   ENGINE    ││
│                                                  │ (Pure Math) ││
│                                                  └─────────────┘│
└────────────────────────────┬─────────────────────────────────────┘
                             │ Prisma ORM
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                               │
│                   PostgreSQL (Supabase)                            │
│                                                                  │
│   deals │ participants │ rule_snapshots │ revenue_batches         │
│   settlement_runs │ settlement_allocations │ proof_records        │
│   ledger_journals │ ledger_postings                              │
└──────────────────────────────────────────────────────────────────┘
```

**Why this matters:**

- **Settlement Engine is isolated** — it has zero dependencies on the database or framework. This means the computation logic can be independently tested, audited, and even extracted into a separate service if needed. It's pure math.
- **Service Layer handles orchestration** — validation, database reads/writes, and transaction management happen here. The engine only receives clean, structured input.
- **Atomic transactions** — when a settlement is finalized, all database writes (allocations, proof, ledger) happen in a single transaction. If anything fails, nothing is persisted.

---

## What This Milestone Achieves

| Capability | Status | Description |
|-----------|--------|-------------|
| **Multi-Party Waterfall Settlement** | Delivered | Automatically compute revenue splits across any number of parties with priority-based phases |
| **Investor Recoupment Tracking** | Delivered | Track investor recoupment with caps, priority ordering, and carry-forward balances |
| **Distribution Fee Computation** | Delivered | Deduct distributor fees before any profit calculations |
| **Immutable Rule Snapshots** | Delivered | Rules are versioned and frozen — like signing a contract |
| **Revenue Lifecycle Management** | Delivered | Revenue goes through PENDING → VALIDATED → PROCESSED with compliance gates |
| **Cryptographic Proof** | Delivered | SHA-256 hash proves calculation integrity and prevents tampering |
| **Double-Entry Ledger** | Delivered | Automatic journal and posting creation follows accounting standards |
| **Settlement Status Workflow** | Delivered | DRAFT → PREVIEWED → FINALIZED with proper state transitions |
| **Correction Runs** | Delivered | Create adjustment runs linked to the original settlement |
| **REST API with Swagger** | Delivered | All endpoints documented with interactive testing UI |
| **29 Automated Tests** | Delivered | Full test suite ensuring correctness across edge cases |

---

## Future Integration Roadmap

### Payment Processing — Stripe Integration

Once a settlement is finalized and allocations are locked, the next step is **automated payouts**. We can integrate Stripe Connect to handle this:

**How it would work:**

1. Each participant is onboarded as a **Stripe Connected Account** during participant registration
2. When a settlement is finalized, the system creates **Stripe Transfers** for each allocation automatically
3. Payment status is tracked per allocation: `PENDING_PAYMENT → PAYMENT_INITIATED → PAID`
4. Participants receive payouts to their linked bank accounts
5. Payment confirmations are recorded back in our ledger

**Benefits:**
- Participants get paid within 2-3 business days of finalization
- Payment audit trail automatically linked to settlement records
- Multi-currency payouts (Stripe handles FX conversion)
- Compliance with tax withholding requirements

### Multi-Currency & FX Rates

Entertainment deals often involve multiple currencies (USD, EUR, GBP, JPY). Future enhancements include:

- **Real-time FX rate integration** (via Open Exchange Rates or European Central Bank API)
- Revenue batches in different currencies auto-converted at settlement time
- FX rate locked and recorded in proof record for auditing
- Settlement output shows both original currency and base currency amounts

### Tax Withholding

Automated tax calculations based on participant jurisdiction:

- Withholding tax applied per participant based on country and tax treaty
- Tax amounts deducted from allocations before payout
- Tax documentation generated (e.g., 1042-S for US withholding)
- Integration with tax reporting services

### Participant Portal

A self-service web portal where each participant can:

- **View their settlements** — see allocation breakdowns per deal
- **Track recoupment progress** — visual dashboard showing how much has been recouped vs remaining
- **Download statements** — PDF settlement statements for their records
- **Verify proof hashes** — independently verify that calculations match the cryptographic proof
- **View payment status** — track when payouts are initiated and completed

### Reporting & Analytics Dashboard

Comprehensive reporting for deal administrators:

- **Settlement history** — full timeline of all runs per deal
- **Revenue analytics** — revenue trends by period, source, and deal
- **Participant payout reports** — aggregated payouts per participant across all deals
- **Audit logs** — complete trail of who did what and when
- **Export capabilities** — CSV/PDF export for external reporting

### Document Management Integration

Attach supporting documents to deals, revenue batches, and settlements:

- **Revenue source documents** — distribution reports, theater box office statements
- **Audit reports** — third-party verification documents
- **Signed contracts** — deal agreements linked to rule snapshots
- **Settlement statements** — auto-generated PDF statements per participant
- Cloud storage integration (AWS S3 / Google Cloud Storage)

### Notification System

Automated notifications at key workflow stages:

- Revenue batch submitted for validation → notify finance team
- Revenue validated → notify deal administrator
- Settlement previewed → notify stakeholders for review
- Settlement finalized → notify all participants with their allocation summary
- Payment processed → notify participant with payment confirmation

Channels: Email, in-app notifications, webhook integrations (Slack, Teams)

### API Webhook Events

Allow external systems to subscribe to settlement events:

```
settlement.run.created
settlement.run.previewed
settlement.run.finalized
revenue.batch.validated
payment.initiated
payment.completed
```

This enables integration with ERP systems, accounting software (QuickBooks, Xero), and custom client dashboards.

---

## Milestone Delivery Summary

| Item | Status |
|------|--------|
| Settlement computation engine (4-phase waterfall) | Delivered |
| 29 automated tests — all passing | Delivered |
| Database schema with Prisma ORM | Delivered |
| REST API endpoints (20+ endpoints) | Delivered |
| Swagger interactive documentation | Delivered |
| Rules service — real database implementation | Delivered |
| Revenue service — real database implementation | Delivered |
| Settlement service — engine + database integration | Delivered |
| Proof hash generation (SHA-256) | Delivered |
| Double-entry ledger creation | Delivered |
| CI/CD pipeline (lint, typecheck, test, build) | Delivered |
| Client documentation | Delivered |

**Next Milestone:** UI integration, participant portal, and multi-currency support.

---

*This document covers the complete delivery of Milestone 1 of the SFI-FEA Platform. All features described are implemented, tested, and available via the live API.*
