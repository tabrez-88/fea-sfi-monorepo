# Client Design Feedback Log

**Purpose:** Living document tracking design feedback from Liang (client), what changes are needed in Figma, ticket updates required, and any BE implications.

**How to use:** Each time Liang gives new feedback, add a new entry under `## Feedback Entries`. List what screens are affected, what Figma frames to update, and which tickets need to be created or modified.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Done / Resolved |
| 🔄 | In Progress |
| ⏳ | Pending / Not started |
| 🎨 | Figma change needed |
| 🎫 | Notion ticket change needed |
| 🔧 | BE work needed |
| 🖥️ | FE work needed |

---

## Feedback Entries

---

### [FB-001] CSV Import/Export for Participants

**Date:** ~Apr 8–10, 2026 (6-5 days ago from Apr 14)
**Source:** Notion comment thread on Sprint 2 board — Participants card
**Raised by:** Liangliang Lyu
**Discussed with:** Tabrez Akhlaque, confirmed with dev team
**Status:** ⏳ Design change pending, tickets to be created

#### Context / Liang's Concern

For deals with **200+ investors** (common in FEA), manually entering each participant one-by-one via the Add Participant modal is completely impractical. Liang wants to be able to:

1. **Import** participant info from FEA into SFI Admin via CSV
2. **Export** participant list from SFI Admin to CSV (for reference / handoff)

**Agreed format:** CSV (better for non-technical users, confirmed by Tabrez)

**Scope clarification from conversation:**
- The investors Liang is referring to are FEA investors (who invested in a deal, e.g. a movie funded by 200 investors sharing a 20% revenue slice)
- For those investors, SFI needs their name + role + basic info to compute settlement allocations
- The import is: FEA investor list → CSV → bulk upload into SFI Admin as participants for a specific deal

---

#### Design Changes Needed

##### 🎨 Screen D1 / FEA-9: Participants List (4.1)

**Figma node:** In Progress tab → Participants section (node 1:4779 area)

Current header:
```
Participants (5)                            [+ Add Participant]
```

Updated header should be:
```
Participants (5)              [↑ Import CSV]  [↓ Export CSV]  [+ Add Participant]
```

Changes:
- Add `[↑ Import CSV]` button (secondary/outline style) that opens the Import Participants modal
- Add `[↓ Export CSV]` button (ghost/text style or icon button) that triggers CSV download of current participant list
- Keep `[+ Add Participant]` as primary action (still useful for small deals / individual adds)

##### 🎨 New Screen D4: Import Participants (CSV)

**New Figma frame needed** in the Participants section.

This is a **multi-step modal** triggered by `[↑ Import CSV]`.

```
Step 1 — Upload
┌──────────────────────────────────────────────────────┐
│  Import Participants via CSV              [✕]         │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Upload a CSV file to bulk-add participants.          │
│                                                       │
│  Required columns: name, role                         │
│  Optional columns: email, externalId                  │
│                                                       │
│  [📥 Download CSV Template]                           │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │                                               │    │
│  │        Drag & drop CSV here, or              │    │
│  │           [Browse File]                       │    │
│  │                                               │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  Supported: .csv only. Max 500 rows per import.       │
│                                                       │
│                           [Cancel]  [Upload & Preview]│
└──────────────────────────────────────────────────────┘

Step 2 — Preview & Validation
┌──────────────────────────────────────────────────────┐
│  Preview Import (48 rows found)           [✕]         │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ✓ 46 rows valid    ⚠ 2 rows have errors             │
│                                                       │
│  Name                   │ Role       │ Email    │ Status  │
│  ─────────────────────────────────────────────────── │
│  Wei Zhang              │ INVESTOR   │ —        │ ✓ OK    │
│  Aisha Patel            │ INVESTOR   │ —        │ ✓ OK    │
│  ...                    │ ...        │ ...      │ ...     │
│  John ???               │ UNKNOWN    │ —        │ ⚠ Error │
│                           └─ Invalid role: "UNKNOWN"  │
│                                                       │
│  ☑ Skip rows with errors and import valid rows only   │
│                                                       │
│         [← Back]  [Cancel]  [Import 46 Participants]  │
└──────────────────────────────────────────────────────┘

Step 3 — Success
┌──────────────────────────────────────────────────────┐
│  Import Complete                          [✕]         │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ✓ 46 participants imported successfully              │
│  ✗ 2 rows skipped (invalid role)                     │
│                                                       │
│  [Download Error Report]                              │
│                                                       │
│                                      [View Participants]│
└──────────────────────────────────────────────────────┘
```

