# What Is FEA & SFI?

**For:** Non-technical readers, designers, stakeholders
**Date:** March 2026

---

## The Big Picture

**FEA** (Film Entertainment Assets) is a platform for managing entertainment deals — think of it as the home base where producers, investors, distributors, and talent all come together to manage their business.

**SFI** (Settlement & Financial Infrastructure) is the financial engine inside FEA. It handles the money side — calculating who gets paid what, when, and why.

Think of it this way:

- **FEA** = The office where everyone works together
- **SFI** = The accounting department inside that office

They're not separate products. SFI is part of FEA. But SFI is powerful enough to work on its own — any company that needs to split revenue between multiple parties can plug into SFI.

---

## What Problem Does This Solve?

In the entertainment industry, money flows through many hands before it reaches the people who made the content.

Take "Agak Laen 2: Menyala Pantiku" — the film broke records with over 11 million viewers and an estimated Rp440 billion in gross box office. But that Rp440 billion doesn't just go to one person. It gets split:

1. The **cinema chains** (XXI, CGV) take their cut (~50% of ticket sales)
2. **Investors** who funded the production get paid back first
3. Whatever is left — the **net profit** — gets split among the producer (Imajinari), talent (Bene Dion, Boris Bokir, Indra Jegel, Oki Rengga), and other parties based on their contracts

Today, most companies handle this with spreadsheets. This creates problems:

- **Mistakes are easy** — one wrong formula and payouts are off
- **No audit trail** — hard to prove who changed what
- **Disputes take forever** — everyone has a different version of the spreadsheet
- **Corrections are messy** — changing a past settlement can break everything downstream

SFI solves all of this.

---

## How It Works

### Step 1: Set Up the Deal

Someone creates a deal in the system — for example, "Agak Laen 2: Menyala Pantiku".

They add all the parties involved:

| Who                                  | Role          | Their Terms                                           |
| ------------------------------------ | ------------- | ----------------------------------------------------- |
| Cinema XXI                           | Distributor   | Gets 50% of gross revenue as cinema distribution fee  |
| Production Investors                 | Investor      | Put in Rp25B to fund production, gets paid back first |
| Imajinari (Ernest Prakasa)           | Producer      | Gets 50% of net profits                               |
| Bene Dion                            | Lead Talent   | Gets 20% of net profits                               |
| Boris Bokir, Indra Jegel, Oki Rengga | Cast Ensemble | Gets 30% of net profits (shared)                      |

### Step 2: Lock the Rules

Before any money can be calculated, the deal terms get "frozen" into a **Rule Snapshot**. This is like signing a contract — once locked, nobody can change it. If terms need to change later, you create a new version (the old one stays on record forever).

### Step 3: Submit Revenue

When the movie starts earning money at the box office, someone enters the revenue into the system:

- "Agak Laen 2 earned Rp280B from Nov–Dec 2025 (~7 million viewers)"
- "Agak Laen 2 earned Rp160B from Jan–Feb 2026 (~4 million viewers)"

Each submission goes through a review — someone checks the numbers and approves them before they can be used.

### Step 4: Run the Settlement (The Waterfall)

This is where SFI shines. The system takes the locked rules + approved revenue and runs what's called a **waterfall calculation**. It's called a waterfall because money flows down through layers:

```
Rp440B Total Revenue
    │
    ├─→ Layer 1: Cinema Distribution Fee (50%)
    │   Cinema XXI gets Rp220B
    │   Remaining: Rp220B
    │
    ├─→ Layer 2: Investor Payback
    │   Production Investors get Rp25B (fully paid back)
    │   Remaining: Rp195B
    │
    └─→ Layer 3: Net Profit Split
        Imajinari (50%):                    Rp97.5B
        Bene Dion (20%):                    Rp39B
        Boris, Indra, Oki (30% shared):     Rp58.5B
```

Every rupiah is accounted for. The system makes sure the math always adds up — money in = money out.

### Step 5: Finalize & Prove

Once everyone reviews and approves, the settlement gets **finalized** — permanently locked. At this point:

- A **digital fingerprint** (proof hash) is generated — like a seal on an envelope
- All accounting entries are created automatically (debits and credits, always balanced)
- Nobody can edit it. Ever.

If you need to check the settlement later, you can **re-verify** it — the system re-runs the same calculation and confirms the result matches. If someone tampered with it, the fingerprint won't match.

### Step 6: Handle Corrections (Without Breaking Anything)

What if someone discovers the revenue was wrong — say, Rp20B was missed from an international screening deal?

In a spreadsheet world, you'd go back and edit the original. That's dangerous — it changes the historical record.

In SFI, the original stays untouched. Instead, a **correction** is created as a brand new settlement that only covers the difference (Rp20B). The system runs the same waterfall on just the Rp20B and pays out accordingly. Both settlements are linked so you can always see the full picture.

