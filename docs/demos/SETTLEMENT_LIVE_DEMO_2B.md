# Live Implementation Guide — Milestone 2B: Rule Snapshots & Revenue Structures

**Scenario:** "Echoes of Tomorrow" — Animated Series Settlement
**Total Revenue:** $75,000,000 (streaming platform deal + merchandise licensing)
**Prerequisite:** Read `SWAGGER_TUTORIAL.md` first if you are unfamiliar with Swagger UI

Open Swagger UI at: **http://localhost:3001/docs**

---

## What This Demo Covers

This demo walks through the complete **rules → revenue → settlement** pipeline, showcasing:

| Feature                         | Where You'll See It                                                      |
| ------------------------------- | ------------------------------------------------------------------------ |
| **Immutable Rule Snapshots**    | Step 3b — freeze deal terms into a versioned snapshot                    |
| **Rule Validation**             | Step 3a — see how the system catches invalid rules before accepting them |
| **`ruleSummary` Intelligence**  | Step 3c — auto-generated breakdown of the deal's financial structure     |
| **Revenue Batch Structure**     | Step 4b — register revenue with metadata and period tracking             |
| **Revenue Period Validation**   | Step 4a — see how reversed dates are rejected                            |
| **Revenue Lifecycle**           | Step 5 — PENDING → VALIDATED compliance gate                             |
| **Rules + Revenue Binding**     | Step 6 — bind a rule snapshot and revenue batch into a settlement run    |
| **Full Settlement Computation** | Steps 7-9 — engine computes allocations, generates proof, creates ledger |

---

## Step 1: Create the Deal

**What this does:** Creates a new deal record for the animated series. This is the top-level container that holds all participants, rules, revenue, and settlements.

**Endpoint:** `POST /api/v1/deals`

**Request Body:**

```json
{
  "name": "Echoes of Tomorrow",
  "description": "Animated Series (8 Episodes) — streaming platform deal with merchandise licensing",
  "effectiveDate": "2026-01-01",
  "status": "ACTIVE"
}
```

**Expected Response** (Status `201 Created`):

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Echoes of Tomorrow",
  "description": "Animated Series (8 Episodes) — streaming platform deal with merchandise licensing",
  "status": "ACTIVE",
  "effectiveDate": "2026-01-01T00:00:00.000Z",
  "terminationDate": null,
  "metadata": null,
  "createdAt": "2026-03-02T10:00:00.000Z",
  "updatedAt": "2026-03-02T10:00:00.000Z"
}
```

**What to check in the response:**

- `"status"` should be `"ACTIVE"`
- `"name"` matches what you entered

**Save this value:** Copy the `"id"` — you'll need it for **every step after this**. We'll call this **`DEAL_ID`**.

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
  "name": "Aurora Animation Studio",
  "role": "STUDIO",
  "email": "production@auroraanimation.com"
}
```

**Expected Response** (Status `201 Created`):

```json
{
  "id": "p-studio-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "dealId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Aurora Animation Studio",
  "role": "STUDIO",
  "externalId": null,
  "email": "production@auroraanimation.com",
  "metadata": null,
  "createdAt": "2026-03-02T10:01:00.000Z",
  "updatedAt": "2026-03-02T10:01:00.000Z"
}
```

**Save:** Copy `"id"` as **`AURORA_STUDIO_ID`**

---

### 2b — Distributor

```json
{
  "name": "StreamMax Distribution",
  "role": "DISTRIBUTOR",
  "email": "licensing@streammax.com"
}
```

**Expected Response** (Status `201 Created`):

```json
{
  "id": "p-dist-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "dealId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "StreamMax Distribution",
  "role": "DISTRIBUTOR",
  "externalId": null,
  "email": "licensing@streammax.com",
  "metadata": null,
  "createdAt": "2026-03-02T10:02:00.000Z",
  "updatedAt": "2026-03-02T10:02:00.000Z"
}
```

**Save:** Copy `"id"` as **`STREAMMAX_ID`**

---