**CSV Template format:**
```
name,role,email,externalId
Wei Zhang,INVESTOR,wei@example.com,FEA-001
Aisha Patel,INVESTOR,,FEA-002
```

Valid roles: `PRODUCER`, `DISTRIBUTOR`, `INVESTOR`, `TALENT`, `STUDIO`, `LICENSOR`, `LICENSEE`, `COLLECTION_AGENT`

---

#### Ticket Changes Needed

##### 🎫 Update FEA-9: Design & Build: Participants List

**Current:** No import/export mentioned in wireframe or interactions.

**Updates needed:**
- Update wireframe to show three-button header: `[↑ Import CSV]`, `[↓ Export CSV]`, `[+ Add Participant]`
- Add interaction: `[↑ Import CSV]` → opens Import Participants modal (new Screen D4)
- Add interaction: `[↓ Export CSV]` → triggers `GET /deals/:dealId/participants/export` → downloads `participants-{dealId}.csv`
- Keep all other requirements unchanged

##### 🎫 FEA-10: Design & Build: Add Participant — NO CHANGE

No changes needed. Single-add modal remains relevant for:
- Small deals (studios, distributors, key talent — typically ≤10 parties)
- Adding individual investors manually if needed

##### 🎫 New ticket: Design: Import Participants (CSV) — Screen D4

**Suggested ticket fields:**
- **Task Name:** Design & Build: Import Participants (CSV)
- **Epic:** Participants
- **Milestone:** MS-2: Participants & Rules
- **Priority:** 1 - Must Have
- **Type:** Design → Frontend → Backend (3 tickets or phased)
- **Screen:** 4.4 Import Participants
- **Sprint:** Current sprint (Sprint 2)

**Acceptance criteria:**
- Multi-step modal: Upload → Preview → Success
- CSV template downloadable (with headers: name, role, email, externalId)
- Preview step shows all rows with validation status (valid / error)
- Error rows show reason (e.g., "Invalid role", "Missing name")
- Option to skip error rows and import valid ones
- Success step shows imported count + skipped count
- Error report downloadable from success step

##### 🎫 New ticket: Backend: Bulk Import + Export Participants

**Suggested ticket fields:**
- **Task Name:** Backend: Bulk Participant Import & Export Endpoints
- **Epic:** Participants
- **Milestone:** MS-2: Participants & Rules
- **Priority:** 1 - Must Have
- **Type:** Backend
- **Sprint:** Current sprint (Sprint 2)

**New endpoints:**
```
POST /deals/:dealId/participants/import
  - Content-Type: multipart/form-data (CSV file)
  - Request: file (CSV), options: { skipErrors: boolean }
  - Response: { imported: number, skipped: number, errors: [{ row, reason }] }
  - Validates role enum, name required
  - Bulk inserts valid rows

GET /deals/:dealId/participants/export
  - Response: CSV file download
  - Headers: Content-Disposition: attachment; filename="participants-{dealId}.csv"
  - Columns: name, role, email, externalId

GET /deals/:dealId/participants/import/template
  - Response: CSV template file with headers only
  - Or: just document the format and handle template on FE
```

---

#### Figma Frames To Update

| Frame | Node Area | Change |
|-------|-----------|--------|
| D1 - Participants List | node 1:4779 → Participants section | Add Import/Export buttons to header |
| New: D4 - Import CSV | Create new frame | 3-step modal wireframe |

---

#### Summary of Impact