---

## Real-World Example: Full Lifecycle

Let's walk through "Agak Laen 2: Menyala Pantiku" from start to finish.

**September 2025 — Deal Setup**

- Ernest Prakasa and Dipa Andika set up the deal in FEA
- Adds all parties: Cinema XXI (distributor), production investors, Imajinari (producer), and the four lead cast members — Bene Dion, Boris Bokir, Indra Jegel, Oki Rengga
- Locks the rules into Rule Snapshot v1: 50% cinema fee, Rp25B investor recoupment, net profit split

**December 2025 — First Revenue Comes In**

- Finance team enters: "Rp280B revenue, Nov–Dec 2025" (first month after release, ~7M viewers)
- Manager reviews and approves the revenue batch

**January 2026 — First Settlement**

- System runs the waterfall on Rp280B
- Cinema XXI gets their 50% (Rp140B)
- Investors get paid back: Rp25B → fully recouped
- Remaining Rp115B split as net profit:
  - Imajinari (50%): Rp57.5B
  - Bene Dion (20%): Rp23B
  - Boris, Indra, Oki (30%): Rp34.5B
- Settlement finalized. Proof hash generated. Ledger entries created.

**March 2026 — Second Revenue**

- Finance enters: "Rp160B revenue, Jan–Feb 2026" (~4M additional viewers)
- Approved and settled
- Since investors were already fully paid back in Settlement #1, the entire amount after cinema fees goes to net profit splits:
  - Cinema XXI: Rp80B
  - Net profit Rp80B → Imajinari Rp40B, Bene Dion Rp16B, Cast Rp24B

**April 2026 — Correction**

- Audit reveals Rp20B was missed from an international distribution deal
- Correction run created (original Settlement #1 untouched)
- Rp20B goes through the same waterfall — cinema gets Rp10B, investors already recouped, so Rp10B is all net profit
- Correction is finalized with its own proof hash

**Anytime — Verification**

- Anyone can open the Proof page and verify any settlement
- Click on Settlement #1 → system re-calculates → hash matches → confirmed untampered

---

## What Makes SFI Different?

| Traditional (Spreadsheets)                            | SFI                                                      |
| ----------------------------------------------------- | -------------------------------------------------------- |
| Manual calculations, prone to errors                  | Automated waterfall engine, math always correct          |
| Anyone can edit past records                          | Once finalized, settlements are permanently locked       |
| "Who changed this?" — nobody knows                    | Full audit trail: who did what, when, down to the second |
| Corrections overwrite the original                    | Corrections are separate entries, originals preserved    |
| Trust me, the numbers are right                       | Cryptographic proof — verify anytime, tamper-proof       |
| Investor asks "where's my money?" — dig through files | One-click participant statement with full payout history |
| One spreadsheet per deal, no overview                 | Dashboard across all deals, all settlements, all reports |

---

## Who Uses This Portal?

The **FEA Admin Portal** is the web interface where people interact with all of this. Different people use it for different things:

| Person           | What They Do                                               |
| ---------------- | ---------------------------------------------------------- |
| **Deal Manager** | Creates deals, adds participants, sets up rules            |
| **Finance Team** | Submits revenue, reviews batches, runs settlements         |
| **Investors**    | View their payout history, recoupment progress, statements |
| **Auditors**     | Verify settlements, check proof hashes, review audit logs  |
| **Executives**   | Dashboard overview, financial summaries across all deals   |

---

## Beyond Film — Where Else Can SFI Be Used?

The waterfall model (Gross → Fees → Payback → Profit Split) isn't just for movies. It applies anywhere multiple parties share revenue:

| Industry                   | Example                                                                   |
| -------------------------- | ------------------------------------------------------------------------- |
| **Music**                  | Streaming royalties split between label, artist, producer, songwriter     |
| **Real Estate**            | Rental income split between property owner, management company, investors |
| **Venture Capital**        | Fund returns distributed between LPs and GPs with carry                   |
| **Gaming**                 | In-game purchase revenue shared between developer, publisher, platform    |
| **Tokenized Assets (RWA)** | Revenue from real-world assets distributed to token holders               |

The math is the same — only the labels change. SFI handles all of it.

---

## Summary

- **FEA** is the platform. It's where you manage deals, people, and documents.
- **SFI** is the engine. It calculates settlements, tracks money, and proves everything is correct.
- Together, they replace spreadsheets with an automated, auditable, tamper-proof system.
- Phase 1 of the Admin Portal gives you everything needed to run settlements end-to-end: from creating a deal to generating financial reports and proof verification.

---

_This document is meant to give you a clear picture of what we're building and why. For the detailed screen-by-screen design plan, see [CLIENT_ADMIN_PORTAL_OVERVIEW_V2.md](CLIENT_ADMIN_PORTAL_OVERVIEW_V2.md)._