### 2c — Lead Investor

```json
{
  "name": "Nexus Media Fund",
  "role": "INVESTOR",
  "email": "fund@nexusmedia.com"
}
```

**Expected Response** (Status `201 Created`):

```json
{
  "id": "p-inv1-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "dealId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Nexus Media Fund",
  "role": "INVESTOR",
  "externalId": null,
  "email": "fund@nexusmedia.com",
  "metadata": null,
  "createdAt": "2026-03-02T10:03:00.000Z",
  "updatedAt": "2026-03-02T10:03:00.000Z"
}
```

**Save:** Copy `"id"` as **`NEXUS_FUND_ID`**

---

### 2d — Co-Investor

```json
{
  "name": "Creative Spark Ventures",
  "role": "INVESTOR",
  "email": "invest@creativespark.com"
}
```

**Expected Response** (Status `201 Created`):

```json
{
  "id": "p-inv2-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "dealId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Creative Spark Ventures",
  "role": "INVESTOR",
  "externalId": null,
  "email": "invest@creativespark.com",
  "metadata": null,
  "createdAt": "2026-03-02T10:04:00.000Z",
  "updatedAt": "2026-03-02T10:04:00.000Z"
}
```

**Save:** Copy `"id"` as **`CREATIVE_SPARK_ID`**

---

### 2e — Creator/Showrunner (Talent)

```json
{
  "name": "Maya Rodriguez",
  "role": "TALENT",
  "email": "maya.rodriguez@agent.com"
}
```

**Expected Response** (Status `201 Created`):

```json
{
  "id": "p-talent-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "dealId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Maya Rodriguez",
  "role": "TALENT",
  "externalId": null,
  "email": "maya.rodriguez@agent.com",
  "metadata": null,
  "createdAt": "2026-03-02T10:05:00.000Z",
  "updatedAt": "2026-03-02T10:05:00.000Z"
}
```

**Save:** Copy `"id"` as **`MAYA_RODRIGUEZ_ID`**

---

**What to check after adding all 5 participants:**

- Each response has `"role"` matching what you entered (`STUDIO`, `DISTRIBUTOR`, `INVESTOR`, `INVESTOR`, `TALENT`)
- Each response has `"dealId"` matching your deal
- You have **5 unique participant IDs** saved

---

## Step 3a: Rule Validation Demo — Submit Invalid Rules

**What this demonstrates:** Rule snapshots validate all participant data before accepting it. Let's intentionally submit bad data to see the validation system in action.

**Endpoint:** `POST /api/v1/deals/{dealId}/rule-snapshots`

**Path Parameter:** Replace `{dealId}` with your **`DEAL_ID`**.

**Request Body — INTENTIONALLY INVALID:** (fee > 100%, profit percentages sum to 120%, fake participant ID)

```json
{
  "effectiveFrom": "2026-01-01T00:00:00.000Z",
  "rules": {
    "currency": "USD"
  },
  "participants": [
    {
      "participantId": "<STREAMMAX_ID>",
      "participantData": { "feePercentage": 150 }
    },
    {
      "participantId": "<NEXUS_FUND_ID>",
      "participantData": { "netProfitPercentage": 60 }
    },
    {
      "participantId": "<AURORA_STUDIO_ID>",
      "participantData": { "netProfitPercentage": 60 }
    }
  ]
}
```

**Expected Response** (Status `400 Bad Request`):

```json
{
  "statusCode": 400,
  "message": "Rule validation failed",
  "errors": [
    "Participant <STREAMMAX_ID>: feePercentage must be 0-100 (got 150)",
    "Participants not found in this deal: <NEXUS_FUND_ID>",
    "Net profit percentages sum to 120% (cannot exceed 100%)"
  ]
}
```

**What to observe:**

- The system caught **3 different errors** in a single request
- Each error message tells you **exactly what's wrong and where**
- The fake participant ID `00000000-...0099` was rejected because it doesn't belong to this deal
- The fee percentage of 150% was rejected (must be 0-100)
- The net profit percentages (60% + 60% = 120%) were rejected (cannot exceed 100%)
- **All errors are reported at once** — you don't have to fix them one at a time