| Item | Status | Owner |
|------|--------|-------|
| Update Figma: D1 header buttons | ⏳ | Design |
| Create Figma: D4 Import modal (3 steps) | ⏳ | Design |
| Update Notion FEA-9 ticket spec | ⏳ | PM/Dev |
| Create Notion ticket: Design D4 Import | ⏳ | PM/Dev |
| Create Notion ticket: BE import/export endpoints | ⏳ | PM/Dev |
| FE: Import modal component | ⏳ | Frontend |
| FE: CSV parsing + preview table | ⏳ | Frontend |
| FE: Export CSV trigger | ⏳ | Frontend |
| BE: POST /participants/import | ✅ Apr 14 | Backend |
| BE: GET /participants/export | ✅ Apr 14 | Backend |

---

#### Design Spec Update (FEA_ADMIN_PORTAL_COMPLETE_DESIGN.md)

Section D: Participants — needs the following additions:

1. **D1 wireframe** — update header to include Import/Export buttons
2. **New screen D4** — Import Participants (CSV upload flow, 3 steps)
3. **Screen count** — Participants section goes from 3 → 4 screens
4. **Backend gap analysis** — add the 2 new import/export endpoints as Tier 1 Must-Have (needed for MS-2)
5. **D3 screen count** — no change

---

---

### [FB-002] Role Taxonomy Too Narrow + 200-Investor Individual Allocation Problem

**Date:** ~Apr 9–12, 2026 (5-2 days ago from Apr 14)
**Source:** Figma comments on Rule Snapshot Detail page
**Raised by:** Liangliang Lyu
**Discussed with:** Tabrez Akhlaque (acknowledged both points), Dera Kayla (flagged for UI briefing)
**Status:** ⏳ Design decision pending, tickets to be created

---

#### Context

Two related problems raised on the Rule Snapshot Detail screen, both ultimately about FEA being a multi-industry platform — not just movies.

---

#### Sub-issue A: Roles are too narrow — FEA-SFI is a full RWA platform

**Two separate Figma comments from Liang, same root concern:**

Comment 1 (on Participants page):
> "all the roles here look like just for a movie investment share. the whole idea is for RWA — music royalty, tour, TV shows, studio rental revenue, future hotel, factory, cloth/fashion brand. so kinda just one category of whole RWA"

Comment 2 (on Rule Snapshot Detail):
> "the role I'm not sure here, this looks like only for movie project. FEA is: entertainment, music royalty, tour, video games, shows, studio revenue, movie streaming, influencer project revenue, future makeup brand, art, fashion brand"
> "so I guess can't be limited here — either way have category for all above, or when import/put in rule, admin can name all the roles"
> "more like creator, project, platform, investor etc"

**Key clarification: FEA-SFI is not just entertainment — it is a Real World Asset (RWA) revenue settlement platform.** Asset classes include (but are not limited to): music royalties, live tours, TV/streaming shows, studio rentals, hotel revenue, factory/manufacturing output, fashion/clothing brands, art, influencer projects. The current hardcoded roles (`STUDIO`, `DISTRIBUTOR`, `INVESTOR`, `TALENT`, `PRODUCER`, `LICENSOR`, `LICENSEE`, `COLLECTION_AGENT`) are 100% film-finance terminology and cover only one of many asset classes.

**Implication:** Option A (expanded fixed list) is not viable long-term. A fixed enum will break every time a new asset class onboards. **Option B (custom role name + behavior type) is clearly the right architecture for a true RWA platform.**

**Tabrez response:** "noted" on comment 2 — acknowledged, not yet resolved.

---

#### Sub-issue B: 200 investors each with different share percentages in Rule Snapshot

**Liang's exact words:**
> "for single project, if share 100% revenue: distribution 20%, producer 10%, studio 30%, actor 20%, the rest 30% for investor — so there will be 200 investors and each investor holds different shares, how this works?"

**Tabrez's response:**
> "the core data model and settlement engine can already handle multiple investors with individual allocations, so the foundation is there. But it's not yet optimized for a scenario like 200 investors with different shares — things like bulk import, investor grouping, and share-based allocation still need to be built out. I'll get that updated and brief Dera Kayla on the UI side."

**The problem in the current Create Rule Snapshot Step 2:**
- The form shows ALL participants as a scrollable checklist with role-specific fields per participant
- With 5 participants → already ~20 input fields on screen (see Figma node 437:10762)
- With 200 investors each needing `Recoupment Cap + Priority + Net Profit %` → **600 input fields**. Completely unusable.

