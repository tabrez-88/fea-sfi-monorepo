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

### [FB-003] Flexible Rule Snapshot — Custom Names + % or $ Fees + Exit Conditions (Covers 2 Deal Types)

**Date:** Apr 16, 2026 (original) • **Revised:** Apr 16, 2026 evening (Rev 2: detailed 4-question reply) • **Revised again:** Apr 16, 2026 late evening (**Rev 3: Liang's "1 pipeline, optional layers" simplification — current authoritative scope**)
**Source:** Figma comment thread on Rule Snapshot Detail page ("Not Complete" frame, node 638:13425) + WhatsApp thread + PDF reply + WhatsApp "not 2 models, just options" clarification
**Raised by:** Liangliang Lyu
**Discussed with:** Tabrez Akhlaque (multiple rounds, direction now stable in Rev 3)
**Status:** 🔄 **REVISED AGAIN Apr 16 late PM (Rev 3)** — scope simplified back. See [REV 3 block](#fb-003-rev-3-apr-16-late-evening--authoritative) below. No Deal Type field needed. Create Deal stays as deployed. Engine additions still required (pool, waterfall, recoup multiplier, hard cap, deadline, flat fee).

---

#### Context / Liang's Concern

Over a 2-day thread (Apr 15–16), Liang raised three related questions on the Rule Snapshot Detail page that together describe her complete mental model for how SFI should express different deal structures.

**Question 1 — Investment + Waterfall deal (Republic/Thorpe example):**
> "What if a deal in RWA/FEA is like this:
> Deal Type: Investment (Recoup + Waterfall)
> Raise: $1M target, $1000 unit price, 10,000 total units
> Revenue Source: 20% of project gross revenue, up to 5 years (or until exit condition met)
> Investor Terms: Recoup 120% of invested capital, post-recoup waterfall applies
> Exit: (A) Investor reaches 140% total return (hard cap), OR (B) 5-year term reached
> How this showing and be able to adding in Snap shots?"
> Reference: https://republic.com/thorpe

> "different than project traditional revenue share, more like investor share. SO SFI will need able to cover traditional revenue share like what we have now, OR investor share with waterfall"

**Question 2 — Her 2-type mental model (WhatsApp, Apr 16):**
> "Is the rule snaps like 2 types?
> Revenue 1: Take off ABCD (either number or %), then under ABCD how many Participants, then share revenue or the amount, hit the recoup exit or the deadline or waterfall
> Revenue 2: the number $ need be shared like (20%/50% etc), how many Participants, Recoup/deadline exit, Recoup/waterfall exit, or keep going
> ABCD like fees, studio, etc need to take off."

GPT helped her formalize this as 4 layers:
- **Layer 1: Deductions** (% or fixed, ordered) — reduces gross → net
- **Layer 2: Allocation Mode** — A. Simple Split (fixed %, no recoup) OR B. Recoup/Waterfall (tier-based, condition-driven)
- **Layer 3: Participants** — list with rules depending on mode
- **Layer 4: Exit/Continuation** — recoup cap, deadline, perpetual

**Question 3 — Final confirmation question (WhatsApp, Apr 16):**
> "Got it. And saw your comment on Figma. I just have one question. Am I able to create new / edit all ABCD's name and % or $? If that's possible, then all pages will work."

Accompanied by screenshot of the Payment Structure Breakdown section with Net Profit group expanded (Lead Creator, Studio, Director, etc.) — pointing at the exact UI elements she wants to be freely configurable.

**Her conclusion:**
> "But the good part to me is: I have the trust of you. As long as you say it will covers 2 types deals, then I just wait."

---

## FB-003 Rev 3 (Apr 16, late evening) — **AUTHORITATIVE**

> **Most recent and final direction.** After Rev 2 (which added Deal Type selector + raise terms discussion), Liang sent a further WhatsApp clarification with GPT-assisted analysis, **dissolving the "2 deal types" framing** and replacing it with a single-pipeline model. Rev 3 supersedes Rev 2. The Rev 2 block is preserved below for history but its decisions are no longer current.

### What Liang said (Rev 3)

Direct quotes, consolidated:

> "How about not 2 models. Just options:
> A. Take off ABCD
> B. Don't take off ABCD, just take % of revenue, then share to investors"
>
> "No need change deal part."
>
> "Just when rule — either go take off ABCD then same share to each party or investor. Or just take % of gross revenue, then pay investor. Same."
>
> "So no need to change deal page, follow your original design. Or even can be take off ABCD, the rest net revenue take %, then share to investor. It's all options."
>
> "Not 2 models, just: same pipeline, optional deduction layer ON/OFF. Everything else (split, waterfall, recoup) stays the same."

**GPT-assisted architecture paragraph she pasted:**
- **Participant Layer** (general roles): investor, creator, studio, platform, etc.
- **Allocation Target Layer** (important): introduce **Investor Pool** as a single allocation target in waterfall tiers. Instead of listing every investor in waterfall.
- Internally: Investor Pool distributes to individual investors based on units / contribution / ownership %
- **Recoup and cap logic applies to individual investors inside the pool** — not all participants (e.g. actors, producers) should be part of recoup logic
- This keeps system scalable; otherwise waterfall becomes too complex, recoup logic unclear, UI hard to manage

### Rev 3 mental model

```
ONE pipeline. ONE engine. NO Deal Type classifier.

Per rule snapshot:
┌────────────────────────────────────────────────────────┐
│ Layer 1 — Participants (broad roles)                   │
│   investor / creator / studio / platform / actor / ... │
│   (FB-002 roleName already delivers this ✅)           │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ Layer 2 — Allocation Targets (NEW first-class concept) │
│   • Individual participants (1 row each)               │
│   • Pool participants (1 row, aggregates many)         │
│     └─ "Investor Pool" = the main pool pattern         │
│   Waterfall tiers reference TARGETS, not individuals   │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ Layer 3 — Optional Deduction Layer (ON/OFF per deal)   │
│   If any FEE_DEDUCTION participants exist → engine     │
│   runs DISTRIBUTION_FEES phase. Otherwise it skips.    │
│   (Engine already supports this — no code change.)     │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ Layer 4 — Tier / Waterfall / Recoup config             │
│   Tier 1: 100% → Investor Pool until 120% recoup       │
│   Tier 2: 20% → Investor Pool, 80% → Creator           │
│           until 140% hard cap per-investor OR 3–5 yrs  │
│   Individual hard cap + cumulative payout tracking     │
│   applies within Investor Pool only                    │
└────────────────────────────────────────────────────────┘
```

**Three equivalent "option" configurations she described:**
- **Option A** (take off ABCD): deal has Fee Deduction participants + investor pool + tiers → fees deducted → remainder split
- **Option B** (no ABCD): deal has NO Fee Deduction participants + investor pool gets % of gross directly
- **Option C** (combo): deductions first, then tier split from remainder to pool + creator

All three = same pipeline, different participant/target/tier configuration at snapshot level. No UI classifier needed.

### Decisions reversed by Rev 3 (vs Rev 2)

| Topic | Rev 2 (Apr 16 evening) | **Rev 3 (Apr 16 late evening) — AUTHORITATIVE** |
|---|---|---|
| `Deal.dealType` enum + migration | ✅ Add it | ❌ **NOT NEEDED** — no Deal Type classifier |
| Deal Type dropdown on FEA-6 | ✅ Add it | ❌ **NOT NEEDED** — Create Deal stays as deployed |
| FEA-7 Edit Deal mirror | ✅ Mirror Deal Type | ❌ **NOT NEEDED** |
| Conditional Step 2 UX by Deal Type in FEA-14 | ✅ Branching | ❌ **NOT NEEDED** — single UX driven by "does deal have Fee Deduction participants? Pool? Tiers?" |
| Scope-split "keep both models vs drop Revenue Share" (Liang's open Q) | ⏳ Open | ✅ **DISSOLVED** — there are no "2 models" anymore |

### Decisions preserved from Rev 2 (still in scope)

| Item | Status |
|---|---|
| Recoup Multiplier (120% Tier 1 cap on `RecoupmentRule`) | ✅ Still needed |
| Hard Cap Multiplier per-investor (140%) + cross-phase cumulative tracking | ✅ Still needed — scoped to investors inside pool |
| Recoup Deadline (ISO date) + run-date threaded into engine | ✅ Still needed |
| 2-tier waterfall engine phase | ✅ Still needed |
| Fixed $ fee deduction (complete FLAT_FEE wiring) | ✅ Still needed |
| Investor Pool as a first-class allocation target | ✅ **Formalized in Rev 3** as the "Allocation Target Layer" — subsumes FB-002b share-weighted work |
| CSV import with `units` column per investor | ✅ Still needed (FB-001 extension) |
| Tier 3 (long-tail royalty) | ⏳ Still deferred to v2 |

### New in Rev 3

- **Explicit "Allocation Target Layer"** as a first-class data model concept in the Rule Snapshot
  - A target is either an individual participant OR a pool
  - Waterfall tiers reference targets
  - Recoup/cap logic applies to individuals inside a pool (not at pool level)
- **Non-pool participants are simple**: they just take a % from tier allocations, no recoup logic applied
- This clarifies what was ambiguous in Rev 2 about where per-investor hard cap enforcement lives

### Schema implications (Rev 3)

- `Deal` model — **NO CHANGE** (no dealType field)
- `RuleSnapshot.rules` JSON — structure updated to hold:
  ```json
  {
    "allocationTargets": [
      { "id": "target_creator", "type": "individual", "participantId": "..." },
      { "id": "target_investor_pool", "type": "pool", "memberBehaviorFilter": "RECOUPMENT" }
    ],
    "deductions": [  /* optional — FEE_DEDUCTION participants */ ],
    "tiers": [
      { "tier": 1, "splits": [{ "targetId": "target_investor_pool", "percentage": 100 }], "recoupMultiplier": 1.2 },
      { "tier": 2, "splits": [
        { "targetId": "target_investor_pool", "percentage": 20 },
        { "targetId": "target_creator", "percentage": 80 }
      ], "hardCapMultiplier": 1.4, "deadline": "2031-04-16" }
    ]
  }
  ```
- Engine phases — new `allocateByTier()` phase replaces fixed RECOUPMENT + NET_PROFITS; pool breakdown runs after each tier allocation
- `Participant` — unchanged (FB-002 `roleName + behaviorType` still the participant-level data model)

### Open items for Tabrez after Rev 3

| Item | Action |
|---|---|
| Upwork contract scope check | Confirm Rev 3 BE work (~5–6 dev days) is in-scope |
| Reply to Liang confirming Rev 3 understanding | Draft ready (see CLIENT_DESIGN_FEEDBACK meta — not persisted) |
| ~~Keep both models vs drop Revenue Share~~ | ✅ **No longer relevant** — dissolved by Rev 3 |
| ~~Upwork vs dev driving Phase 1/2 split~~ | ⏳ Still useful to know but not blocking Rev 3 design |

---

## FB-003 REVISION (Apr 16, evening) — ⚠️ SUPERSEDED BY REV 3

> **Note:** This Rev 2 block was the earlier direction. It is preserved for history. For current authoritative scope see [Rev 3 block above](#fb-003-rev-3-apr-16-late-evening--authoritative).

### Decisions reversed by Liang's Apr 16 evening reply

| Topic | Original FB-003 decision (morning) | Revised decision (Liang's PM reply) |
|---|---|---|
| Deal Type selector on FEA-6 | ❌ Not needed — flexible snapshot covers both | ✅ **Needed — Liang said "Agree"**. Classifies deal; drives conditional Rule Snapshot UX. |
| Raise Terms section on FEA-6 | ⚠️ Ambiguous | ❌ **Not in SFI scope** — target raise, unit price, total units, duration cap live in FEA platform. SFI receives investor unit/share data via CSV (FB-001). |
| Post-recoup waterfall tiers | ⏳ Deferred — no spec | ✅ **In scope for v1 with concrete 2-tier spec** (see below) |
| Hard cap per-investor vs per-pool | Default per-investor (inferred) | ✅ **Confirmed per-investor** — each investor tracks own cumulative payouts and stops at own cap |
| FB-002b (share-weighted investor pool) | ⏳ Deferred independently | ✅ **Promoted to CORE** — Rule Snapshot allocates to "Investor Pool" (one row); internal breakdown to individual investors uses share-weighted computation at settlement |
| Phase split (Phase 1 vs Phase 2) | ⏳ Not decided | ✅ **Liang suggests: Phase 1 = Revenue Share (already built), Phase 2 = Investment (her primary use case)** |

### Liang's concrete 2-tier waterfall spec (SFI v1)

From her reply, referenced from the Upwork contract discussion:

```
Tier 1 — Recoup Phase
  Allocation: 100% → Investor Pool
  Condition:  Until investors reach 120% recoup (recoupMultiplier = 1.20)

Tier 2 — Post-Recoup Participation
  Allocation: 20% → Investor Pool, 80% → Creator
  Condition:  Until 140–150% total payout (hardCapMultiplier = 1.40–1.50)
              OR time-based (3–5 years, recoupDeadline)

Tier 3 — DEFERRED for SFI v2
  Reduced investor share (e.g., 10%) for long-tail royalty participation
```

**Key semantic:** Tier 1 is a **recoup multiplier** (120% of invested capital, not just 100% recoup). Tier 2 is a **post-recoup waterfall split** with a hard cap exit.

### Liang's Investor Pool clarification (important model point)

> "At the Rule Snapshot level: Allocation happens to **Investor Pool**.
> Internally: Pool distributes to individual investors based on: units / contribution amount / ownership %"

**Implication for data model:**
- Rule Snapshot has ONE row labeled "Investor Pool" with a pool-level % (or tier config). NOT 200 rows for 200 investors.
- Individual investor payouts are computed at settlement time using share-weighted breakdown (ex-FB-002b, now core).
- Each investor's share = their units / total pool units × pool allocation.

### Liang's "dynamic participant count" point

> "Will this be able to edit? 'Recoupment 200 Participants'. Doesn't have to be 200 Participants, some deal will be 100 / 50 / 500 / 1000 just like Republic and stock."

**Already supported:** the `200` in the Figma mock is just example data. Engine and DB accept any count. Confirm this to her explicitly in next reply.

### Liang's open questions back to Tabrez

| Liang asked | Tabrez's answer needed |
|---|---|
| "What is affecting Phase 1 and 2 now? Upwork contract or dev capacity?" | Confirm driver of phase split |
| "Can we have SFI with both models or will it be extra for dev? If extra fee, let me know, or I can just keep investment model only (it's for FEA only at this point)." | Confirm: keep both is near-zero extra work (engine is generic), so both stay. Offer reassurance. |

### Revised scope summary

- ✅ **Add `dealType` field to Deal model** (REVENUE_SHARE | INVESTMENT)
- ✅ **Add Deal Type selector to Create Deal (FEA-6)** — dropdown only, no raise terms section
- ❌ **Do NOT add Raise Terms** (target raise / unit price / total units / duration cap) — stays in FEA
- ✅ **Add `recoupMultiplier` to recoupment model** — e.g., 1.20 for 120% Tier 1 cap
- ✅ **Add 2-tier waterfall engine phase** — Tier 1 (recoup to multiplier) + Tier 2 (post-recoup split until hard cap)
- ✅ **Add `hardCapMultiplier` per-investor** + per-investor cumulative payout tracking
- ✅ **Add `recoupDeadline`** (ISO date) + run-date threaded into engine
- ✅ **Add fixed $ fee deduction** (complete FLAT_FEE wiring)
- ✅ **Promote FB-002b** — share-weighted Investor Pool breakdown is now core to Investment flow
- ⏳ **Defer Tier 3** — long-tail royalty, out of v1 scope

---

#### Key Insight — Scope Simplification  ⚠️ SUPERSEDED Apr 16 PM

> **Note:** This section reflects the Apr 16 morning pivot which was reversed by Liang's detailed evening reply. See [REVISION block](#fb-003-revision-apr-16-evening) above for the current scope. Kept here for decision history only.

**Initial FB-003 draft (Apr 15) proposed:** Add a new "Deal Type" dropdown to Create Deal form (FEA-6) with `Revenue Share` vs `Investment + Waterfall`, plus a conditional "Raise Terms" section (target raise, unit price, total units, duration cap).

**After Liang's Apr 16 morning clarification, we pivoted:** No Deal Type selector needed. The Rule Snapshot itself is flexible enough to express BOTH deal structures through:
1. **Custom group names** (✅ already handled by FB-002 `roleName` free text)
2. **% OR fixed $ for deductions** (gap — partially stubbed)
3. **Exit conditions per recoupment participant** (gap — recoup cap only, no hard cap / deadline)

**Why this approach seemed better at the time:**
- Simpler UX — no upfront classification, no conditional form sections
- More flexible — admin can mix patterns in a single deal
- Aligns with existing 4-phase engine architecture (Liang's 4 layers ≈ our 4 phases)
- Avoids FEA-6 (Create Deal) changes entirely
- Matched Liang's mental model (she arrived at it independently that morning)

**Why it was reversed:** Liang's evening reply explicitly confirmed she wants the Deal Type selector ("Agree"), a concrete 2-tier waterfall, pool-level allocation with internal share breakdown, and per-investor cap tracking. The "flexibility-only" approach lacks the structural scaffolding she needs for Investment deals.

---

#### Gap Analysis — Mapped to Liang's 4 Layers  (⚠️ Rev 3 adjustments applied)

##### Layer 0 — Deal-level classification — ❌ NO LONGER NEEDED (Rev 3)

Rev 2 proposed `Deal.dealType` enum. **Rev 3 dissolved this need** — a single pipeline handles all configurations via Rule Snapshot composition. Deal model stays untouched.

| Capability | Status | Note |
|---|---|---|
| `Deal.dealType` enum field | ❌ Not needed | Rev 3 removed the requirement |
| Create Deal UI — Deal Type dropdown | ❌ Not needed | Deployed form stays as-is |
| DTO: `CreateDealInput.dealType` | ❌ Not needed | No type changes |

**Effort saved by Rev 3:** ~0.5 BE day + 0.5 FE day + migration risk + form redeploy avoided.

##### Layer 1: Deductions (% or $)

| Capability | Status | Code Location |
|---|---|---|
| Custom group naming (free text) | ✅ Done via FB-002 | `Participant.roleName` |
| Percentage-based fee deduction | ✅ Done | [types.ts:46-49](apps/sfi-api/src/modules/settlement/engine/types.ts#L46-L49), [distribution-fees.ts:29](apps/sfi-api/src/modules/settlement/engine/phases/distribution-fees.ts#L29) |
| `FLAT_FEE` enum value | ✅ Stubbed (unused) | [types.ts:24](apps/sfi-api/src/modules/settlement/engine/types.ts#L24) |
| DTO hint for fixed method | ✅ Stubbed (metadata only) | [dto/index.ts:79](apps/sfi-api/src/modules/rules/dto/index.ts#L79) — `method: 'percentage' \| 'fixed' \| 'tiered' \| 'waterfall'` |
| **Fixed $ amount fee deduction — wired** | ❌ **GAP** | No `feeAmount` field on `DistributionFeeRule`; `processDistributionFees()` hardcoded to `mulPercent` |
| **FE toggle (% vs $) in Create Rule Snapshot** | ❌ **GAP** | — |

**To close gap:**
- [types.ts](apps/sfi-api/src/modules/settlement/engine/types.ts): Add `feeAmount?: number` to `DistributionFeeRule`
- [distribution-fees.ts](apps/sfi-api/src/modules/settlement/engine/phases/distribution-fees.ts): Branch on `feeAmount` presence → deduct flat amount; else use `feePercentage`
- DTO + mapper updates
- Engine spec tests for flat fee case
- **Effort: ~0.5 BE day**

##### Layer 2: Allocation Mode (Simple Split vs Recoup/Waterfall)  ⚠️ EXPANDED Apr 16 PM

| Capability | Status | Code Location |
|---|---|---|
| Simple Split (flat %) | ✅ Done | `NET_PROFIT_SHARE` behavior + [net-profits.ts](apps/sfi-api/src/modules/settlement/engine/phases/net-profits.ts) |
| Recoup + priority-ordered waterfall (basic) | ✅ Done | `RECOUPMENT` behavior + [recoupment.ts:40](apps/sfi-api/src/modules/settlement/engine/phases/recoupment.ts#L40) |
| Carry-forward across runs | ✅ Done | `RecoupmentRule.previouslyRecouped` |
| **Recoup Multiplier (Tier 1)** — e.g., pay 120% of invested capital before Tier 2 starts | ❌ **GAP (NEW)** | No `recoupMultiplier` field on `RecoupmentRule`; engine recoups to `recoupCap` only |
| **2-tier post-recoup waterfall** — Tier 2 splits remaining revenue (e.g., 20% pool / 80% creator) until hard cap | ❌ **GAP (NEW, was deferred)** | No waterfall tier structure in engine |
| **Explicit "Allocation Mode" selector in UI** | ❌ Driven by `dealType` (Layer 0) | Conditional form branches in FEA-14 |

**To close gap:**
- Add `recoupMultiplier?: number` to `RecoupmentRule` (default 1.0 = recoup 100%; 1.2 = recoup 120%)
- Modify `processRecoupment()`: instead of stopping at `recoupAmount`, stop at `recoupAmount × recoupMultiplier`
- Add new `WaterfallTierRule` concept for Tier 2, e.g.:
  ```ts
  interface WaterfallTierRule {
    tier: number;              // 2 (Tier 1 is built-in recoup)
    splits: { participantId: string; percentage: number }[];  // e.g., pool 20%, creator 80%
    hardCapMultiplier?: number; // stop when investor reaches 140% of invested
    deadline?: string;          // stop at this date
  }
  ```
- Add new phase processor `processWaterfallTier2()` OR extend recoupment phase
- Engine spec tests for Tier 1 (120% recoup) and Tier 2 (post-recoup split with hard cap exit)
- **Effort: ~2 BE days**

**Liang's concrete v1 spec:**
- Tier 1: 100% → Investor Pool until 120% recoup reached
- Tier 2: 20% → Investor Pool, 80% → Creator, until 140–150% hard cap OR 3–5 year deadline
- Tier 3 (reduced investor share): deferred to v2

##### Layer 3: Participants / Investor Pool  ⚠️ EXPANDED Apr 16 PM

| Capability | Status | Code Location |
|---|---|---|
| Flexible participants with custom names + behavior | ✅ Done via FB-002 | `Participant.roleName + behaviorType` |
| CSV bulk import (200+ investors) | ✅ BE done via FB-001 | [participants module](apps/sfi-api/src/modules/participants/) |
| **"Investor Pool" as a single row in Rule Snapshot** | ❌ **GAP (NEW)** | Currently each investor is its own row; Liang wants pool-level abstraction at snapshot layer |
| **Share-weighted internal breakdown at settlement time** (ex-FB-002b) | ❌ **GAP (PROMOTED from deferred to CORE)** | No share → % computation in engine |
| **Per-investor unit / ownership tracking** | ⚠️ Partial | `Participant.metadata` JSON can hold unit info; no typed field or engine-level computation |

**Liang's model** (exact words):
> "At the Rule Snapshot level: Allocation happens to Investor Pool.
> Internally: Pool distributes to individual investors based on units / contribution amount / ownership %."

**To close gap:**
- Rule Snapshot participant row for `INVESTOR_POOL` behavior — one row per pool, carries pool-level %
- At settlement time: pool allocation × (individual_units / total_pool_units) = individual payout
- Units/shares imported via FB-001 CSV (unified `name, roleName, behaviorType, email, externalId, units` format)
- **See FB-002b implementation checklist (promoted from deferred to core)**
- **Effort: already scoped in FB-002b (~2 BE days + FE) — no new effort beyond promoting it**

##### Layer 4: Exit / Continuation Rules  ⚠️ EXPANDED Apr 16 PM

| Capability | Status | Code Location |
|---|---|---|
| Recoup Cap (per-investor ceiling, absolute $) | ✅ Done | `RecoupmentRule.recoupCap` |
| Priority ordering (basic waterfall) | ✅ Done | `RecoupmentRule.priority` |
| **Hard Cap Multiplier** (per-investor, e.g., stop at 140% of each investor's `recoupAmount`) | ❌ **GAP** | No `hardCapMultiplier` field |
| **Time-based Deadline** | ❌ **GAP** | No `recoupDeadline` field; no run-date signal into phase |
| **Per-investor cumulative payout tracking across ALL phases (Tier 1 + Tier 2)** | ❌ **GAP (NEW)** | `previouslyRecouped` tracks only recoupment phase; hard cap requires tracking Tier 2 payouts too for correct stop condition |
| **Perpetual flag** (explicit "keep going forever" marker) | ⚠️ Implicit | Absence of cap = perpetual; no explicit signal |

**Liang's exact spec:**
> "Hard Cap (140%) per-investor. Each investor must: Have their own investment amount / Track their own cumulative payouts / Stop receiving payouts once they hit the cap."

**To close gap:**
- [types.ts](apps/sfi-api/src/modules/settlement/engine/types.ts): Add to `RecoupmentRule`:
  - `hardCapMultiplier?: number` (e.g., `1.4` → stop at 140% × `recoupAmount`)
  - `recoupDeadline?: string` (ISO date)
- [types.ts](apps/sfi-api/src/modules/settlement/engine/types.ts): Extend `RecoupmentBalance` (or similar) to track **total cumulative payout across all phases** per investor, not just recoupment phase:
  - `totalPayoutsAllPhases: number` (used for hard cap check)
- [recoupment.ts](apps/sfi-api/src/modules/settlement/engine/phases/recoupment.ts) + new `waterfall-tier2.ts`: Before allocating, check:
  - If `hardCapMultiplier` set AND `totalPayoutsAllPhases >= recoupAmount × hardCapMultiplier` → skip
  - If `recoupDeadline` set AND `runDate > recoupDeadline` → skip
- Pass settlement run date into engine input
- Persist per-investor cumulative balances across settlement runs (DB + carry-forward)
- DTO + mapper updates
- Engine spec tests for Tier 2 hard cap exit, deadline exit, and cross-phase cumulative tracking
- **Effort: ~1.5 BE days** (was 1 day; extra 0.5 for cross-phase tracking)

**Note on `FLAT_FEE` and `PASS_THROUGH`:** Both are stubbed in `ParticipantBehavior` enum but unused. `FLAT_FEE` gets wired as part of Layer 1 fix. `PASS_THROUGH` stays stubbed (no known use case yet). A new `INVESTOR_POOL` behavior may be added in Layer 3 for the pool row concept.

---

#### Decision Log — What Liang's replies resolved (Apr 16 morning → evening → late evening)

| Question | Morning (Rev 1 pivot) | Evening (Rev 2) | **Late evening (Rev 3 — AUTHORITATIVE)** |
|---|---|---|---|
| Phase 1 or Phase 2? | "I trust you, I'll wait" | "Phase 1 = Revenue Share, Phase 2 = Investment (flagship)" | Framing dissolved — single pipeline, no "phase split" by model |
| % of deals Investment vs Revenue Share? | N/A | "Investment = primary" | Framing dissolved |
| Waterfall tiers count / split? | N/A | Concrete 2-tier (Tier 1 = 100% pool until 120%; Tier 2 = 20/80 until 140–150% or 3–5 yrs) | ✅ **Same spec still applies** — now as tier config on allocation targets |
| Hard cap per-investor or per-pool? | N/A | Per-investor | ✅ **Per-investor, inside pool only** (non-pool participants have no cap logic) |
| % OR $ for fees? | "both" (implied) | Confirmed | ✅ **Still needed** (FLAT_FEE wiring) |
| Deal Type dropdown on Create Deal? | ❌ Not needed | ✅ "Agree — add it" | ❌ **REVERSED AGAIN — not needed** ("no need change deal page, follow your original design") |
| Raise Terms on Create Deal? | Ambiguous | ❌ Not in SFI | ❌ Still not in SFI |
| FB-002b share-weighted allocation? | Deferred | ✅ Promoted to core | ✅ **Formalized as "Allocation Target Layer — Pool"** |
| "Keep both models or drop Revenue Share"? | — | Open Q to Tabrez | ✅ **Dissolved by Rev 3** — no "2 models" exist anymore |
| "Upwork or dev driving phase split"? | — | Open Q to Tabrez | ⏳ Still useful to know but no longer blocking design |

---

#### Design Changes Needed

##### 🎨 Screen 5.2: Rule Snapshot Detail (FEA-13) — already `Design Rejected` from FB-002

**Current Figma state** ([node 638:13425 "Not Complete"](https://www.figma.com/design/Tk5nFtkvsbrDWo7dhIEHm0/FEA-Admin?node-id=638-14061)):
- Rule Summary cards: Total Participants / Total Dist. Fee (%) / Recoupment Cap
- Payment Structure Breakdown (FB-002 behavior groups): Fee Deduction / Recoupment / Net Profit
- Net Profit Split bar chart
- Participant Terms table: Name / Role / Fee % / Recoup Cap / Priority / Net %

**Updates needed for FB-003:**

1. **"Total Dist. Fee" summary card** — show either "12%" or "$50,000" depending on fee type; add `%`/`$` suffix dynamically
2. **Participant Terms table header** — rename "Fee %" → "Fee (% / $)". Cell shows `12%` or `$50,000`.
3. **Add columns to Participant Terms table** (only for rows with RECOUPMENT behavior — empty/`—` for others):
   - `Hard Cap` — e.g., `140%` or `$1,400,000` or `—`
   - `Deadline` — e.g., `2031-04-16` or `Perpetual`
4. **Rule Summary card** — add two optional summary rows when any participant has them set:
   - "Hard Cap Range: 120% – 150%" (min-max across participants)
   - "Earliest Deadline: 2031-04-16"
5. **Keep FB-002 behavior grouping UI unchanged** — no conflict

##### 🎨 Screen 5.3: Create Rule Snapshot — Step 2 (FEA-14) — already `Design Rejected` from FB-002

**Current Figma state** (node 437:10762):
- Participant checklist with role-specific fields per role type
- Running totals footer

**Updates needed for FB-003:**

1. **Fee input — toggle between % and $:**
   ```
   ☑ Global Cinema Partners (Fee Deduction)
   ┌────────────────────────────────────────────────┐
   │  Fee Type:  ( ● % )  ( ○ $ )                   │
   │  [   12   ] %           OR          $ [ 50,000 ]│
   └────────────────────────────────────────────────┘
   ```

2. **Recoupment participant fields — add two new sections:**
   ```
   ☑ Horizon Ventures Fund (Recoupment)
   ┌────────────────────────────────────────────────┐
   │  Recoupment Cap:  $ [ 45,000,000 ]              │
   │  Priority:        [  1  ]                       │
   │  Net Profit %:    [  15  ]                      │
   │                                                 │
   │  ─── Exit Conditions (optional) ───             │
   │  Hard Cap:                                      │
   │    ○ None   ● Multiplier   ○ Fixed amount       │
   │    [  1.4  ] × invested   (= stop at 140%)      │
   │                                                 │
   │  Deadline:                                      │
   │    [ Date picker ]   or   ☑ Perpetual           │
   └────────────────────────────────────────────────┘
   ```

3. **Running totals footer** — unchanged (hard cap / deadline are per-participant, not aggregable)

4. **Step 2 UX — single unified flow (Rev 3 replaces the Deal Type branching)**

   No branching based on Deal Type. Instead, Step 2 shows four optional config sections, each conditionally visible based on snapshot composition:

   ```
   ┌─ (Optional) Deductions — ABCD fees off the top ─────────┐
   │  ℹ Shows only if any Fee Deduction participant exists.  │
   │  ☑ Global Cinema Partners (Fee Deduction)                │
   │    Fee Type: ( ● % )  ( ○ $ )                            │
   │    [ 12 ]%  OR  $ [ 50,000 ]                             │
   └──────────────────────────────────────────────────────────┘

   ┌─ Allocation Targets ────────────────────────────────────┐
   │  Add individual participants AND/OR pools as targets.    │
   │  ● Individual: Creator / Studio / Actor                  │
   │  ● Pool:       Investor Pool (aggregates recoup-enabled  │
   │                participants with share-weighted breakdown)│
   └──────────────────────────────────────────────────────────┘

   ┌─ Tier 1: Recoup Phase (optional) ───────────────────────┐
   │  Allocation: 100% → Investor Pool                        │
   │  Recoup Multiplier: [ 1.20 ] × invested (= 120%)          │
   │  ℹ Only shows if a pool with recoup exists.              │
   └──────────────────────────────────────────────────────────┘

   ┌─ Tier 2: Post-Recoup Split ─────────────────────────────┐
   │  Investor Pool: [ 20 ] %                                 │
   │  Creator:       [ 80 ] %                                 │
   │  (must total 100%)                                       │
   │                                                           │
   │  Exit Conditions:                                         │
   │  Hard Cap:   [ 1.40 ] × invested (per-investor inside pool)│
   │  Deadline:   [ 2031-04-16 ]  or  ☑ No deadline            │
   └──────────────────────────────────────────────────────────┘

   ┌─ Investor Pool Detail ──────────────────────────────────┐
   │  Pool participants (auto-counted): 200                   │
   │  Total units (auto-summed from CSV): 10,000              │
   │  [View participant list] [Re-import CSV]                 │
   └──────────────────────────────────────────────────────────┘
   ```

   **Configuration maps to Liang's 3 options:**
   - **Option A** (take off ABCD): Deductions section filled + tiers defined
   - **Option B** (no ABCD): Deductions section empty, tiers allocate directly from gross
   - **Option C** (both): Deductions filled + tiers on net remainder

   Same UI, same engine — admin just fills or skips sections as the deal needs.

##### 🎨 Screen 1.6: Create Deal (FEA-6) — **NO CHANGE** (Rev 3 final)

Rev 2 proposed a Deal Type dropdown after Liang's "Agree" reply. **Rev 3 (her late-evening WhatsApp)** walked this back explicitly:

> "So no need to change deal page, follow your original design."
> "Not 2 models, just: same pipeline, optional deduction layer ON/OFF."

**Deployed Create Deal form stays as-is** — Name / Description / Status / Effective Date / Termination Date. No Deal Type field. No Raise Terms. No schema migration.

##### 🎨 Screen 1.7: Edit Deal (FEA-7) — **NO CHANGE** (Rev 3 final)

Mirror of Create Deal. No Deal Type field to mirror. Stays as-is.

---

#### Ticket Changes Needed

> **Per Tabrez's instruction: no new Notion tickets created yet. Recorded here for later ticket creation/update pass.**

##### 🎫 FEA-6: Create Deal — **NO CHANGE** (Rev 3 final)

No schema changes, no UI changes. Deployed form stays as-is. Keep `Status: Ready for dev` (shipped).

##### 🎫 FEA-7: Edit Deal — **NO CHANGE** (Rev 3 final)

Mirror of Create Deal. No changes.

##### 🎫 FEA-13: Rule Snapshot Detail — UPDATE spec (already `Design Rejected` from FB-002)

Append to ticket description:
- Fee column header and cells support `%` or `$` (new — FB-003)
- Participant Terms table gains `Hard Cap` + `Deadline` columns (new — FB-003)
- Rule Summary card gains optional `Hard Cap Range` + `Earliest Deadline` rows (new — FB-003)
- Keep all FB-002 behavior grouping updates unchanged

##### 🎫 FEA-14: Create Rule Snapshot — UPDATE spec (already `Design Rejected` from FB-002)

Append to ticket description:
- Step 2: Fee input gains `%` / `$` toggle per FEE_DEDUCTION participant (new — FB-003)
- Step 2: Recoupment participants gain `Hard Cap` + `Deadline / Perpetual` exit condition fields (new — FB-003)
- Optional: Step 1 gains `Allocation Mode` toggle (Simple vs Recoup+NP) — can defer
- Keep all FB-002 investor group allocation updates unchanged

##### 🎫 New BE tickets to create later  (⚠️ Adjusted Rev 3 — no Deal Type ticket)

1. ~~**Backend: Add `Deal.dealType` enum + migration**~~ — ❌ **DROPPED in Rev 3** (no Deal Type field needed)

2. **Backend: Complete FLAT_FEE wiring (fixed $ fee deduction)**
   - Files: [types.ts](apps/sfi-api/src/modules/settlement/engine/types.ts), [distribution-fees.ts](apps/sfi-api/src/modules/settlement/engine/phases/distribution-fees.ts), rules DTO, rules mapper, settlement engine spec
   - Add `feeAmount?: number` to `DistributionFeeRule`, branch processor
   - Epic: Rules • Milestone: MS-2 • Priority: 1 — Must Have • Type: Backend
   - Effort: ~0.5 dev day

3. **Backend: Recoup Multiplier (Tier 1 cap @ 120%)** (NEW)
   - Files: [types.ts](apps/sfi-api/src/modules/settlement/engine/types.ts), [recoupment.ts](apps/sfi-api/src/modules/settlement/engine/phases/recoupment.ts), rules DTO, mapper, engine spec
   - Add `recoupMultiplier?: number` (default 1.0) to `RecoupmentRule`; modify phase to stop at `recoupAmount × recoupMultiplier` instead of `recoupCap` alone
   - Epic: Rules • Milestone: MS-2 • Priority: 1 — Must Have (Investment flow) • Type: Backend
   - Effort: ~0.5 dev day

4. **Backend: Recoupment Hard Cap + Deadline + cross-phase cumulative tracking**
   - Files: [types.ts](apps/sfi-api/src/modules/settlement/engine/types.ts), [recoupment.ts](apps/sfi-api/src/modules/settlement/engine/phases/recoupment.ts), new waterfall-tier2.ts, settlement input, rules DTO, mapper, engine spec
   - Add `hardCapMultiplier?` + `recoupDeadline?` to relevant rules; thread run-date; enforce stop
   - **Extend `RecoupmentBalance` (or new balance type) to track total cumulative payouts across BOTH recoupment phase and Tier 2 waterfall payouts** — required for correct per-investor hard cap enforcement
   - Epic: Rules • Milestone: MS-2 • Priority: 1 — Must Have (Investment flow) • Type: Backend
   - Effort: ~1.5 dev days

5. **Backend: Tier 2 Post-Recoup Waterfall Phase** (NEW, PROMOTED from deferred)
   - New phase processor (`waterfall-tier2.ts`) OR extension to `processNetProfits`
   - Input: `WaterfallTierRule` with splits (e.g., pool 20% / creator 80%)
   - Stop conditions: hard cap OR deadline reached
   - Settlement output includes Tier 1 + Tier 2 allocations separately
   - Engine spec tests for 2-tier flow end-to-end
   - Epic: Rules • Milestone: MS-2 • Priority: 1 — Must Have (Investment flow) • Type: Backend
   - Effort: ~2 dev days

6. **Backend: Share-weighted Investor Pool allocation** (PROMOTED from FB-002b deferred)
   - See FB-002b spec — now core, not deferred
   - Pool row in Rule Snapshot → per-investor breakdown at settlement
   - Epic: Rules • Milestone: MS-2 • Priority: 1 — Must Have (Investment flow) • Type: Backend
   - Effort: ~2 dev days (as previously scoped)

7. **Backend: Allocation Target Layer in Rule Snapshot schema** (NEW Rev 3)
   - Introduce first-class "allocation target" concept in `RuleSnapshot.rules` JSON (individual OR pool)
   - Waterfall tiers reference targets, not participant IDs directly
   - Supports Liang's Options A / B / C via composition (optional deductions, optional pool, optional tiers)
   - Covers both "same split to each party" and "all to investor pool" configurations in one model
   - Epic: Rules • Milestone: MS-2 • Priority: 1 — Must Have • Type: Backend
   - Effort: ~1 dev day (schema + DTO + validator; engine wiring rolls into ticket 5/6)

8. **Backend: Tier 3 (long-tail royalty) — DEFERRED to SFI v2**
   - Per Liang's explicit statement: "no need for SFI v1"

---

#### Figma Frames To Update  (⚠️ Rev 3 final)

| Frame | Node | Change | Blocks |
|---|---|---|---|
| Create Deal | 384:1709 | **NO CHANGE** (Rev 3 final) — deployed form stays as-is | — |
| Edit Deal | (mirror) | **NO CHANGE** (Rev 3 final) | — |
| Rule Snapshot Detail | 638:13425 (current "Not Complete" WIP) | Fee cell % or $, Recoup Multiplier, Tier 1/2 waterfall visualization, Investor Pool row with member count + total units, Hard Cap + Deadline summary rows, per-investor cap tracking (inside pool) | FB-002 Design |
| Create Rule Snapshot Step 2 | 437:10762 (FEA-14) | Single unified UX (no Deal Type branching): Deductions section (optional, auto-shows if Fee Deduction participants exist), Allocation Targets (individuals + pools), Tier 1 / Tier 2 waterfall config, Investor Pool detail card | FB-002 Design |

---

#### Summary of Impact  (⚠️ Rev 3 — AUTHORITATIVE)

| Item | Status | Owner |
|---|---|---|
| ✅ DECISION (Rev 3 — Apr 16 late PM): NO Deal Type selector / field — single pipeline with optional layers | ✅ | Liang |
| ✅ DECISION (Rev 3): Create Deal + Edit Deal — NO CHANGE (deployed forms stay as-is) | ✅ | Liang |
| ✅ DECISION (Rev 3): "Allocation Target Layer" is first-class — pools (e.g. Investor Pool) sit alongside individual participants as waterfall targets | ✅ | Liang |
| ✅ DECISION (Rev 3): Recoup + hard cap logic applies ONLY to individuals inside Investor Pool (not to non-pool participants) | ✅ | Liang |
| ✅ DECISION (Rev 3): Optional deduction layer ON/OFF — driven by whether Fee Deduction participants exist | ✅ | Liang |
| ✅ DECISION (Rev 2 kept): Hard cap per-investor (140%), 2-tier waterfall v1, Tier 3 deferred to v2 | ✅ | Liang |
| ✅ DECISION (Rev 2 kept): Raise Terms NOT in SFI — lives in FEA | ✅ | Liang |
| ✅ DECISION (Rev 2 kept): FB-002b (share-weighted allocation) PROMOTED — now formalized as the Pool Target in Rev 3 | ✅ | Liang |
| ✅ DECISION (Apr 14): Custom group naming shipped via FB-002 `roleName` | ✅ | Backend |
| ⏳ **OPEN (Rev 3 still useful):** Confirm Upwork contract scope covers Rev 3 BE work (~5–6 dev days) | ⏳ | Tabrez |
| ❌ ~~**OPEN:** Keep both models vs Investment-only~~ | ✅ Dissolved by Rev 3 | — |
| BE: `DistributionFeeRule.feeAmount` + branch processor (complete FLAT_FEE) | ⏳ | Backend |
| BE: `RecoupmentRule.recoupMultiplier` + enforcement (Tier 1 cap at 120%) | ⏳ | Backend |
| BE: Tier 2 waterfall phase (`WaterfallTierRule`, `processWaterfallTier2`) | ⏳ | Backend |
| BE: Per-investor `hardCapMultiplier` + cross-phase cumulative tracking (inside pool) | ⏳ | Backend |
| BE: `recoupDeadline` + run-date threaded into engine | ⏳ | Backend |
| BE: Allocation Target Layer — first-class pool concept in `RuleSnapshot.rules` JSON + DTO | ⏳ | Backend |
| BE: Share-weighted pool → individual breakdown at settlement time (FB-002b) | ⏳ | Backend |
| BE: Engine spec tests (2-tier flow, per-investor hard cap, deadline, pool breakdown) | ⏳ | Backend |
| ~~BE: `Deal.dealType` enum + migration~~ | ❌ Dropped by Rev 3 | — |
| BE: Tier 3 (long-tail royalty) | ⏳ Deferred (SFI v2) | Backend |
| Figma: Create Deal — **NO CHANGE** (Rev 3 final) | ✅ | — |
| Figma: Edit Deal — **NO CHANGE** (Rev 3 final) | ✅ | — |
| Figma: Rule Snapshot Detail — fee % or $, Recoup Multiplier, Hard Cap, Deadline, Tier 1/2 breakdown, Investor Pool row | ⏳ | Design |
| Figma: Create Rule Snapshot Step 2 — single unified UX (optional deductions + targets + tiers + pool detail) | ⏳ | Design |
| Update FEA-6 ticket — NO CHANGE note (Rev 3) | ⏳ | PM/Dev |
| Update FEA-7 ticket — NO CHANGE note (Rev 3) | ⏳ | PM/Dev |
| Update FEA-13 ticket description with FB-003 Rev 3 additions | ⏳ | PM/Dev |
| Update FEA-14 ticket description with FB-003 Rev 3 additions (single unified UX) | ⏳ | PM/Dev |
| New Notion ticket: BE Allocation Target Layer + Pool concept | ⏳ | PM |
| New Notion ticket: BE Complete FLAT_FEE wiring | ⏳ | PM |
| New Notion ticket: BE Recoup Multiplier + Tier 2 Waterfall + Hard Cap + Deadline + cross-phase tracking | ⏳ | PM |
| New Notion ticket: BE Share-weighted pool allocation (FB-002b, now formalized as pool target) | ⏳ | PM |
| Reply to Liang confirming Rev 3 understanding | ⏳ | Tabrez |

---

#### Connection to FB-001 and FB-002  (⚠️ UPDATED Apr 16 PM)

- **FB-001** (CSV import, BE ✅ Apr 14) → unchanged; still the correct onboarding path for 200+ investors. **CSV template extended:** add `units` column for Investor Pool share-weighted distribution (replaces earlier `shares` naming).
- **FB-002a** (custom roleName + behavior, ✅ Apr 14) → **directly enables** Liang's "name groups freely" requirement. A new `INVESTOR_POOL` behavior value may be added to represent the pool row concept.
- **FB-002b** (share-weighted investor allocation) → ⚠️ **PROMOTED from deferred to CORE** (Apr 16 PM). Now a required building block for Investment deals: Rule Snapshot allocates to pool at snapshot layer; at settlement time the engine breaks the pool allocation down to individual investors using their unit counts. Implementation checklist already exists — just promote priority and schedule for Phase 2.

**FB-003 is now largely additive** (no rework of prior feedback) but **expands scope** by promoting FB-002b and reversing the "no Deal Type field" decision.

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

> Last updated: Apr 16, 2026. Update status when work completes.

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

> ⚠️ **PROMOTED from deferred to CORE Apr 16 PM** — required for Investor Pool breakdown in Investment deals (see FB-003 Rev 2). Schedule alongside FB-003 Phase 2 work.

| Task | Type | Status | Date |
|------|------|--------|------|
| Design: investor pool concept in Rule Snapshot Step 2 (Investment mode) | Design | ⏳ | — |
| BE: share-weighted allocation in settlement engine (units → %) | Backend | ⏳ | — |
| BE: new `INVESTOR_POOL` behavior value (optional, or reuse `RECOUPMENT` with pool flag) | Backend | ⏳ | — |
| BE: CSV template extended with `units` column (extends FB-001 import) | Backend | ⏳ | — |
| FE: investor pool summary card in Create Rule Snapshot Step 2 (Investment mode) | Frontend | ⏳ | — |
| Notion: New ticket for share-weighted pool allocation | PM | ⏳ | — |

### FB-003 (Rev 3): Single Pipeline + Allocation Target Layer + 2-Tier Waterfall

> ⚠️ **Rev 3 — AUTHORITATIVE** (Apr 16 late PM). Liang simplified back from "2 models" to "1 pipeline with optional layers."

**Scope decisions locked (Rev 3):**
- ❌ **NO Deal Type selector** — Create Deal stays as deployed (dropped from Rev 2)
- ❌ **NO `Deal.dealType` field** — no schema migration (dropped from Rev 2)
- ✅ **Single pipeline** with optional deduction layer (ON if Fee Deduction participants exist)
- ✅ **"Allocation Target Layer"** — pools (e.g. Investor Pool) are first-class waterfall targets alongside individual participants
- ✅ **Recoup + hard cap** applies only to individuals inside the pool — not to non-pool participants
- ✅ Custom group naming already shipped (FB-002 `roleName`)
- ✅ 2-tier waterfall in v1 (100% → pool until 120% recoup; 20/80 until 140–150% or 3–5 yrs)
- ✅ FB-002b = the "Pool Target" — formalized and still core
- ⏳ Tier 3 deferred to SFI v2

**Open items after Rev 3:**
- ⏳ Tabrez confirms Upwork contract covers Rev 3 scope (~5–6 BE days total)
- ~~Keep both models vs drop Revenue Share~~ ✅ dissolved by Rev 3

**Layer 0 — Deal Type on Deal model — ❌ DROPPED in Rev 3:**

| Task | Type | Status | Date |
|------|------|--------|------|
| ~~BE: Prisma `enum DealType`~~ | — | ❌ Dropped (Rev 3) | — |
| ~~BE: `Deal.dealType` field + migration~~ | — | ❌ Dropped (Rev 3) | — |
| ~~FE: Deal Type `<Select>` in DealForm~~ | — | ❌ Dropped (Rev 3) | — |
| ~~Deal Type badge in list/detail views~~ | — | ❌ Dropped (Rev 3) | — |

**Layer 2 — Allocation Target Layer (NEW Rev 3):**

| Task | Type | Status | Date |
|------|------|--------|------|
| BE: Design `AllocationTarget` structure in `RuleSnapshot.rules` JSON (individual OR pool) | Backend | ⏳ | — |
| BE: Tier config references `targetId` instead of `participantId` for waterfall splits | Backend | ⏳ | — |
| BE: DTO + validator for allocation targets array | Backend | ⏳ | — |
| BE: Rules mapper — expose targets in response DTOs | Backend | ⏳ | — |
| FE: Create Rule Snapshot Step 2 — "Add allocation target" UI (individual vs pool) | Frontend | ⏳ | — |
| FE: Rule Snapshot Detail — visualize targets in waterfall tier breakdown | Frontend | ⏳ | — |

**Layer 1 — Fixed $ fee deduction (complete FLAT_FEE wiring):**

| Task | Type | Status | Date |
|------|------|--------|------|
| BE: `FLAT_FEE` enum in `ParticipantBehavior` | Backend | ✅ Stubbed (already exists) | — |
| BE: DTO hint `method: 'fixed'` in `AllocationRuleDto` | Backend | ✅ Stubbed (already exists) | — |
| BE: Add `feeAmount?: number` to `DistributionFeeRule` (types.ts) | Backend | ⏳ | — |
| BE: Branch `processDistributionFees()` — flat amount vs percentage | Backend | ⏳ | — |
| BE: Update rules DTO + mapper to accept `feeAmount` | Backend | ⏳ | — |
| BE: Engine spec tests for flat $ fee case | Backend | ⏳ | — |

**Layer 2 — Recoup Multiplier + 2-Tier Waterfall (NEW Apr 16 PM):**

| Task | Type | Status | Date |
|------|------|--------|------|
| BE: Add `recoupMultiplier?: number` to `RecoupmentRule` (default 1.0) | Backend | ⏳ | — |
| BE: Modify `processRecoupment()` to cap at `recoupAmount × recoupMultiplier` | Backend | ⏳ | — |
| BE: New `WaterfallTierRule` interface in types.ts | Backend | ⏳ | — |
| BE: New `processWaterfallTier2()` phase processor (or extend net-profits) | Backend | ⏳ | — |
| BE: Output structure includes Tier 1 + Tier 2 allocations separately | Backend | ⏳ | — |
| BE: Settlement input / rules JSON shape for Tier 2 splits | Backend | ⏳ | — |
| BE: End-to-end engine spec test: Tier 1 (120% recoup) → Tier 2 (20/80 with hard cap exit) | Backend | ⏳ | — |

**Layer 4 — Exit conditions (Hard Cap + Deadline + cross-phase tracking):**

| Task | Type | Status | Date |
|------|------|--------|------|
| BE: Add `hardCapMultiplier?: number` to `RecoupmentRule` / `WaterfallTierRule` | Backend | ⏳ | — |
| BE: Add `recoupDeadline?: string` (ISO date) | Backend | ⏳ | — |
| BE: Thread settlement run date into engine input (not just proof) | Backend | ⏳ | — |
| BE: Enforce hard cap stop in `processRecoupment()` AND `processWaterfallTier2()` | Backend | ⏳ | — |
| BE: Enforce deadline stop in all relevant phases | Backend | ⏳ | — |
| BE: **Cross-phase cumulative payout tracking per investor** (Tier 1 + Tier 2) — required for correct hard cap enforcement | Backend | ⏳ | — |
| BE: Persist per-investor cumulative balances across settlement runs (DB schema) | Backend | ⏳ | — |
| BE: Update rules DTO + mapper for all new fields | Backend | ⏳ | — |
| BE: Engine spec tests for hard cap exit + deadline exit + cross-phase cumulative | Backend | ⏳ | — |

**Design (Rev 3):**

| Task | Type | Status | Date |
|------|------|--------|------|
| Figma: Create Deal — **NO CHANGE** (Rev 3 final) | Design | ✅ Confirmed Rev 3 | Apr 16 |
| Figma: Edit Deal — **NO CHANGE** (Rev 3 final) | Design | ✅ Confirmed Rev 3 | Apr 16 |
| Figma: Rule Snapshot Detail — Fee cell `%` or `$`, Recoup Multiplier, Hard Cap + Deadline columns | Design | ⏳ | — |
| Figma: Rule Snapshot Detail — Tier 1/2 waterfall breakdown, Investor Pool row with unit totals | Design | ⏳ | — |
| Figma: Rule Snapshot Detail — Rule Summary Hard Cap + Deadline summary rows | Design | ⏳ | — |
| Figma: Create Rule Snapshot Step 2 — single unified UX (no Deal Type branching) | Design | ⏳ | — |
| Figma: Create Rule Snapshot Step 2 — Deductions section (optional, shown when Fee Deduction participants exist) | Design | ⏳ | — |
| Figma: Create Rule Snapshot Step 2 — Allocation Targets section (add individual OR pool) | Design | ⏳ | — |
| Figma: Create Rule Snapshot Step 2 — Tier 1 / Tier 2 waterfall config + Investor Pool detail card | Design | ⏳ | — |

**Frontend (Rev 3):**

| Task | Type | Status | Date |
|------|------|--------|------|
| FE: Create Deal — **NO CHANGE** | Frontend | ✅ Confirmed Rev 3 | Apr 16 |
| FE: Edit Deal — **NO CHANGE** | Frontend | ✅ Confirmed Rev 3 | Apr 16 |
| FE: Rule Snapshot Detail — render fee as `%` or `$` | Frontend | ⏳ | — |
| FE: Rule Snapshot Detail — Recoup Multiplier, Hard Cap, Deadline columns | Frontend | ⏳ | — |
| FE: Rule Snapshot Detail — Tier 1/2 waterfall visualization | Frontend | ⏳ | — |
| FE: Rule Snapshot Detail — Investor Pool row (member count + total units) | Frontend | ⏳ | — |
| FE: Create Rule Snapshot Step 2 — single unified flow (no Deal Type branching) | Frontend | ⏳ | — |
| FE: Create Rule Snapshot Step 2 — Deductions section (auto-visible when Fee Deduction participants exist) | Frontend | ⏳ | — |
| FE: Create Rule Snapshot Step 2 — Allocation Target picker (individual vs pool) | Frontend | ⏳ | — |
| FE: Create Rule Snapshot Step 2 — Tier 1 + Tier 2 waterfall config forms | Frontend | ⏳ | — |
| FE: Create Rule Snapshot Step 2 — Investor Pool detail card with unit totals | Frontend | ⏳ | — |

**Notion / PM (Rev 3):**

| Task | Type | Status | Date |
|------|------|--------|------|
| Update FEA-6 ticket — NO CHANGE note (Rev 3 final) | PM | ⏳ | — |
| Update FEA-7 ticket — NO CHANGE note (Rev 3 final) | PM | ⏳ | — |
| Update FEA-13 ticket description with FB-003 Rev 3 additions | PM | ⏳ | — |
| Update FEA-14 ticket description with FB-003 Rev 3 additions (single unified UX) | PM | ⏳ | — |
| ~~New ticket: BE Deal Type enum + migration~~ | — | ❌ Dropped (Rev 3) | — |
| New ticket: BE Allocation Target Layer + Pool concept in RuleSnapshot | PM | ⏳ | — |
| New ticket: BE Complete FLAT_FEE wiring | PM | ⏳ | — |
| New ticket: BE Recoup Multiplier + Tier 1 cap enforcement | PM | ⏳ | — |
| New ticket: BE Tier 2 Waterfall Phase | PM | ⏳ | — |
| New ticket: BE Hard Cap + Deadline + cross-phase cumulative tracking (inside pool only) | PM | ⏳ | — |
| New ticket: BE Share-weighted Investor Pool breakdown at settlement (FB-002b formalized) | PM | ⏳ | — |

**Open items for Tabrez (Rev 3):**

| Task | Type | Status | Date |
|------|------|--------|------|
| Reply to Liang confirming Rev 3 understanding (single pipeline + pool + optional deductions) | Tabrez | ⏳ | — |
| Confirm with boss: Upwork contract scope covers Rev 3 BE work (~5–6 dev days) | Tabrez | ⏳ | — |
| ~~Keep both models or drop Revenue Share?~~ | — | ✅ Dissolved by Rev 3 | — |

**Deferred (not in v1):**

| Task | Type | Status | Date |
|------|------|--------|------|
| BE: Tier 3 (long-tail royalty, reduced investor share) | Backend | ⏳ Deferred to SFI v2 | Per Liang explicit |
| BE: `PASS_THROUGH` behavior wiring | Backend | ⏳ Deferred | No known use case |