> This ensures only valid, audit-safe rules can be locked into the system.

---

## Step 3b: Create Rule Snapshot — Lock the Deal Terms

**What this does:** Creates an **immutable rule snapshot** that freezes the deal terms. Once created, this snapshot cannot be edited or deleted — any future changes require creating a new version. This is the foundation of audit-safe settlement computing.

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
      "participantId": "<STREAMMAX_ID>",
      "participantData": { "feePercentage": 18 }
    },
    {
      "participantId": "<NEXUS_FUND_ID>",
      "participantData": { "recoupCap": 15000000, "priority": 1, "netProfitPercentage": 20 }
    },
    {
      "participantId": "<CREATIVE_SPARK_ID>",
      "participantData": { "recoupCap": 8000000, "priority": 2, "netProfitPercentage": 15 }
    },
    {
      "participantId": "<AURORA_STUDIO_ID>",
      "participantData": { "netProfitPercentage": 55 }
    },
    {
      "participantId": "<MAYA_RODRIGUEZ_ID>",
      "participantData": { "netProfitPercentage": 10 }
    }
  ]
}
```

**How the `participantData` drives the settlement engine:**

| Field                 | Meaning                                  | Used By                                                      |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| `feePercentage`       | Distribution fee % taken off the top     | StreamMax Distribution (18%)                                 |
| `recoupCap`           | Maximum amount to recoup (get back)      | Nexus Media Fund ($15M), Creative Spark ($8M)                |
| `priority`            | Recoupment order (1 = first, 2 = second) | Determines who gets paid back first                          |
| `netProfitPercentage` | Share of remaining profit                | Must total 100% across all participants (55+20+15+10 = 100%) |

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
  "createdAt": "2026-03-02T10:06:00.000Z",
  "updatedAt": "2026-03-02T10:06:00.000Z"
}
```

**What to check in the response:**

- `"version"` is `1` (first snapshot for this deal — the invalid attempt in 3a was rejected, so no snapshot was created)
- `"participantCount"` is `5` — all 5 participants are included
- `"effectiveTo"` is `null` — this is the current active snapshot
- The rules and participant terms are now **frozen and immutable**

**Save this value:** Copy the `"id"` as **`RULE_SNAPSHOT_ID`**.

---

## Step 3c: View Rule Summary — Auto-Generated Deal Intelligence

**What this demonstrates:** The `ruleSummary` — when you retrieve a rule snapshot's full details, the system generates an **automatic human-readable summary** of the entire settlement configuration.

**Endpoint:** `GET /api/v1/rule-snapshots/{id}`

**Path Parameter:** Replace `{id}` with your **`RULE_SNAPSHOT_ID`** from Step 3b.

**Request Body:** None — this is a GET request (read-only).