**What Liang means by "different shares":**
- Each investor holds X shares out of total Y shares (stock/equity model)
- Their allocation % = X/Y × total investor pool %
- Example: 200 investors, pool = 30%, investor A holds 500/10,000 shares → gets 0.5% × 30% = 1.5%

---

#### How FB-001 + FB-002 form a chain

```
FB-001: Import 200 investor names into Participants table
  ↓
FB-002b: Create Rule Snapshot Step 2 → assign individual allocation % to all 200
  ↓
Settlement engine computes per-investor payouts
```

FB-001 solves getting investors INTO the system. FB-002b solves assigning their ALLOCATION TERMS. Both need to work together for large deals.

---

#### Design Changes Needed

##### 🎨 Sub-issue A: Role Taxonomy

**Affects:** Add Participant modal (FEA-10), Participants List role badges (FEA-9), Rule Snapshot Detail role breakdown (FEA-13), Create Rule Snapshot Step 2 role fields (FEA-14)

**✅ DECISION: Option B chosen by Liang (Apr 14, 2026)**

> Liang: *"OPTION B PLEASE! easier for everyone!"*
> Liang also: *"OR we can have the category all pre-listed like option A, THEN can add what they need on top — more flexible?"*

Liang's hybrid suggestion is not a separate option — it is **Option B + UI presets**, same backend. The FE shows preset role name suggestions in a searchable dropdown (e.g., "Studio", "Investor", "Label") with their default behavior pre-filled, but the admin can type any name and pick any behavior. Zero extra backend work.

**Final architecture:**
```
Participant.roleName   String                (free text: "MCN Platform", "Hotel Fund", "Lead Artist")
Participant.behavior   ParticipantBehavior   (enum: FEE_DEDUCTION | RECOUPMENT | NET_PROFIT_SHARE)
```

Settlement engine uses `behavior` (already does — see BE analysis below). `roleName` is display-only.

---

#### Option B — Full Change Analysis (BE + FE)

##### BE: What actually needs to change (less than expected)

**Key finding from codebase:** The settlement engine **already separates behavior from role**. It runs on typed rule objects — `DistributionFeeRule`, `RecoupmentRule`, `NetProfitRule` — not on `Participant.role`. The `role` field is currently only used for display/DTO purposes. This means the engine requires minimal changes.

**1. Prisma schema** — `apps/sfi-api/prisma/schema.prisma`

```diff
- enum ParticipantRole {
-   PRODUCER
-   DISTRIBUTOR
-   INVESTOR
-   TALENT
-   STUDIO
-   LICENSOR
-   LICENSEE
-   COLLECTION_AGENT
- }

+ enum ParticipantBehavior {
+   FEE_DEDUCTION      // takes % off top (was: DISTRIBUTOR, COLLECTION_AGENT)
+   RECOUPMENT         // gets investment back before profit split (was: INVESTOR)
+   NET_PROFIT_SHARE   // gets % of remaining net profit (was: everyone else)
+ }

model Participant {
-   role       ParticipantRole
+   roleName   String               // free text, e.g. "Studio", "MCN Platform", "Hotel Fund"
+   behavior   ParticipantBehavior
    ...
}
```

New Prisma migration needed. Existing rows can be migrated cleanly:

| Old role | → roleName (keep as-is) | → behavior |
|----------|------------------------|------------|
| DISTRIBUTOR | "Distributor" | FEE_DEDUCTION |
| COLLECTION_AGENT | "Collection Agent" | FEE_DEDUCTION |
| INVESTOR | "Investor" | RECOUPMENT |
| STUDIO | "Studio" | NET_PROFIT_SHARE |
| PRODUCER | "Producer" | NET_PROFIT_SHARE |
| TALENT | "Talent" | NET_PROFIT_SHARE |
| LICENSOR | "Licensor" | NET_PROFIT_SHARE |
| LICENSEE | "Licensee" | NET_PROFIT_SHARE |

**2. Settlement engine** — `apps/sfi-api/src/modules/settlement/engine/`

