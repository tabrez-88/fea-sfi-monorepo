# Live Implementation Guide — Settlement Demo in Swagger

**Scenario:** "The Last Horizon" — Sci-Fi Feature Film Settlement
**Total Revenue:** $200,000,000 (worldwide box office + streaming)
**Prerequisite:** Read `SWAGGER_TUTORIAL.md` first if you are unfamiliar with Swagger UI

Open Swagger UI at: **http://localhost:3001/docs**

---

## Step 1: Create the Deal

**What this does:** Creates a new deal record in the system. A deal is the top-level container that holds all participants, rules, revenue, and settlements.

**Endpoint:** `POST /api/v1/deals`

**Request Body:**

```json
{
  "name": "The Last Horizon",
  "description": "Sci-Fi Feature Film — worldwide box office and streaming distribution deal",
  "effectiveDate": "2026-01-01",
  "status": "ACTIVE"
}
```

**Expected Response** (Status `201 Created`):

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "The Last Horizon",
  "description": "Sci-Fi Feature Film — worldwide box office and streaming distribution deal",
  "status": "ACTIVE",
  "effectiveDate": "2026-01-01T00:00:00.000Z",
  "terminationDate": null,
  "metadata": null,
  "createdAt": "2026-02-13T10:00:00.000Z",
  "updatedAt": "2026-02-13T10:00:00.000Z"
}
```

**What to check in the response:**
- `"status"` should be `"ACTIVE"`
- `"name"` matches what you entered

**Save this value:** Copy the `"id"` — you'll need it for **every step after this**. We'll call this **`DEAL_ID`**.

> *[Screenshot: POST /api/v1/deals response]*

---

## Step 2: Add Participants (5 parties)

**What this does:** Registers each party involved in the deal. Each participant has a role that determines how they receive money in the settlement.

**Endpoint:** `POST /api/v1/deals/{dealId}/participants`

**Path Parameter:** Replace `{dealId}` with your **`DEAL_ID`** from Step 1.

Execute this endpoint **5 times** with the following data:

---

### 2a — Production Studio

```json
{
  "name": "Zenith Pictures",
  "role": "STUDIO",
  "email": "deals@zenithpictures.com"
}
```

**Expected Response** (Status `201 Created`):

```json
{
  "id": "p-studio-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "dealId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Zenith Pictures",
  "role": "STUDIO",
  "externalId": null,
  "email": "deals@zenithpictures.com",
  "metadata": null,
  "createdAt": "2026-02-13T10:01:00.000Z",
  "updatedAt": "2026-02-13T10:01:00.000Z"
}
```

**Save:** Copy `"id"` as **`ZENITH_PICTURES_ID`**

---

### 2b — Distributor

```json
{
  "name": "Global Cinema Partners",
  "role": "DISTRIBUTOR",
  "email": "settlements@globalcinema.com"
}
```

**Expected Response** (Status `201 Created`):

```json
{
  "id": "p-dist-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "dealId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Global Cinema Partners",
  "role": "DISTRIBUTOR",
  "externalId": null,
  "email": "settlements@globalcinema.com",
  "metadata": null,
  "createdAt": "2026-02-13T10:02:00.000Z",
  "updatedAt": "2026-02-13T10:02:00.000Z"
}
```

**Save:** Copy `"id"` as **`GLOBAL_CINEMA_PARTNERS_ID`**

---

### 2c — Lead Investor

```json
{
  "name": "Horizon Ventures Fund",
  "role": "INVESTOR",
  "email": "fund@horizonventures.com"
}
```

**Expected Response** (Status `201 Created`):

```json
{
  "id": "p-inv1-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "dealId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Horizon Ventures Fund",
  "role": "INVESTOR",
  "externalId": null,
  "email": "fund@horizonventures.com",
  "metadata": null,
  "createdAt": "2026-02-13T10:03:00.000Z",
  "updatedAt": "2026-02-13T10:03:00.000Z"
}
```

**Save:** Copy `"id"` as **`HORIZON_VENTURES_ID`**

---

### 2d — Co-Investor

```json
{
  "name": "Pacific Capital Group",
  "role": "INVESTOR",
  "email": "investments@pacificcapital.com"
}
```

**Expected Response** (Status `201 Created`):

```json
{
  "id": "p-inv2-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "dealId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Pacific Capital Group",
  "role": "INVESTOR",
  "externalId": null,
  "email": "investments@pacificcapital.com",
  "metadata": null,
  "createdAt": "2026-02-13T10:04:00.000Z",
  "updatedAt": "2026-02-13T10:04:00.000Z"
}
```

**Save:** Copy `"id"` as **`PACIFIC_CAPITAL_ID`**

---

### 2e — Talent (Director)

```json
{
  "name": "Sarah Chen",
  "role": "TALENT",
  "email": "sarah.chen@agent.com"
}
```

**Expected Response** (Status `201 Created`):

```json
{
  "id": "p-talent-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "dealId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Sarah Chen",
  "role": "TALENT",
  "externalId": null,
  "email": "sarah.chen@agent.com",
  "metadata": null,
  "createdAt": "2026-02-13T10:05:00.000Z",
  "updatedAt": "2026-02-13T10:05:00.000Z"
}
```

**Save:** Copy `"id"` as **`SARAH_CHEN_ID`**

---

**What to check after adding all 5 participants:**
- Each response has `"role"` matching what you entered (`STUDIO`, `DISTRIBUTOR`, `INVESTOR`, `INVESTOR`, `TALENT`)
- Each response has `"dealId"` matching your deal
- You have **5 unique participant IDs** saved

> *[Screenshot: All 5 participants created]*

---

## Step 3: Define Settlement Rules (Rule Snapshot)

**What this does:** Defines **how money flows** through the waterfall. This is like signing a financial contract — once created, the rules are **frozen and immutable**. Any future changes require creating a new snapshot (new version).

The rules define:
- **Distribution Fees** — the distributor's percentage taken off the top
- **Recoupment** — how much each investor needs to recoup (get back) and in what order
- **Net Profit Split** — how the remaining profit is divided among all parties

**Endpoint:** `POST /api/v1/deals/{dealId}/rule-snapshots`

**Path Parameter:** Replace `{dealId}` with your **`DEAL_ID`**.

**Request Body:** Replace all `<PLACEHOLDER_IDs>` with your actual participant IDs from Step 2:

```json
{
  "effectiveFrom": "2026-01-01T00:00:00.000Z",
  "rules": {
    "currency": "USD"
  },
  "participants": [
    {
      "participantId": "<GLOBAL_CINEMA_PARTNERS_ID>",
      "participantData": { "feePercentage": 12 }
    },
    {
      "participantId": "<HORIZON_VENTURES_ID>",
      "participantData": { "recoupCap": 45000000, "priority": 1, "netProfitPercentage": 15 }
    },
    {
      "participantId": "<PACIFIC_CAPITAL_ID>",
      "participantData": { "recoupCap": 25000000, "priority": 2, "netProfitPercentage": 12 }
    },
    {
      "participantId": "<ZENITH_PICTURES_ID>",
      "participantData": { "netProfitPercentage": 65 }
    },
    {
      "participantId": "<SARAH_CHEN_ID>",
      "participantData": { "netProfitPercentage": 8 }
    }
  ]
}
```

**How the `participantData` drives the settlement engine:**

| Field | Meaning | Used By |
|-------|---------|---------|
| `feePercentage` | Distribution fee % taken off the top | Global Cinema Partners (12%) |
| `recoupCap` | Maximum amount to recoup (get back) | Horizon Ventures ($45M), Pacific Capital ($25M) |
| `priority` | Recoupment order (1 = first, 2 = second) | Determines who gets paid back first |
| `netProfitPercentage` | Share of remaining profit | Must total 100% across all participants (65+15+12+8 = 100%) |

**Expected Response** (Status `201 Created`):

```json
{
  "id": "rs-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "dealId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "version": 1,
  "effectiveFrom": "2026-01-01T00:00:00.000Z",
  "effectiveTo": null,
  "rules": {
    "currency": "USD"
  },
  "participantCount": 5,
  "createdAt": "2026-02-13T10:06:00.000Z",
  "updatedAt": "2026-02-13T10:06:00.000Z"
}
```

**What to check in the response:**
- `"version"` is `1` (first snapshot for this deal)
- `"participantCount"` is `5` — all 5 participants are included
- `"effectiveTo"` is `null` (this is the current active snapshot)
- The rules are now **frozen and immutable** — the settlement engine will read each participant's `participantData` to determine fees, recoupment, and profit splits

**Save this value:** Copy the `"id"` as **`RULE_SNAPSHOT_ID`**.

> *[Screenshot: Rule Snapshot created]*

---

## Step 4: Register Revenue

**What this does:** Records the revenue that will be distributed in the settlement. Revenue starts in `"PENDING"` status and must be validated before it can be used.

**Endpoint:** `POST /api/v1/deals/{dealId}/revenue-batches`

**Path Parameter:** Replace `{dealId}` with your **`DEAL_ID`**.

**Request Body:**

```json
{
  "periodStart": "2026-01-01T00:00:00.000Z",
  "periodEnd": "2026-12-31T23:59:59.999Z",
  "totalAmount": 200000000,
  "currency": "USD",
  "source": "Worldwide Box Office + Streaming Revenue 2026"
}
```

**Expected Response** (Status `201 Created`):

```json
{
  "id": "rb-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "dealId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "batchNumber": "RB-2026-001",
  "periodStart": "2026-01-01T00:00:00.000Z",
  "periodEnd": "2026-12-31T23:59:59.999Z",
  "totalAmount": 200000000,
  "currency": "USD",
  "status": "PENDING",
  "source": "Worldwide Box Office + Streaming Revenue 2026",
  "metadata": null,
  "isSettled": false,
  "settlementRunCount": 0,
  "createdAt": "2026-02-13T10:07:00.000Z",
  "updatedAt": "2026-02-13T10:07:00.000Z"
}
```

**What to check in the response:**
- `"status"` is `"PENDING"` — the revenue is NOT yet approved for settlement
- `"batchNumber"` is auto-generated (e.g., `"RB-2026-001"`)
- `"totalAmount"` is `200000000` ($200M)
- `"isSettled"` is `false` — this batch has not been used in any settlement yet

**Save this value:** Copy the `"id"` as **`REVENUE_BATCH_ID`**.

> *[Screenshot: Revenue Batch created — PENDING status]*

---

## Step 5: Validate Revenue

**What this does:** Approves the revenue for settlement. This is a **built-in compliance gate** — the system will not allow settlement on unverified revenue. In a real scenario, this step would happen after an auditor reviews the revenue data.

**Endpoint:** `PATCH /api/v1/revenue-batches/{revenueBatchId}/validate`

**Path Parameter:** Replace `{revenueBatchId}` with your **`REVENUE_BATCH_ID`** from Step 4.

**Request Body:**

```json
{
  "validationNotes": "Revenue verified against distribution reports and audited by external firm"
}
```

**Expected Response** (Status `200 OK`):

```json
{
  "id": "rb-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "dealId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "batchNumber": "RB-2026-001",
  "periodStart": "2026-01-01T00:00:00.000Z",
  "periodEnd": "2026-12-31T23:59:59.999Z",
  "totalAmount": 200000000,
  "currency": "USD",
  "status": "VALIDATED",
  "source": "Worldwide Box Office + Streaming Revenue 2026",
  "metadata": {
    "validationNotes": "Revenue verified against distribution reports and audited by external firm",
    "validatedAt": "2026-02-13T10:08:00.000Z"
  },
  "isSettled": false,
  "settlementRunCount": 0,
  "createdAt": "2026-02-13T10:07:00.000Z",
  "updatedAt": "2026-02-13T10:08:00.000Z"
}
```

**What to check in the response:**
- `"status"` changed from `"PENDING"` to `"VALIDATED"` — the revenue is now approved
- `"metadata"` now contains the `"validationNotes"` you entered and a `"validatedAt"` timestamp
- `"updatedAt"` is newer than `"createdAt"` — confirms the record was modified

> *[Screenshot: Revenue Batch validated — VALIDATED status]*

---

## Step 6: Create Settlement Run

**What this does:** Assembles the inputs for a settlement calculation. Think of this as preparing a "calculation job" — you're telling the system which rules and which revenue to use. Nothing is calculated yet.

**Endpoint:** `POST /api/v1/deals/{dealId}/settlement-runs`

**Path Parameter:** Replace `{dealId}` with your **`DEAL_ID`**.

**Request Body:** Replace the placeholders with your actual IDs:

```json
{
  "ruleSnapshotId": "<RULE_SNAPSHOT_ID>",
  "revenueBatchIds": [
    "<REVENUE_BATCH_ID>"
  ],
  "notes": "Q1-Q4 2026 settlement for The Last Horizon"
}
```

**Expected Response** (Status `201 Created`):

```json
{
  "id": "sr-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "dealId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "ruleSnapshotId": "rs-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "runType": "NORMAL",
  "status": "DRAFT",
  "originalSettlementRunId": null,
  "totalAllocated": 0,
  "currency": "USD",
  "notes": "Q1-Q4 2026 settlement for The Last Horizon",
  "executedAt": null,
  "createdAt": "2026-02-13T10:09:00.000Z",
  "updatedAt": "2026-02-13T10:09:00.000Z"
}
```

**What to check in the response:**
- `"status"` is `"DRAFT"` — the settlement has not been calculated yet
- `"runType"` is `"NORMAL"` (not a correction run)
- `"totalAllocated"` is `0` — nothing computed yet
- `"executedAt"` is `null` — not finalized yet

**Save this value:** Copy the `"id"` as **`SETTLEMENT_RUN_ID`**.

> *[Screenshot: Settlement Run created — DRAFT status]*

---

## Step 7: Preview Settlement (The Engine Runs)

**What this does:** This is the core of the system. The computation engine processes the entire waterfall calculation in real-time and returns the full breakdown of how every dollar is allocated. **Nothing is saved permanently yet** — this is a preview that can be re-run.

**Endpoint:** `POST /api/v1/settlement-runs/{settlementRunId}/preview`

**Path Parameter:** Replace `{settlementRunId}` with your **`SETTLEMENT_RUN_ID`** from Step 6.

**Request Body:** None needed — leave the body empty and just click Execute.

**Expected Response** (Status `200 OK`):

```json
{
  "settlementRunId": "sr-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "status": "PREVIEWED",
  "totalRevenue": 200000000,
  "totalAllocated": 200000000,
  "currency": "USD",
  "allocations": [
    {
      "id": "preview-0",
      "participantId": "p-dist-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Global Cinema Partners",
      "amount": 24000000,
      "currency": "USD",
      "phase": "DISTRIBUTION_FEES"
    },
    {
      "id": "preview-1",
      "participantId": "p-inv1-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Horizon Ventures Fund",
      "amount": 45000000,
      "currency": "USD",
      "phase": "RECOUPMENT"
    },
    {
      "id": "preview-2",
      "participantId": "p-inv2-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Pacific Capital Group",
      "amount": 25000000,
      "currency": "USD",
      "phase": "RECOUPMENT"
    },
    {
      "id": "preview-3",
      "participantId": "p-studio-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Zenith Pictures",
      "amount": 68900000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    },
    {
      "id": "preview-4",
      "participantId": "p-inv1-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Horizon Ventures Fund",
      "amount": 15900000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    },
    {
      "id": "preview-5",
      "participantId": "p-inv2-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Pacific Capital Group",
      "amount": 12720000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    },
    {
      "id": "preview-6",
      "participantId": "p-talent-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Sarah Chen",
      "amount": 8480000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    }
  ],
  "proof": {
    "proofHash": "sha256:a3f8c1d9e7b2...(64 hex characters)",
    "algorithm": "SHA-256",
    "timestamp": "2026-02-13T10:10:00.000Z"
  },
  "message": "Preview complete. Call POST /settlement-runs/{id}/finalize to lock results."
}
```

**What to check in the response:**

1. **Total Revenue = Total Allocated** — every dollar is accounted for:
   - `"totalRevenue": 200000000` = `"totalAllocated": 200000000`

2. **Allocations by phase** — verify the waterfall calculation:

   | Participant | Phase | Amount | Explanation |
   |-------------|-------|--------|-------------|
   | Global Cinema Partners | DISTRIBUTION_FEES | $24,000,000 | 12% of $200M |
   | Horizon Ventures Fund | RECOUPMENT | $45,000,000 | Full investment recouped (Priority 1) |
   | Pacific Capital Group | RECOUPMENT | $25,000,000 | Full investment recouped (Priority 2) |
   | Zenith Pictures | NET_PROFITS | $68,900,000 | 65% of $106M remaining |
   | Horizon Ventures Fund | NET_PROFITS | $15,900,000 | 15% of $106M remaining |
   | Pacific Capital Group | NET_PROFITS | $12,720,000 | 12% of $106M remaining |
   | Sarah Chen | NET_PROFITS | $8,480,000 | 8% of $106M remaining |

3. **Proof hash exists** — the `"proof.proofHash"` is a SHA-256 cryptographic fingerprint. If anyone disputes the calculation, this hash proves it hasn't been altered.

4. **Status changed** — `"status"` is now `"PREVIEWED"`

> *[Screenshot: Preview Settlement — full allocation breakdown]*

---

## Step 8: Finalize Settlement (Lock Results)

**What this does:** Permanently records the settlement results. This is the final step that:
1. **Re-calculates** the entire settlement (verifies determinism — same result as preview)
2. **Saves all allocations** to the database permanently
3. **Creates a proof record** with the SHA-256 hash
4. **Creates ledger entries** with double-entry bookkeeping (debits and credits)
5. **Marks revenue batches** as `"PROCESSED"`
6. **Marks the settlement run** as `"FINALIZED"`

All of this happens in a **single atomic transaction** — if any step fails, everything rolls back and no data is partially saved.

**Endpoint:** `POST /api/v1/settlement-runs/{settlementRunId}/finalize`

**Path Parameter:** Replace `{settlementRunId}` with your **`SETTLEMENT_RUN_ID`**.

**Request Body:** None needed — leave the body empty and just click Execute.

**Expected Response** (Status `200 OK`):

```json
{
  "settlementRunId": "sr-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "status": "FINALIZED",
  "totalRevenue": 200000000,
  "totalAllocated": 200000000,
  "currency": "USD",
  "allocations": [
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-dist-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Global Cinema Partners",
      "amount": 24000000,
      "currency": "USD",
      "phase": "DISTRIBUTION_FEES"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-inv1-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Horizon Ventures Fund",
      "amount": 45000000,
      "currency": "USD",
      "phase": "RECOUPMENT"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-inv2-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Pacific Capital Group",
      "amount": 25000000,
      "currency": "USD",
      "phase": "RECOUPMENT"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-studio-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Zenith Pictures",
      "amount": 68900000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-inv1-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Horizon Ventures Fund",
      "amount": 15900000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-inv2-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Pacific Capital Group",
      "amount": 12720000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-talent-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Sarah Chen",
      "amount": 8480000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    }
  ],
  "proof": {
    "proofHash": "sha256:a3f8c1d9e7b2...(64 hex characters)",
    "algorithm": "SHA-256",
    "timestamp": "2026-02-13T10:11:00.000Z"
  },
  "ledger": {
    "journalIds": ["jnl-xxxx-xxxx-xxxx-xxxxxxxxxxxx"],
    "postingCount": 8
  },
  "finalizedAt": "2026-02-13T10:11:00.000Z",
  "message": "Settlement finalized successfully. Results are now locked."
}
```

**What to check in the response:**

1. **Status** — `"status"` is `"FINALIZED"` (results are now permanently locked)
2. **Allocations match preview** — the amounts should be identical to Step 7
3. **Proof record** — `"proof.proofHash"` should match the preview hash (determinism verified)
4. **Ledger created** — `"ledger"` section is now present:
   - `"journalIds"` contains the ledger journal ID
   - `"postingCount": 8` means 8 ledger postings (1 revenue credit + 7 participant debits = proper double-entry accounting)
5. **Finalized timestamp** — `"finalizedAt"` shows when the settlement was locked

> *[Screenshot: Settlement Finalized — with ledger info]*

---

## Step 9: View Complete Settlement Details

**What this does:** Retrieves the full settlement record with all allocations, proof, revenue batches, and ledger references. This is the complete **audit trail**.

**Endpoint:** `GET /api/v1/settlement-runs/{settlementRunId}`

**Path Parameter:** Replace `{settlementRunId}` with your **`SETTLEMENT_RUN_ID`**.

**Request Body:** None — this is a GET request (read-only).

**Expected Response** (Status `200 OK`):

```json
{
  "id": "sr-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "dealId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "ruleSnapshotId": "rs-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "runType": "NORMAL",
  "status": "FINALIZED",
  "originalSettlementRunId": null,
  "totalAllocated": 200000000,
  "currency": "USD",
  "notes": "Q1-Q4 2026 settlement for The Last Horizon",
  "executedAt": "2026-02-13T10:11:00.000Z",
  "createdAt": "2026-02-13T10:09:00.000Z",
  "updatedAt": "2026-02-13T10:11:00.000Z",
  "revenueBatches": [
    {
      "id": "rb-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "batchNumber": "RB-2026-001",
      "periodStart": "2026-01-01T00:00:00.000Z",
      "periodEnd": "2026-12-31T23:59:59.999Z",
      "totalAmount": 200000000,
      "currency": "USD"
    }
  ],
  "allocations": [
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "...",
      "participantName": "Global Cinema Partners",
      "amount": 24000000,
      "currency": "USD",
      "phase": "DISTRIBUTION_FEES"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "...",
      "participantName": "Horizon Ventures Fund",
      "amount": 45000000,
      "currency": "USD",
      "phase": "RECOUPMENT"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "...",
      "participantName": "Pacific Capital Group",
      "amount": 25000000,
      "currency": "USD",
      "phase": "RECOUPMENT"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "...",
      "participantName": "Zenith Pictures",
      "amount": 68900000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "...",
      "participantName": "Horizon Ventures Fund",
      "amount": 15900000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "...",
      "participantName": "Pacific Capital Group",
      "amount": 12720000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "...",
      "participantName": "Sarah Chen",
      "amount": 8480000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    }
  ],
  "proof": {
    "proofHash": "sha256:a3f8c1d9e7b2...(64 hex characters)",
    "algorithm": "SHA-256",
    "timestamp": "2026-02-13T10:11:00.000Z"
  },
  "ledger": {
    "journalIds": ["jnl-xxxx-xxxx-xxxx-xxxxxxxxxxxx"],
    "postingCount": 8
  }
}
```

**What to check in the response:**
- `"status"` is `"FINALIZED"`
- `"revenueBatches"` lists the revenue used in this settlement
- `"allocations"` shows every allocation with participant name and phase
- `"proof"` contains the cryptographic hash
- `"ledger"` confirms accounting entries were created
- `"executedAt"` shows when finalization happened

> *[Screenshot: Settlement Run detail view]*

---

## Summary — IDs to Save at Each Step

| Step | Action | ID to Save | Name Used In Guide |
|------|--------|------------|--------------------|
| 1 | Create Deal | Deal ID | `DEAL_ID` |
| 2a | Add Zenith Pictures | Participant ID | `ZENITH_PICTURES_ID` |
| 2b | Add Global Cinema Partners | Participant ID | `GLOBAL_CINEMA_PARTNERS_ID` |
| 2c | Add Horizon Ventures Fund | Participant ID | `HORIZON_VENTURES_ID` |
| 2d | Add Pacific Capital Group | Participant ID | `PACIFIC_CAPITAL_ID` |
| 2e | Add Sarah Chen | Participant ID | `SARAH_CHEN_ID` |
| 3 | Create Rule Snapshot | Rule Snapshot ID | `RULE_SNAPSHOT_ID` |
| 4 | Register Revenue | Revenue Batch ID | `REVENUE_BATCH_ID` |
| 6 | Create Settlement Run | Settlement Run ID | `SETTLEMENT_RUN_ID` |

---

## Summary — Expected Final Payout

| Party | Distribution Fee | Recoupment | Net Profit | **Grand Total** |
|-------|-----------------|------------|------------|-----------------|
| Global Cinema Partners | $24,000,000 | — | — | **$24,000,000** |
| Horizon Ventures Fund | — | $45,000,000 | $15,900,000 | **$60,900,000** |
| Pacific Capital Group | — | $25,000,000 | $12,720,000 | **$37,720,000** |
| Zenith Pictures | — | — | $68,900,000 | **$68,900,000** |
| Sarah Chen | — | — | $8,480,000 | **$8,480,000** |
| **TOTAL** | **$24,000,000** | **$70,000,000** | **$106,000,000** | **$200,000,000** |

Every dollar is accounted for. No rounding errors. No discrepancies.