**Expected Response** (Status `200 OK`):

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
  "createdAt": "2026-03-02T10:06:00.000Z",
  "updatedAt": "2026-03-02T10:06:00.000Z",
  "participants": [
    {
      "id": "rsp-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-dist-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "StreamMax Distribution",
      "participantRole": "DISTRIBUTOR",
      "participantData": { "feePercentage": 18 },
      "createdAt": "2026-03-02T10:06:00.000Z"
    },
    {
      "id": "rsp-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-inv1-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Nexus Media Fund",
      "participantRole": "INVESTOR",
      "participantData": { "recoupCap": 15000000, "priority": 1, "netProfitPercentage": 20 },
      "createdAt": "2026-03-02T10:06:00.000Z"
    },
    {
      "id": "rsp-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-inv2-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Creative Spark Ventures",
      "participantRole": "INVESTOR",
      "participantData": { "recoupCap": 8000000, "priority": 2, "netProfitPercentage": 15 },
      "createdAt": "2026-03-02T10:06:00.000Z"
    },
    {
      "id": "rsp-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-studio-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Aurora Animation Studio",
      "participantRole": "STUDIO",
      "participantData": { "netProfitPercentage": 55 },
      "createdAt": "2026-03-02T10:06:00.000Z"
    },
    {
      "id": "rsp-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-talent-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Maya Rodriguez",
      "participantRole": "TALENT",
      "participantData": { "netProfitPercentage": 10 },
      "createdAt": "2026-03-02T10:06:00.000Z"
    }
  ],
  "ruleSummary": {
    "totalParticipants": 5,
    "roleBreakdown": {
      "DISTRIBUTOR": 1,
      "INVESTOR": 2,
      "STUDIO": 1,
      "TALENT": 1
    },
    "totalDistributionFeePercent": 18,
    "totalRecoupmentCap": 23000000,
    "netProfitSplit": {
      "Nexus Media Fund": 20,
      "Creative Spark Ventures": 15,
      "Aurora Animation Studio": 55,
      "Maya Rodriguez": 10
    }
  }
}
```

**What to observe in `ruleSummary`:**

| Field                         | Value                                                   | What It Means                                          |
| ----------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| `totalParticipants`           | `5`                                                     | 5 parties are involved in this deal                    |
| `roleBreakdown`               | `{ DISTRIBUTOR: 1, INVESTOR: 2, STUDIO: 1, TALENT: 1 }` | One distributor, two investors, one studio, one talent |
| `totalDistributionFeePercent` | `18`                                                    | 18% of gross revenue goes to distribution fees         |
| `totalRecoupmentCap`          | `23000000`                                              | $23M total investment to be recouped ($15M + $8M)      |
| `netProfitSplit`              | `{ Aurora: 55, Nexus: 20, Creative: 15, Maya: 10 }`     | Net profit is split 55/20/15/10 — totaling 100%        |
| `warnings`                    | _(not present)_                                         | No warnings — the configuration is valid               |

> The `ruleSummary` gives non-technical stakeholders an instant overview of how money flows — without parsing individual participant data.

---

## Step 4a: Revenue Period Validation Demo — Submit Invalid Dates

**What this demonstrates:** Revenue batches validate that the reporting period is logically correct before accepting data.

**Endpoint:** `POST /api/v1/deals/{dealId}/revenue-batches`

**Path Parameter:** Replace `{dealId}` with your **`DEAL_ID`**.

**Request Body — INTENTIONALLY INVALID:** (periodStart is AFTER periodEnd)

```json
{
  "periodStart": "2026-12-31T23:59:59.999Z",
  "periodEnd": "2026-01-01T00:00:00.000Z",
  "totalAmount": 75000000,
  "currency": "USD",
  "source": "Test - Invalid Period"
}
```

**Expected Response** (Status `400 Bad Request`):

```json
{
  "statusCode": 400,
  "message": "periodStart must be before periodEnd"
}
```

**What to observe:**

- The system caught that the start date (December 31) is after the end date (January 1)
- The error message is clear and specific
- The revenue batch was NOT created — preventing incorrect data from entering the system

---

## Step 4b: Register Revenue — Validated Input Data

**What this does:** Records the revenue that will be distributed in the settlement. Revenue starts in `"PENDING"` status and must go through a validation step before it can be used — this is the compliance gate.

**Endpoint:** `POST /api/v1/deals/{dealId}/revenue-batches`

**Path Parameter:** Replace `{dealId}` with your **`DEAL_ID`**.

**Request Body:**

```json
{
  "periodStart": "2026-01-01T00:00:00.000Z",
  "periodEnd": "2026-12-31T23:59:59.999Z",
  "totalAmount": 75000000,
  "currency": "USD",
  "source": "StreamMax Platform Revenue + Merchandise Licensing 2026",
  "metadata": {
    "breakdown": {
      "streaming": 62000000,
      "merchandise": 13000000
    },
    "episodes": 8,
    "territory": "Worldwide"
  }
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
  "totalAmount": 75000000,
  "currency": "USD",
  "status": "PENDING",
  "source": "StreamMax Platform Revenue + Merchandise Licensing 2026",
  "metadata": {
    "breakdown": {
      "streaming": 62000000,
      "merchandise": 13000000
    },
    "episodes": 8,
    "territory": "Worldwide"
  },
  "isSettled": false,
  "settlementRunCount": 0,
  "createdAt": "2026-03-02T10:08:00.000Z",
  "updatedAt": "2026-03-02T10:08:00.000Z"
}
```

**What to check in the response:**

- `"status"` is `"PENDING"` — the revenue is NOT yet approved for settlement
- `"batchNumber"` is auto-generated (e.g., `"RB-2026-001"`)
- `"totalAmount"` is `75000000` ($75M)
- `"metadata"` contains the streaming/merchandise breakdown you provided
- `"isSettled"` is `false` — this batch has not been used in any settlement yet

**Save this value:** Copy the `"id"` as **`REVENUE_BATCH_ID`**.

---

## Step 5: Validate Revenue — Compliance Gate

**What this does:** Approves the revenue for settlement. The system **requires** revenue to be validated before it can be included in any settlement run. In a real scenario, this step would happen after an auditor reviews the revenue data against source documents.

**Endpoint:** `PATCH /api/v1/revenue-batches/{revenueBatchId}/validate`

**Path Parameter:** Replace `{revenueBatchId}` with your **`REVENUE_BATCH_ID`** from Step 4b.

**Request Body:**

```json
{
  "validationNotes": "Revenue verified against StreamMax distribution reports and merchandise licensing statements"
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
  "totalAmount": 75000000,
  "currency": "USD",
  "status": "VALIDATED",
  "source": "StreamMax Platform Revenue + Merchandise Licensing 2026",
  "metadata": {
    "breakdown": {
      "streaming": 62000000,
      "merchandise": 13000000
    },
    "episodes": 8,
    "territory": "Worldwide",
    "validationNotes": "Revenue verified against StreamMax distribution reports and merchandise licensing statements",
    "validatedAt": "2026-03-02T10:09:00.000Z"
  },
  "isSettled": false,
  "settlementRunCount": 0,
  "createdAt": "2026-03-02T10:08:00.000Z",
  "updatedAt": "2026-03-02T10:09:00.000Z"
}
```

**What to check in the response:**

- `"status"` changed from `"PENDING"` to `"VALIDATED"` — the revenue is now approved for settlement
- `"metadata"` now contains the `"validationNotes"` and `"validatedAt"` timestamp
- `"updatedAt"` is newer than `"createdAt"` — confirms the record was modified

---

## Step 6: Create Settlement Run — Bind Rules + Revenue

**What this does:** Creates a **settlement run** that binds the frozen rule snapshot with the validated revenue batch. This is the connection point between rules, inputs, and the computation engine. Nothing is calculated yet — this prepares the "calculation job."

**Endpoint:** `POST /api/v1/deals/{dealId}/settlement-runs`

**Path Parameter:** Replace `{dealId}` with your **`DEAL_ID`**.

**Request Body:** Replace the placeholders with your actual IDs:

```json
{
  "ruleSnapshotId": "<RULE_SNAPSHOT_ID>",
  "revenueBatchIds": ["<REVENUE_BATCH_ID>"],
  "notes": "Full year 2026 settlement for Echoes of Tomorrow animated series"
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
  "notes": "Full year 2026 settlement for Echoes of Tomorrow animated series",
  "executedAt": null,
  "createdAt": "2026-03-02T10:10:00.000Z",
  "updatedAt": "2026-03-02T10:10:00.000Z"
}
```

**What to check in the response:**

- `"status"` is `"DRAFT"` — the settlement has not been calculated yet
- `"ruleSnapshotId"` matches the snapshot you created
- `"runType"` is `"NORMAL"` (not a correction run)
- `"totalAllocated"` is `0` — nothing computed yet

**Save this value:** Copy the `"id"` as **`SETTLEMENT_RUN_ID`**.

---

## Step 7: Preview Settlement — The Engine Runs

**What this does:** The computation engine reads the frozen rules from the snapshot, reads the validated revenue from the batch, and processes the entire 4-phase waterfall calculation. **Nothing is saved permanently yet** — this is a preview that can be reviewed before committing.

**Endpoint:** `POST /api/v1/settlement-runs/{settlementRunId}/preview`

**Path Parameter:** Replace `{settlementRunId}` with your **`SETTLEMENT_RUN_ID`** from Step 6.

**Request Body:** None needed — leave the body empty and just click Execute.

**Expected Response** (Status `200 OK`):

```json
{
  "settlementRunId": "sr-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "status": "PREVIEWED",
  "totalRevenue": 75000000,
  "totalAllocated": 75000000,
  "currency": "USD",
  "allocations": [
    {
      "id": "preview-0",
      "participantId": "p-dist-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "StreamMax Distribution",
      "amount": 13500000,
      "currency": "USD",
      "phase": "DISTRIBUTION_FEES"
    },
    {
      "id": "preview-1",
      "participantId": "p-inv1-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Nexus Media Fund",
      "amount": 15000000,
      "currency": "USD",
      "phase": "RECOUPMENT"
    },
    {
      "id": "preview-2",
      "participantId": "p-inv2-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Creative Spark Ventures",
      "amount": 8000000,
      "currency": "USD",
      "phase": "RECOUPMENT"
    },
    {
      "id": "preview-3",
      "participantId": "p-studio-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Aurora Animation Studio",
      "amount": 21175000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    },
    {
      "id": "preview-4",
      "participantId": "p-inv1-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Nexus Media Fund",
      "amount": 7700000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    },
    {
      "id": "preview-5",
      "participantId": "p-inv2-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Creative Spark Ventures",
      "amount": 5775000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    },
    {
      "id": "preview-6",
      "participantId": "p-talent-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Maya Rodriguez",
      "amount": 3850000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    }
  ],
  "proof": {
    "proofHash": "sha256:b7e4a2f1c8d3...(64 hex characters)",
    "algorithm": "SHA-256",
    "timestamp": "2026-03-02T10:11:00.000Z"
  },
  "message": "Preview complete. Call POST /settlement-runs/{id}/finalize to lock results."
}
```

**What to check in the response:**

1. **Total Revenue = Total Allocated** — every dollar is accounted for:
   - `"totalRevenue": 75000000` = `"totalAllocated": 75000000`

2. **Allocations by phase** — verify the waterfall calculation:

   | Participant             | Phase             | Amount      | Explanation                           |
   | ----------------------- | ----------------- | ----------- | ------------------------------------- |
   | StreamMax Distribution  | DISTRIBUTION_FEES | $13,500,000 | 18% of $75M                           |
   | Nexus Media Fund        | RECOUPMENT        | $15,000,000 | Full investment recouped (Priority 1) |
   | Creative Spark Ventures | RECOUPMENT        | $8,000,000  | Full investment recouped (Priority 2) |
   | Aurora Animation Studio | NET_PROFITS       | $21,175,000 | 55% of $38.5M remaining               |
   | Nexus Media Fund        | NET_PROFITS       | $7,700,000  | 20% of $38.5M remaining               |
   | Creative Spark Ventures | NET_PROFITS       | $5,775,000  | 15% of $38.5M remaining               |
   | Maya Rodriguez          | NET_PROFITS       | $3,850,000  | 10% of $38.5M remaining               |

3. **Math verification:**
   - Distribution: $75M × 18% = $13.5M
   - Remaining after fees: $75M - $13.5M = $61.5M
   - Remaining after recoupment: $61.5M - $15M - $8M = $38.5M
   - Net profit total: $21.175M + $7.7M + $5.775M + $3.85M = $38.5M
   - Grand total: $13.5M + $15M + $8M + $38.5M = $75M

4. **Proof hash exists** — the SHA-256 cryptographic fingerprint proves calculation integrity

5. **Status changed** — `"status"` is now `"PREVIEWED"`

---

## Step 8: Finalize Settlement — Lock Results Permanently

**What this does:** Permanently records the settlement results in a single **atomic transaction**:

1. **Re-calculates** the settlement (verifies determinism — same result as preview)
2. **Saves all allocations** to the database permanently
3. **Creates a proof record** with the SHA-256 hash
4. **Creates ledger entries** with double-entry bookkeeping (debits and credits)
5. **Marks revenue batches** as `"PROCESSED"`
6. **Marks the settlement run** as `"FINALIZED"`

If any step fails, everything rolls back — no partial data.

**Endpoint:** `POST /api/v1/settlement-runs/{settlementRunId}/finalize`

**Path Parameter:** Replace `{settlementRunId}` with your **`SETTLEMENT_RUN_ID`**.

**Request Body:** None needed — leave the body empty and just click Execute.

**Expected Response** (Status `200 OK`):

```json
{
  "settlementRunId": "sr-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "status": "FINALIZED",
  "totalRevenue": 75000000,
  "totalAllocated": 75000000,
  "currency": "USD",
  "allocations": [
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-dist-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "StreamMax Distribution",
      "amount": 13500000,
      "currency": "USD",
      "phase": "DISTRIBUTION_FEES"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-inv1-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Nexus Media Fund",
      "amount": 15000000,
      "currency": "USD",
      "phase": "RECOUPMENT"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-inv2-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Creative Spark Ventures",
      "amount": 8000000,
      "currency": "USD",
      "phase": "RECOUPMENT"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-studio-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Aurora Animation Studio",
      "amount": 21175000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-inv1-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Nexus Media Fund",
      "amount": 7700000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-inv2-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Creative Spark Ventures",
      "amount": 5775000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "p-talent-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantName": "Maya Rodriguez",
      "amount": 3850000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    }
  ],
  "proof": {
    "proofHash": "sha256:b7e4a2f1c8d3...(64 hex characters)",
    "algorithm": "SHA-256",
    "timestamp": "2026-03-02T10:12:00.000Z"
  },
  "ledger": {
    "journalIds": ["jnl-xxxx-xxxx-xxxx-xxxxxxxxxxxx"],
    "postingCount": 8
  },
  "finalizedAt": "2026-03-02T10:12:00.000Z",
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