Minimal changes required. The engine uses `DistributionFeeRule`, `RecoupmentRule`, `NetProfitRule` typed objects — not `Participant.role`. The only places to update:
- `types.ts` — if `ParticipantRole` is referenced in engine types, replace with `ParticipantBehavior`
- `engine/__tests__/settlement-engine.spec.ts` — update test fixtures that reference old role enum values
- No phase processor files need to change (GROSS_RECEIPTS, DISTRIBUTION_FEES, RECOUPMENT, NET_PROFITS logic unchanged)

**3. Participants module** — `apps/sfi-api/src/modules/participants/`

Files to update:
- `dto/index.ts` — replace `ParticipantRoleDto` enum with `ParticipantBehaviorDto` enum + add `roleName: string` field
- `services/participants.service.ts` — update create/list logic (minimal — `role` is stored/returned as-is currently)
- `mappers/participant.mapper.ts` — update field mapping from `role` → `roleName + behavior`

**4. Rules module** — `apps/sfi-api/src/modules/rules/`

Files to update:
- `dto/index.ts` — any DTO referencing `ParticipantRole` needs updating
- `mappers/rule-snapshot.mapper.ts` — currently uses `role` for display in `ruleSummary.roleBreakdown`; update to group by `behavior` or by `roleName`

**5. No changes needed in:**
- Settlement service (uses rule objects, not participant roles)
- Revenue service
- Audit log (stores `{ name, role }` in metadata — update to `{ name, roleName, behavior }`)
- All 4 phase processors

---

##### FE: What needs to change (sfi-admin)

**1. Add Participant modal (FEA-10)**

Current: `Role` dropdown with 8 enum options

New UI:
```
Role Name *
┌─────────────────────────────────────────────┐
│  Type or select a role...              ▼    │  ← searchable, shows presets
└─────────────────────────────────────────────┘
Presets: Studio, Distributor, Investor, Producer, Talent,
         Label, Artist, Platform, Brand Partner, Hotel Fund...
(or type anything custom)

Payment Behavior *
○ Fee off the top     (takes % before profit is calculated)
○ Recoupment first    (gets investment back before profit split)
● Net profit share    (gets % of remaining net profit)
         ↑ auto-selected when preset is chosen
```

**2. Participants List role badge (FEA-9)**

Current: badge color per role enum (8 colors)

New: badge color per behavior (3 colors) + display `roleName` text:
- FEE_DEDUCTION → Purple badge (was Distributor color)
- RECOUPMENT → Green badge (was Investor color)
- NET_PROFIT_SHARE → Blue badge (was Studio color, now covers all profit participants)

**3. Rule Snapshot Detail — Role Summary card (FEA-13)**

Current: `Role Breakdown: 🔵 STUDIO (1) 🟣 DISTRIBUTOR (1) 🟢 INVESTOR (2)`

New: Group by behavior:
```
Payment Structure:
🟣 Fee Deduction (1): MCN Platform
🟢 Recoupment (2):    Series A Fund, Brand Backer
🔵 Net Profit (3):    Lead Creator, Studio, Director
```

**4. Create Rule Snapshot Step 2 (FEA-14)**

Role-specific fields are already driven by rule type, not role enum. The fields shown per participant (Fee %, Recoup Cap + Priority + Net %, or just Net %) need to switch to being driven by `behavior` instead of `role`. This is a small refactor — same fields, different condition.

**5. Constants / types**

- `constants/api.ts` — no change (endpoints unchanged)
- `types/` — replace `ParticipantRole` enum type with `ParticipantBehavior` enum + `roleName: string`
- Badge variant mapping — update from role→color to behavior→color

---

##### Effort assessment

| Layer | Effort | Risk |
|-------|--------|------|
| Prisma schema + migration | Low — clean 1:1 mapping | Low |
| Settlement engine | Minimal — barely uses role | Low |
| Participants DTO/mapper/service | Low | Low |
| Rules mapper (roleBreakdown) | Low | Low |
| FE: Add Participant form | Medium — new UI pattern | Low |
| FE: role badge system | Low — 8 colors → 3 colors | Low |
| FE: Rule Snapshot Detail display | Low | Low |
| FE: Create Rule Snapshot Step 2 | Low — condition swap | Low |
| **Total** | **~1–2 dev days BE + 1–2 dev days FE** | **Low** |