---

## Step 9: View Complete Settlement Details

**What this does:** Retrieves the full settlement record — the complete **audit trail** showing which rules and which revenue produced which results.

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
  "totalAllocated": 75000000,
  "currency": "USD",
  "notes": "Full year 2026 settlement for Echoes of Tomorrow animated series",
  "executedAt": "2026-03-02T10:12:00.000Z",
  "createdAt": "2026-03-02T10:10:00.000Z",
  "updatedAt": "2026-03-02T10:12:00.000Z",
  "revenueBatches": [
    {
      "id": "rb-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "batchNumber": "RB-2026-001",
      "periodStart": "2026-01-01T00:00:00.000Z",
      "periodEnd": "2026-12-31T23:59:59.999Z",
      "totalAmount": 75000000,
      "currency": "USD"
    }
  ],
  "allocations": [
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "...",
      "participantName": "StreamMax Distribution",
      "amount": 13500000,
      "currency": "USD",
      "phase": "DISTRIBUTION_FEES"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "...",
      "participantName": "Nexus Media Fund",
      "amount": 15000000,
      "currency": "USD",
      "phase": "RECOUPMENT"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "...",
      "participantName": "Creative Spark Ventures",
      "amount": 8000000,
      "currency": "USD",
      "phase": "RECOUPMENT"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "...",
      "participantName": "Aurora Animation Studio",
      "amount": 21175000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "...",
      "participantName": "Nexus Media Fund",
      "amount": 7700000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "...",
      "participantName": "Creative Spark Ventures",
      "amount": 5775000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    },
    {
      "id": "alloc-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "participantId": "...",
      "participantName": "Maya Rodriguez",
      "amount": 3850000,
      "currency": "USD",
      "phase": "NET_PROFITS"
    }
  ],
  "proof": {
    "proofHash": "sha256:b7e4a2f1c8d3...(64 hex characters)",
    "algorithm": "SHA-256",
    "timestamp": "2026-03-02T10:12:00.000Z"
  },
  "ledger": {
    "journalIds": ["jnl-xxxx-xxxx-xxxx-xxxxxxxxxxxx"],
    "postingCount": 8
  }
}
```

**What to check in the response:**

- `"ruleSnapshotId"` — traces back to the exact rules used
- `"revenueBatches"` — traces back to the exact revenue used
- `"allocations"` — the results produced by those rules × that revenue
- `"proof"` — cryptographic verification of calculation integrity
- `"ledger"` — accounting entries created on finalization
- The complete chain is traceable: **rules → inputs → results**

---

## Summary — IDs to Save at Each Step

| Step | Action                      | ID to Save        | Name Used In Guide  |
| ---- | --------------------------- | ----------------- | ------------------- |
| 1    | Create Deal                 | Deal ID           | `DEAL_ID`           |
| 2a   | Add Aurora Animation Studio | Participant ID    | `AURORA_STUDIO_ID`  |
| 2b   | Add StreamMax Distribution  | Participant ID    | `STREAMMAX_ID`      |
| 2c   | Add Nexus Media Fund        | Participant ID    | `NEXUS_FUND_ID`     |
| 2d   | Add Creative Spark Ventures | Participant ID    | `CREATIVE_SPARK_ID` |
| 2e   | Add Maya Rodriguez          | Participant ID    | `MAYA_RODRIGUEZ_ID` |
| 3b   | Create Rule Snapshot        | Rule Snapshot ID  | `RULE_SNAPSHOT_ID`  |
| 4b   | Register Revenue            | Revenue Batch ID  | `REVENUE_BATCH_ID`  |
| 6    | Create Settlement Run       | Settlement Run ID | `SETTLEMENT_RUN_ID` |

---

## Summary — Milestone 2B Features Demonstrated

| Step | Feature                        | What You Saw                                                                                         |
| ---- | ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 3a   | **Rule Validation**            | System rejected invalid fee %, fake participant ID, and profit % > 100% — all errors in one response |
| 3b   | **Immutable Rule Snapshot**    | Locked deal terms into a versioned, frozen snapshot                                                  |
| 3c   | **`ruleSummary` Intelligence** | Auto-generated breakdown showing fees, recoupment caps, and profit splits at a glance                |
| 4a   | **Revenue Period Validation**  | System rejected reversed dates with clear error message                                              |
| 4b   | **Revenue Batch Structure**    | Registered revenue with metadata, auto-generated batch number, and lifecycle tracking                |
| 5    | **Revenue Lifecycle**          | PENDING → VALIDATED compliance gate before settlement                                                |
| 6    | **Rules + Revenue Binding**    | Bound frozen rules with validated revenue into a settlement run                                      |
| 7-9  | **Full Pipeline**              | Rules → Revenue → Engine → Allocations → Proof → Ledger                                              |

---

## Summary — Expected Final Payout

| Party                   | Distribution Fee | Recoupment      | Net Profit      | **Grand Total** |
| ----------------------- | ---------------- | --------------- | --------------- | --------------- |
| StreamMax Distribution  | $13,500,000      | —               | —               | **$13,500,000** |
| Nexus Media Fund        | —                | $15,000,000     | $7,700,000      | **$22,700,000** |
| Creative Spark Ventures | —                | $8,000,000      | $5,775,000      | **$13,775,000** |
| Aurora Animation Studio | —                | —               | $21,175,000     | **$21,175,000** |
| Maya Rodriguez          | —                | —               | $3,850,000      | **$3,850,000**  |
| **TOTAL**               | **$13,500,000**  | **$23,000,000** | **$38,500,000** | **$75,000,000** |

Every dollar is accounted for. No rounding errors. No discrepancies.