**Why this is less work than it looks:** The settlement engine already behaves like Option B internally — it never actually used `Participant.role` to compute anything. The main work is schema + DTO changes + FE component updates. No logic rewrites.

**Current Figma — Participants List shows these roles in use:**
Studio, Distributor, Investor, Investor, Distributor, Producer, Licensor, License, Collection Agent (confirmed from node 262:5042 screenshot)

---

##### 🎨 Sub-issue B: 200-Investor Allocation in Create Rule Snapshot Step 2

**Affects:** FEA-14 (Create Rule Snapshot), specifically Step 2

**Recommended approach: Share-Based Investor Group**

Instead of listing 200 investors individually in Step 2, add an "Investor Group" concept:

```
Step 2 — Participant Rules (updated)
┌──────────────────────────────────────────────────────────────────┐
│  Investor Group                                              [?] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ⓘ You have 200 INVESTOR participants. Use one of these modes:  │
│                                                                  │
│  ● Share-Weighted  (recommended for many investors)              │
│    Each investor's % = their shares ÷ total shares × pool %     │
│    Pool Net Profit %:  [  30  ]                                  │
│    Total shares:       [  10,000  ] (auto-computed from import)  │
│    [📥 Import Share Count per Investor (CSV)]                    │
│                                                                  │
│  ○ Equal Split                                                   │
│    Each investor gets: 30% ÷ 200 = 0.15%                        │
│    Pool Net Profit %:  [  30  ]                                  │
│                                                                  │
│  ○ Manual (enter each individually)                              │
│    ⚠ Not recommended for 200+ investors                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Non-investor participants remain individually listed as before:
─────────────────────────────────────────────────────────────────
☑ Global Cinema Partners (DISTRIBUTOR)
  Distribution Fee %: [  20  ]

☑ Zenith Pictures (STUDIO)
  Net Profit %: [  30  ]

☑ Sarah Chen (TALENT / ACTOR)
  Net Profit %: [  20  ]
...
```

**CSV for share import** (companion to FB-001 participant import CSV):
```
participantName,shares
Wei Zhang,500
Aisha Patel,250
```
Or match by `externalId` from FB-001 import:
```
externalId,shares
FEA-001,500
FEA-002,250
```

**Running Totals footer update:**
```
Net Profit Total: 100% ✓
  └─ Non-investors:  70% (individual)
  └─ Investor pool:  30% (share-weighted, 200 investors)
```

---

#### Ticket Changes Needed

##### 🎫 FEA-10: Add Participant — Role dropdown update

- Depends on Option A vs B decision
- Option A: Replace dropdown options with expanded taxonomy
- Option B: Change to `[Role Name text input]` + `[Behavior dropdown]`
- **Status: Blocked pending design decision**

##### 🎫 FEA-13: Rule Snapshot Detail — Role breakdown update

- Role breakdown badges in Rule Summary card need to reflect new taxonomy
- If Option B: show "behavior type" grouping instead of role name grouping
- Net Profit Split chart colors may need re-mapping

##### 🎫 FEA-14: Create Rule Snapshot — Step 2 investor group UX

**Current:** Individual checklist entry for every participant (unusable at 200+)

**Updates needed:**
- Detect when ≥ N investors exist (suggest threshold: ≥ 10) → show Investor Group UI
- Three allocation modes: Share-Weighted / Equal Split / Manual
- Share-Weighted mode → CSV import for share counts per investor
- Running totals footer → show pool % breakdown (investors vs individuals)
- Manual mode still available but discouraged for large counts

##### 🎫 New ticket: Design: Role Taxonomy Decision + Refactor

- **Task Name:** Design Decision: Role Taxonomy Expansion
- **Epic:** Participants
- **Milestone:** MS-2: Participants & Rules
- **Priority:** 1 - Must Have
- **Type:** Design
- **Blocking:** FEA-10, FEA-13, FEA-14 (all depend on role model decision)
- **Action required:** Tabrez + Gabriel decide Option A vs Option B before design proceeds

##### 🎫 New ticket: Design & Build: Investor Group Allocation (Share-Weighted)

- **Task Name:** Design & Build: Investor Group Allocation in Rule Snapshot
- **Epic:** Rules
- **Milestone:** MS-2: Participants & Rules
- **Priority:** 1 - Must Have
- **Type:** Design → Frontend → Backend
- **Screen:** Extension of 5.3 Create Rule Snapshot Step 2
- **Depends on:** FB-001 (CSV import), FB-002a (role decision)

##### 🎫 New ticket: Backend: Share-Weighted Allocation Engine

- **Task Name:** Backend: Share-Weighted Investor Allocation in Rule Snapshot
- **Epic:** Rules
- **Milestone:** MS-2: Participants & Rules
- **Priority:** 1 - Must Have
- **Type:** Backend
- The settlement engine supports individual allocations but needs share → % conversion
- Input: `{ investorPoolPercent: 30, investors: [{ participantId, shares }] }`
- Output: each investor's computed `netProfitPercent = shares / totalShares * investorPoolPercent`

---

#### Figma Frames To Update

| Frame | Node | Change |
|-------|------|--------|
| Add Participant modal | D2 (FEA-10) | Role dropdown → new taxonomy (pending decision) |
| Participants List | D1 (262:5042) | Role badge set → new taxonomy |
| Rule Snapshot Detail | FEA-13 (449:6358 area) | Role breakdown → new taxonomy |
| Create Rule Snapshot Step 2 | FEA-14 (437:10762) | Add Investor Group section with 3 allocation modes |
| New: Investor Group CSV import | Sub-step of Step 2 | CSV upload for share counts |

---

#### Summary of Impact

| Item | Status | Owner |
|------|--------|-------|
| ✅ DECISION: Option B chosen (custom roleName + behavior enum) | ✅ Apr 14 | Liang |
| Prisma: replace ParticipantRole enum → roleName + ParticipantBehavior | ✅ Apr 14 | Backend |
| Prisma: write migration (map 8 old roles → new fields) | ✅ Apr 14 | Backend |
| BE: update Participants DTO/mapper/service | ✅ Apr 14 | Backend |
| BE: update Rules mapper (roleBreakdown in ruleSummary) | ✅ Apr 14 | Backend |
| BE: update settlement engine types + test fixtures | ✅ Apr 14 | Backend |
| Update Figma: Add Participant modal (role name input + behavior radio) | ⏳ | Design |
| Update Figma: role badge colors (3 behaviors, not 8 roles) | ⏳ | Design |
| Update Figma: Rule Snapshot Detail role breakdown → behavior grouping | ⏳ | Design |
| Update FEA-10 ticket (new Add Participant form spec) | ⏳ | Dev |
| Update FEA-13 ticket (role breakdown display update) | ⏳ | Dev |
| Update FEA-14 ticket (Step 2 behavior-driven fields) | ⏳ | Dev |
| New ticket: BE Role Taxonomy — schema + migration + DTO update | ⏳ | PM/Backend |
| New ticket: Design & Build investor group allocation | ⏳ | PM/Dev |
| New ticket: BE share-weighted allocation | ⏳ | Backend |

---

#### Connection to FB-001

FB-001 (CSV import for participants) and FB-002b (investor group allocation) are **tightly coupled**:
- FB-001 CSV import template should include an optional `shares` column from day one
- That way, one CSV upload can simultaneously: (1) create participants, (2) carry share counts for Rule Snapshot allocation
- The `externalId` field in FB-001 can serve as the join key between FEA investor records and SFI participant records

**Proposed unified CSV format:**
```
name,role,email,externalId,shares
Wei Zhang,INVESTOR,wei@example.com,FEA-001,500
Aisha Patel,INVESTOR,,FEA-002,250
```
The `shares` column is optional — only used if the deal uses share-weighted allocation.

---

---

<!-- Template for new entries — copy and fill in -->

<!--
### [FB-XXX] Short Title

**Date:** YYYY-MM-DD
**Source:** Where was this raised (Notion comment, call, Slack, etc.)
**Raised by:** Name
**Discussed with:** Name
**Status:** ⏳

#### Context / Feedback

What did Liang say? What problem are they trying to solve?

#### Design Changes Needed

🎨 Which screens change and how?

#### Ticket Changes Needed

🎫 Which existing tickets update? New tickets needed?

#### Figma Frames To Update

| Frame | Node | Change |

#### Summary of Impact

| Item | Status | Owner |
-->

---

## Implementation Checklist

> Last updated: Apr 14, 2026. Update status when work completes.

### FB-001: CSV Import / Export for Participants

| Task | Type | Status | Date |
|------|------|--------|------|
| BE: `POST /deals/:dealId/participants/import` endpoint | Backend | ✅ Done | Apr 14 |
| BE: `GET /deals/:dealId/participants/export` endpoint | Backend | ✅ Done | Apr 14 |
| BE: `BulkImportResultDto` + `ImportParticipantRowResultDto` DTOs | Backend | ✅ Done | Apr 14 |
| BE: skip-errors flag + per-row validation in service | Backend | ✅ Done | Apr 14 |
| BE: audit log on BULK_IMPORTED action | Backend | ✅ Done | Apr 14 |
| Figma: D1 Import/Export buttons on Participants header | Design | ⏳ | — |
| Figma: D4 3-step Import modal (Upload → Preview → Success) | Design | ⏳ | — |
| FE: Import modal component + file drag-and-drop | Frontend | ⏳ | — |
| FE: CSV preview table with validation badges | Frontend | ⏳ | — |
| FE: Export button triggers CSV download | Frontend | ⏳ | — |
| Notion: Create ticket for BE CSV import/export | PM | ⏳ | — |
| Notion: Create ticket for FE CSV modal | PM | ⏳ | — |

### FB-002: Role Taxonomy Refactor (RWA-agnostic)

| Task | Type | Status | Date |
|------|------|--------|------|
| Prisma: `ParticipantRole` enum → `ParticipantBehavior` enum | Backend | ✅ Done | Apr 14 |
| Prisma: `Participant.role` → `roleName` + `behaviorType` fields | Backend | ✅ Done | Apr 14 |
| Migration SQL: backfill 8 old roles to new fields | Backend | ✅ Done | Apr 14 |
| DTO: `ParticipantBehaviorDto` enum + updated Create/Update/Response DTOs | Backend | ✅ Done | Apr 14 |
| Mapper: `participant.mapper.ts` maps `roleName` + `behaviorType` | Backend | ✅ Done | Apr 14 |
| Rules DTO: removed `ParticipantRoleEnum`, updated `RuleSnapshotParticipantResponseDto` | Backend | ✅ Done | Apr 14 |
| Rules mapper: `roleBreakdown` keyed by `roleName`, new `participantRoleName/BehaviorType` fields | Backend | ✅ Done | Apr 14 |
| Settlement engine types: `ParticipantBehavior` enum, `ParticipantInput` updated | Backend | ✅ Done | Apr 14 |
| Settlement service: maps `roleName`/`behaviorType` to engine input | Backend | ✅ Done | Apr 14 |
| Settlement engine spec: all `role: ParticipantRole.XXX` fixtures updated | Backend | ✅ Done | Apr 14 |
| Figma: Add Participant modal — text input for roleName + behavior select | Design | ⏳ | — |
| Figma: Participant role badges — behavior-based colors (5 behaviors) | Design | ⏳ | — |
| Figma: Rule Snapshot Detail — role breakdown by roleName | Design | ⏳ | — |
| FE: Update Add Participant form (roleName text + behaviorType select) | Frontend | ⏳ | — |
| FE: Update role badge component to show roleName text | Frontend | ⏳ | — |
| FE: Update Rule Snapshot participant list columns | Frontend | ⏳ | — |
| Notion: Update FEA-10 ticket spec | PM | ⏳ | — |
| Notion: Update FEA-13 ticket spec | PM | ⏳ | — |

### FB-002b: Investor Group Allocation (Share-weighted, 200+ investors)

> Deferred — needs design finalization before implementation.

| Task | Type | Status | Date |
|------|------|--------|------|
| Design: investor group concept in Rule Snapshot Step 2 | Design | ⏳ | — |
| BE: share-weighted allocation in settlement engine | Backend | ⏳ | — |
| FE: investor group allocation UI in Create Rule Snapshot Step 2 | Frontend | ⏳ | — |
| Notion: New ticket for investor group allocation | PM | ⏳ | — |

