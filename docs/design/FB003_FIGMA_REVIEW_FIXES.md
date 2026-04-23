# FB-003 Figma Review — Detailed Fix Specification

**Date:** Apr 16, 2026
**Source:** Liang's [REVIEW] comments on Figma frames for Rule Snapshot Step 2 + Step 3
**Figma file:** [FEA-Admin](https://www.figma.com/design/Tk5nFtkvsbrDWo7dhIEHm0/FEA-Admin?node-id=638-14061)
**Related:** [CLIENT_DESIGN_FEEDBACK.md](./CLIENT_DESIGN_FEEDBACK.md) — FB-003 Rev 3

---

## Purpose

This document is the **design fix specification** for Designer, covering all 6 [REVIEW] comments Liang left on the FB-003 Figma frames. Each comment has:

- What Liang said (quote)
- Current state in Figma (what exists now)
- Problem analysis
- What to ADD (concrete UI changes)
- What to REVIEW or NOT CHANGE (to prevent unnecessary rework)
- Visual placement sketch
- One-line summary

No architectural changes — the FB-003 Rev 3 structure is validated. These are all refinement-level design fixes.

---

## Affected Figma frames

| Frame                                     | Node ID                           | Status    | Primary concerns           |
| ----------------------------------------- | --------------------------------- | --------- | -------------------------- |
| Create Rule Snapshot [Step 2] [REVIEW]    | `766:11251`                       | In review | Comments 1, 2, 3, 4        |
| Create Rule Snapshot [Step 3] [REVIEW]    | `814:11895`                       | In review | Comments 5, 6              |
| Detail Rule Snapshot [REVIEW]             | `816:25241`                       | In review | Apply same fixes from 5, 6 |
| Participants List [Revisi]                | `589:18614`                       | In review | Comment 7                  |
| Participants List — Import Complete modal | `621:16735` (overlay `621:16756`) | In review | Comment 8                  |
| Add Participant form                      | `672:17502`                       | In review | Comment 7 (form extension) |

Frames marked `[REJECTED]` are older iterations — ignore them.

---

## Comment 1 — Deductions Layer flexibility (names, adding roles)

### What Liang said

> "I think here just need be lil more flexible, name, adding roles etc"

Location: Step 2 [REVIEW], Participant Rules → Deductions Layer section.

### Current state in Figma

- Deductions Layer contains two participant cards as example data: `Global Cinema Partners` and `Platform MCN`
- Both names are rendered as plain text (no input field look, no pencil icon)
- No visible "Add another deduction participant" button
- No visual indication that the cards come from the Participants list (where names can actually be edited)

### Problem

The mock looks like the participant names are fixed fixtures of the UI. For a non-film deal (album, tour, book royalty, etc.), `Global Cinema Partners` makes zero sense, and admins have no signal that they can swap it out.

The backend already supports free-text names via FB-002 (`Participant.roleName` is a free string). The design just needs to surface that flexibility.

### What to ADD

**A. Pencil / edit affordance on each deduction card:**

```
┌─ Deduction Card ─────────────────────────────────┐
│  ☑  Global Cinema Partners    [✎ edit]          │
│  ─────────────────────────────────────           │
│  Fee Type: [ % of Gross Revenue ▾ ]  Amount: [12%]│
└───────────────────────────────────────────────────┘
```

The pencil opens the Participants modal (pre-scoped to that participant) for editing name / roleName.

**B. "+ Add deduction participant" button below the cards:**

```
┌─ Deductions Layer ──────────────────────────────┐
│  [ card 1 ]    [ card 2 ]                        │
│                                                   │
│  ( + Add deduction participant )                  │
└───────────────────────────────────────────────────┘
```

Opens the Participants modal with `behaviorType = FEE_DEDUCTION` preset.

**C. Subtitle clarifying the layer's purpose:**
Under the "Deductions Layer" heading, add:

> _"Fees taken by ABCD partners (distributor, MCN, publisher, etc.) off the top. Leave OFF if this deal has no third-party fees."_

### What to REVIEW or NOT CHANGE

- Do NOT hardcode participant names as fixed fixtures in the design system — use placeholder styling (lighter grey, italic) to signal "example data"
- Do NOT add a role dropdown inside this layer — role/behavior is set at the Participants level, not per-rule-snapshot

### Visual placement

Same horizontal row as the cards. Pencil is top-right of each card header. "+ Add" button spans full width below the last card.

### Summary for Designer

> Make the deduction card names obviously editable (pencil icon + neutral placeholder), add an "+ Add deduction participant" button, and add a subtitle explaining what the layer is for.

---

## Comment 2 — "Can I edit Global Cinema Partners name?"

### What Liang said

> "Am I able edit here? The name? What if it's an album revenue? Global Cinema Partners doesn't make any sense. I think here can be more flexible that's it."

Location: Step 2 [REVIEW], inside the `Global Cinema Partners` deduction card.

### Current state in Figma

Identical to Comment 1 — the card has a fixed-looking name and no edit affordance.

### Problem

Same root cause as Comment 1. Liang tested her mental model (album-revenue deal) against the example copy and found it didn't map. She wants confirmation the UI is not tied to film-industry labels.

### What to ADD

Resolved by Comment 1's fixes (pencil + Add button + subtitle). Additionally:

**A. Change example copy to more neutral defaults:**

- Replace `Global Cinema Partners` with a generic "Example Partner" or cycle through industry examples (`Film Distributor`, `Record Label`, `Tour Promoter`, `Publisher`) in the mock to show flexibility

**B. Tooltip on the pencil icon:**

> _"Rename this partner or change its behavior type"_
> Links to Participants page if user wants full edit context.

### What to REVIEW or NOT CHANGE

- Don't bake industry-specific copy into the design system — all example data should be swappable

### Visual placement

Inline with Comment 1 fix. Tooltip appears on hover over pencil icon.

### Summary for Designer

> Swap the hardcoded `Global Cinema Partners` example with neutral copy, and ensure the pencil icon has a tooltip confirming the name is editable.

---

## Comment 3 — "% of Gross Revenue" isn't a deduction

### What Liang said

> "For gross revenue, it's not deductions, it's like if the creator share 20% of the revenue. Like a deal: eg. a tour share 20% of the revenue to investor pool, no deduction."

Location: Step 2 [REVIEW], Fee Type dropdown inside the `Global Cinema Partners` deduction card.

### Current state in Figma

- Fee Type dropdown has 3 options: `% of Gross Revenue`, `% of Net Income`, `$ Flat Amount`
- All three sit inside the Deductions Layer
- Waterfall Tier 1 says "All revenue flows to this target until the multiplier is reached" — implicitly takes whatever isn't deducted
- There is NO path for "pool takes 20% of gross directly, rest stays with creator" without forcing it through the Deductions Layer (which is semantically wrong — it's not a deduction)

### Problem

Two concepts are conflated:

- **Deduction**: ABCD partner takes a fee off the top (distributor fee, MCN fee, publisher royalty)
- **Pool allocation from source**: creator/artist shares a % of revenue to the investor pool (no third-party fee involved)

Liang's tour example (`tour share 20% of gross to investor pool, no deduction`) is a pure Pool Allocation, not a Deduction. The current UI has nowhere to express this.

This also matches Dev's Apr 16 feedback:

> "Step 1: Deductions on/off. Step 2: Take % on gross revenue / net revenue (after deduction). Then we have all possible revenue sources possible for investor pool."

### What to ADD

**A. New section: "Pool Revenue Source"** — placed between Allocation Targets and Waterfall Tiers:

```
┌─ Pool Revenue Source ─────────────────────────────┐
│  How much of incoming revenue feeds into the      │
│  waterfall below.                                 │
│                                                    │
│  Take [ 20 ] %                                     │
│  From:  ( ● Gross Revenue )                        │
│         ( ○ Net Revenue — after deductions )       │
│                                                    │
│  ℹ The remaining 80% stays with the creator       │
│    (not routed through tiers).                    │
└────────────────────────────────────────────────────┘
```

**Interaction rules:**

- Default: `100% of Net` (preserves existing behavior, not breaking)
- If Deductions toggle = OFF → "Net Revenue" radio is disabled (no net exists without deductions)
- If value = `100%` → hide the info line about "remaining stays with creator" (nothing stays)

**B. Update Waterfall Tiers copy:**

- Current intro: _"Define the priority order for net revenue distribution"_
- New intro: _"Define the priority order for distribution of the Pool Revenue Source amount set above"_
- Current Tier 1 description: _"All revenue flows to this target until the multiplier is reached"_
- New Tier 1 description: _"All pool revenue flows to this target until the multiplier is reached"_

**C. Helper text inside each Deduction Card, under the Fee Type dropdown:**

> _"This is a fee charged by the partner. For pool allocation from gross without a fee, use Pool Revenue Source below."_

### What to REVIEW or NOT CHANGE

- Do NOT remove `% of Gross Revenue` from the Fee Type dropdown — it IS a valid deduction method (distributor takes 12% of gross as a real fee). Just add the helper text so it's not confused with pool allocation.
- Do NOT add a "Revenue Source" concept on the Deal level — it stays at Rule Snapshot level (matches Rev 3 "no Deal Type classifier")

### Visual placement

```
Step 2 — Participants Rules
├── Deductions Layer (toggle ON/OFF)
│   └── Cards: Global Cinema / Platform MCN
│
├── Allocation Targets
│   └── Checkboxes: Investor Pool / Zenith / Sarah Chen
│
├── 🆕 Pool Revenue Source  ← NEW SECTION HERE
│   ├── Take X % from ( ● Gross ) / ( ○ Net )
│   └── Info: "Remaining goes to non-pool targets"
│
├── Waterfall Tiers
│   ├── Tier 1 (Recoupment Phase)
│   └── Tier 2 (Post Recoup Split)
│
├── Investor Pool Configuration (CSV + list)
│
└── Running Totals
```

### Three scenarios after fix

| Scenario                        | Deductions      | Pool Revenue Source | Waterfall Tiers                                          |
| ------------------------------- | --------------- | ------------------- | -------------------------------------------------------- |
| **Tour deal** (Liang's example) | OFF             | `20% of Gross`      | Tier 1: 100% → pool until 120%. Tier 2 optional          |
| **Film deal** (current mock)    | ON (12% + $50K) | `100% of Net`       | Tier 1: 100% → pool until 120%. Tier 2: 20/80 until 140% |
| **Hybrid**                      | ON (fees)       | `40% of Net`        | Pool gets 40% of net through tiers, creator keeps 60%    |

### Summary for Designer

> Add a new `Pool Revenue Source` section between Allocation Targets and Waterfall Tiers with a % input + Gross/Net radio. Update the Waterfall Tiers intro text to reference "pool revenue" instead of "revenue". Keep the Fee Type dropdown options as-is, just add helper text.

---

## Comment 4 — Investor Pool Configuration needs list + adjust

### What Liang said

> "I need see the list like split, and able to adjust. Hard cap 140% not the pool total reach 140%, need make sure each investor reach 140. Either here or Participants list need see investors info individually. I think at Participants might be better? Show email, behave etc. Here only show the unit, how much etch."

Location: Step 2 [REVIEW], Investor Pool Configuration section.

### Current state in Figma

- Section contains a single dashed-border box with "Drag & drop CSV here" + "Browse File" button
- Format hint: _"Name, Investment Amount, Units"_
- No preview of uploaded investors
- No per-investor breakdown visible
- No inline edit of units / caps

### Problem

Two compounding issues:

1. **No list view after upload** — admin uploads a CSV and has no way to verify or adjust what was imported.
2. **Unclear where individual investor details live** — Liang wants email, behavior, investment amount per investor visible somewhere, but is questioning if this is the right page.

She suggests the right split is:

- **Pool Configuration page** = lightweight (CSV + aggregate totals like "200 investors, 10,000 units")
- **Participants list page** = source of truth for full individual detail (email, behaviorType, investment, units, cap)

### What to ADD

**A. Post-upload investor preview table on Pool Configuration:**

```
┌─ Investor Pool Configuration ──────────────────────┐
│  Source: investor_list_final.csv  (195 KB) [↻ Re-upload]│
│                                                    │
│  Summary:                                          │
│    Investors: 200 valid                            │
│    Total Units: 10,000                             │
│    Total Invested: $1,000,000                      │
│                                                    │
│  ┌─ Preview (first 10) ──────────────────────┐    │
│  │ Name           │ Units │ Invested $       │   │
│  │ ─────────────  │ ─────│ ──────────────── │   │
│  │ Alice Chen     │   50 │        $5,000   │   │
│  │ Bob Patel      │  100 │       $10,000   │   │
│  │ ...            │      │                  │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  [ View all 200 in Participants → ]                │
└────────────────────────────────────────────────────┘
```

**B. Cross-link to Participants page** via the `[ View all → ]` button — this opens the full Participants list filtered to this pool's members, where admin can see email, behaviorType, and edit everything.

**C. Inline units/cap edit deferred to Participants page** (per Liang's preference) — on Pool Config page, the preview table is read-only.

**D. Re-upload flow preserves manual edits made on Participants page** — add a warning modal: _"Re-uploading the CSV will reset investor data. Manual edits on the Participants page will be lost."_

### What to REVIEW or NOT CHANGE

- Do NOT duplicate full investor detail (email, behavior) on Pool Config page — keep it light
- Do NOT make the preview table editable inline — that's Participants page responsibility
- Do keep the CSV upload as the primary mass-onboarding path (FB-001 is already BE-shipped)

### Visual placement

Replace the current dashed drag-drop-only box with:

- Top row: file metadata + Re-upload button
- Middle: aggregate summary (3 stat labels)
- Bottom: preview table (10 rows max) + "View all in Participants" link

### Summary for Designer

> Pool Configuration page should show file metadata + aggregate stats + a 10-row preview table (read-only) + a cross-link to the Participants page. Full per-investor edit happens at Participants, not here.

---

## Comment 5 — Net % column in revenue-share deals

### What Liang said

> "Net in the case is right, will that be change if only revenue share deal?"

Location: Step 3 [REVIEW], Participant Terms table → Net % column.

### Current state in Figma

- Step 3 preview shows Participant Terms table with columns: `Name / Behavior / Fee % / Tier 1 Cap / Tier 2 Cap / Net %`
- Net % values shown: Investor Pool 20%, Zenith Pictures 80% (from Tier 2 split)
- Fee-behavior rows show `—` for Net %

### Problem

Liang is asking whether this column still makes sense if the deal is a **pure revenue share** (no Investor Pool, no Waterfall Tiers). In that case there's no "Tier 2 split" driving Net % — it would just be each participant's direct share of net profits.

### What to ADD

**A. Context-aware column values (logic, not design change):**

- When deal has **no pool + no tiers** (simple revenue share): `Net %` = participant's direct share of net profits (`NetProfitRule.percentage`)
- When deal has **pool + tiers**: `Net %` = allocation within the final tier split (e.g. Tier 2 Pool 20%, Creator 80%)

**B. Column header tooltip explaining this:**

> _"Net % represents each participant's share of net profits. For deals with an Investor Pool and tiers, this reflects the final tier split."_

**C. Footnote under the table when pool + tiers are active:**

> _"Tier 1 and Tier 2 caps apply only to Investor Pool participants. Net % is the Tier 2 allocation split."_

**D. No new column, no conditional column removal** — stays a single table structure across both deal shapes.

### What to REVIEW or NOT CHANGE

- Do NOT add a separate "Revenue Share %" column — the existing Net % covers both cases
- Do NOT branch the table based on deal shape — just swap values + footnote

### Visual placement

Tooltip on header `Net %`. Footnote below the table, same typography as existing help text (14px, neutral grey).

### Summary for Designer

> No structural change needed. Add a tooltip on the `Net %` column header + a footnote below the table explaining how the value is derived in each deal shape.

---

## Comment 6 — Hard cap per-investor, not pool

### What Liang said

> "This should for each investor — hard cap, recoup, all for individual investor not pool."

Location: Step 3 [REVIEW], Participant Terms table → Investor Pool row showing `Tier 1 Cap: 120%` and `Tier 2 Cap: 140%`.

### Current state in Figma

- The Investor Pool row has Tier 1 Cap `120%` and Tier 2 Cap `140%` in a single aggregate row
- Label is `Investor Pool` — reads as "the pool as a whole reaches 120% / 140%"
- No visible indication that these are per-investor limits, not pool-aggregate

### Problem

Engine-wise this is per-investor (Rev 3 spec is explicit). But the UI reads as pool-aggregate — dangerous because it could mislead admins reviewing the snapshot before finalizing. Also settlement runs enforce per-investor, so there's a user-expectation mismatch risk.

### What to ADD

**A. Rename column headers:**

- `Tier 1 Cap` → `Tier 1 Cap (per investor)`
- `Tier 2 Cap` → `Tier 2 Cap (per investor)`

Keep width reasonable — consider two-line header or abbreviation like `Tier 1 Cap / investor`.

**B. Expandable row on Investor Pool:**

```
┌─ Participant Terms ─────────────────────────────────────────────┐
│ Name           │ Behavior   │ Fee% │ T1 Cap │ T2 Cap │ Net% │    │
│ ───────────── │ ──────── │ ──── │ ───── │ ───── │ ──── │    │
│ Global Cinema  │ Fee        │ 12%  │  —    │  —    │  —   │    │
│ Platform MCN   │ Fee        │ $50K │  —    │  —    │  —   │    │
│ ▶ Investor Pool│ Recoupment │  —   │ 120%  │ 140%  │ 20%  │ [▼]│  ← expandable
│ Zenith Pictures│ Net Profit │  —   │  —    │  —    │ 80%  │    │
└─────────────────────────────────────────────────────────────────┘

When expanded:
┌─ Investor Pool → individual investors ──────────────────────┐
│   Name         │ Units │ Invested   │ T1 Cap $  │ T2 Cap $  │
│   ──────────── │ ──── │ ────────── │ ──────── │ ────────── │
│   Alice Chen   │   50 │    $5,000  │  $6,000  │   $7,000  │
│   Bob Patel    │  100 │   $10,000  │ $12,000  │  $14,000  │
│   ...          │      │            │          │           │
│   [ View all 200 in Participants → ]                         │
└──────────────────────────────────────────────────────────────┘
```

The expanded view shows:

- Each investor's own invested amount
- Tier 1 Cap $ = `invested × recoupMultiplier` (e.g. $5,000 × 1.2 = $6,000)
- Tier 2 Cap $ = `invested × hardCapMultiplier` (e.g. $5,000 × 1.4 = $7,000)
- Link to full Participants view

**C. Aggregate row stays for summary**, just makes the per-investor nature explicit via label + drill-down.

**D. Rule Summary card update** (top of page):
Current: `Recoupment 120% — Individual Cap`
This is already correct — just make sure the `Individual Cap` subtitle stays visible and consider making it bolder.

### What to REVIEW or NOT CHANGE

- Do NOT show all 200 investors inline by default — that kills the page. Use expandable + "View all" link
- Do NOT remove the aggregate Investor Pool row — it's useful as a summary
- Rev 3 engine logic is correct — this is purely a UI/labeling fix

### Visual placement

Chevron (▶/▼) in the rightmost column of the Investor Pool row. Expanded state pushes below rows down.

### Summary for Designer

> Rename column headers to `... (per investor)`, add an expandable chevron on the Investor Pool row that drills down to the first 10 individual investors with their per-investor cap calculations, and keep the existing `Individual Cap` subtitle on the Rule Summary card.

---

## Comment 7 — Import investor pool info at Participants page ("investors are participants too")

### What Liang said

Threaded discussion on the Participants List [Revisi] frame:

> **Liang:** "Is here can adding one more option: import investor pool — the investor as Tab said: has %, holding unit, price etc"
>
> **Designer:** "This part only cover participant data."
>
> **Designer:** "Investor pool is on create rules snapshot page."
>
> **Liang:** "But investor pool will need to know all the info like email etc also. Maybe show inside investor pool? Investor pool are Participant too."

Location: Participants List [Revisi] (node `589:18614`) + Add Participant form (node `672:17502`).

### Current state in Figma

- Participants List shows a table with `Name / Behavior / Role Name / Email / Joined On` columns
- Two buttons in header: `Add Participant` + `Import CSV`
- Import CSV modal (node `621:15495`) describes format: _"Required columns: name, paymentBehavior, roleName. Optional: email, externalId"_
- Add Participant form (node `672:17502`) has: Name input, Behavior select, Radio input, Email input, Textarea (notes?)
- **No concept of investment-specific fields** anywhere: no `investmentAmount`, no `units`, no `pricePerUnit`
- The CSV drag-drop in Rule Snapshot Step 2 / Pool Configuration (separate page) is currently where investor units get imported — disconnected from the main Participants list

### Problem

Liang is flagging a real architectural inconsistency. The current design has **two separate import paths** for investors:

1. **Participants page** imports basic participant info (name, behavior, email, role)
2. **Pool Configuration page** (inside Create Rule Snapshot) imports investor-specific data (name, investment amount, units)

But investors ARE participants — they have `behaviorType = RECOUPMENT` in the same `Participant` table. Splitting the import creates data-entry duplication, fragmented admin UX, and no single source of truth.

Designer's position (Pool Config is for pool data only) is technically correct for the CURRENT design, but Liang's point stands: the design itself should be fixed so investors get imported with full participant context (email, behavior) PLUS their investment details in one place.

This connects directly to **Comment 4** (Liang's suggestion that Participants page should be the source of truth for full investor detail). Resolving Comment 7 is the flip side of the same decision.

### What to ADD

**A. Extend the Add Participant form** — when `behaviorType = RECOUPMENT` is selected, reveal a new section:

```
┌─ Investment Details ──────────────────────────────┐
│  (only shown when Behavior = Recoupment / Investor) │
│                                                    │
│  Investment Amount $    [ 5,000        ]           │
│  Units Held             [ 50           ]           │
│  Price per Unit $       [ 100          ]  (auto)   │
│                                                    │
│  ℹ Price per Unit = Investment Amount ÷ Units     │
└────────────────────────────────────────────────────┘
```

Rules:

- Section hidden unless `behaviorType = RECOUPMENT` (or future `INVESTOR_POOL` behavior)
- `pricePerUnit` is computed/read-only when both investment amount + units are set; editable if admin wants to override
- Validation: at least `investmentAmount` OR `units` must be set for Recoupment participants

**B. Extend the CSV import template** — add optional columns for investor data:

Current template:

```
name, paymentBehavior, roleName, email, externalId
```

Updated template:

```
name, paymentBehavior, roleName, email, externalId,
investmentAmount, units, pricePerUnit
```

- Last three columns only required when `paymentBehavior = RECOUPMENT`
- Ignored (or warning) when behavior is anything else
- Update the Import CSV modal format description accordingly

**C. Add conditional columns to Participants List table:**

When the participants list contains any `RECOUPMENT`-behavior rows, show three additional columns (with `—` for non-investor rows):

- `Investment $`
- `Units`
- `Price/Unit`

OR use an expandable row pattern similar to Comment 6 — click chevron on a Recoupment row to see investment details inline.

**D. Cross-link from Rule Snapshot → Pool Configuration → Participants:**

On the Pool Configuration section (Step 2 [REVIEW]), replace the "View all 200 in Participants" link with something clearer:

```
[ Manage pool members in Participants → ]
```

When clicked, navigate to Participants List with a filter pre-applied: `behaviorType = RECOUPMENT` for this deal. The Pool Configuration page keeps its role as a **light summary + CSV upload for bulk**, and the Participants page handles **individual edits, row-level detail**.

**E. Update Import CSV dialog description** (the modal at node `621:14258`):

Current:

> "Required columns: name, paymentBehavior, roleName. Optional: email, externalId"

Updated:

> _"Required: name, paymentBehavior, roleName. Optional: email, externalId. Required for Recoupment/Investor rows: investmentAmount, units. Auto-computed: pricePerUnit."_

### What to REVIEW or NOT CHANGE

- Do NOT remove the CSV upload on Pool Configuration page — it's still valid as a bulk-onboarding shortcut for investors, just make sure data flows into the same `Participant` records as the main Participants page does
- Do NOT create a separate "Investors" page — it's the same model as Participants, just filtered by behavior
- Do NOT hide the investment fields entirely from non-Recoupment participants — keep them visible as `—` to reinforce that the data model is unified
- Backend-wise, investment data lives on `Participant.metadata` JSON (per Prisma schema) — no schema change needed. BE just needs to validate + surface these fields via DTO. Effort delta: ~0.5 day.

### Visual placement

- Participants List: add 3 columns (`Investment $`, `Units`, `Price/Unit`) after Email, OR add an expandable row pattern
- Add Participant form: Investment Details section appears right after Behavior select, inside the existing form card (collapsed when behavior ≠ Recoupment)
- Import CSV modal: update the instruction text block at the top
- Pool Configuration: replace the current `View all` link with `Manage pool members in Participants →`

### Summary for Designer

> Investors ARE participants. Extend the Participants list, Add Participant form, and Import CSV template with optional investment fields (investmentAmount, units, pricePerUnit) shown only when behavior = Recoupment. Pool Configuration stays as a light summary + bulk CSV shortcut, and cross-links to the Participants page for full row-level management.

---

## Comment 8 — Error report inline on Import Complete (no download needed)

### What Liang said

Two consecutive comments on the Import Complete modal:

> "It's cool to have the error report — maybe just show in here? No download needed."
>
> "But after error do I need to edit it?"

Location: Participants List → Import Complete modal (node `621:16756` overlay).

### Current state in Figma

Import Complete modal (node `621:16757`):

- Title: "Import Complete"
- Stat row 1: `46 participants imported successfully` (green check icon)
- Stat row 2: `2 rows skipped (invalid role)` (warning icon)
- Full-width button (likely "Download Error Report")
- Footer button: "Close" / "Go to Participants"

The errors are shown as a **count only** — the user has to download a CSV to see which rows failed and why. No inline error visibility.

### Problem

Two user concerns, both valid:

1. **Download friction**: For only 2 error rows, forcing a download is overkill. Users want to see the errors right in the modal.
2. **Unclear next action**: After seeing errors, what is the user supposed to do? Edit the original CSV and re-upload? Fix via UI? Ignore and move on?

Without clear next-step guidance, the Import Complete modal becomes a dead-end.

### What to ADD

**A. Inline expandable error section** — replace the download button with an expandable details panel:

```
┌─ Import Complete ──────────────────────────────────────────┐
│                                                            │
│  ✓  46 participants imported successfully                  │
│                                                            │
│  ⚠  2 rows skipped — see details below                     │
│                                                            │
│  ┌─ Skipped rows ──────────────────────────────────────┐  │
│  │ Row │ Name           │ Issue                         │  │
│  │ ─── │ ──────────────│ ─────────────────────────────│  │
│  │  17 │ John Doe       │ Invalid role: "Distrbtr" (typo)│  │
│  │  42 │ Maria Santos   │ Missing behavior type          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  What now?                                                 │
│  [ Download errors as CSV ]  [ Go to Participants → ]      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

Rules:

- If error count ≤ 10 → expand the table by default
- If error count > 10 → show a "Show all N errors" expand toggle
- Keep "Download errors as CSV" as an optional secondary action (useful for large batches)
- Primary action: "Go to Participants" (moves user forward)

**B. Clear "What now?" guidance section** below the stat rows:

```
What now?
  • 46 rows imported — visible now in Participants list.
  • 2 rows skipped — fix them in your CSV and re-upload,
    or add them manually via "+ Add Participant".
```

This addresses Liang's "do I need to edit it?" question directly.

**C. Add a tertiary "Re-upload corrected CSV" button:**

```
[ Re-upload ]  [ Download errors ]  [ Go to Participants → ]
```

The Re-upload opens the same CSV dialog, so user can fix the file and reimport without leaving the context.

**D. Error detail row format:**

Each error row in the inline table should show:

- `Row` — source CSV row number (for cross-referencing in the original file)
- `Name` — what the user entered (so they can recognize the row)
- `Issue` — human-readable error with suggested fix when possible (e.g. "Invalid role: 'Distrbtr' (did you mean 'Distributor'?)")

### What to REVIEW or NOT CHANGE

- Do NOT remove the download-as-CSV option entirely — for batches with 50+ errors, download is still the right tool. Just demote it from primary to secondary action.
- Do NOT auto-dismiss the modal after N seconds — users need time to read the errors
- Do NOT make the successful import rows a list in the modal — 46 rows is too much; that's what the Participants page is for
- Backend: The `BulkImportResultDto` (already built via FB-001) already returns a `skipped` array with row-level errors — frontend just needs to render it instead of formatting it as a downloadable file

### Visual placement

- Modal width: keep current (~858px per metadata)
- Stat rows at top — keep as-is
- New expandable table in the middle (replaces the full-width button area)
- "What now?" text block below the table
- Footer: 2–3 buttons (Re-upload / Download errors / Go to Participants)

### Summary for Designer

> Remove the full-width download-only button. Replace with an inline expandable table showing Row / Name / Issue for each skipped row. Add a "What now?" explanation paragraph and a three-button footer (Re-upload / Download errors as CSV / Go to Participants). The `BulkImportResultDto` from FB-001 already has the error data — no BE work needed.

---

## Consolidated checklist for Designer

### Step 2 [REVIEW] — node `766:11251`

- [ ] Add pencil/edit icon on each deduction card header (Comments 1, 2)
- [ ] Add "+ Add deduction participant" button below the cards (Comment 1)
- [ ] Add subtitle under "Deductions Layer" heading explaining its purpose (Comment 1)
- [ ] Swap `Global Cinema Partners` placeholder with neutral copy (Comment 2)
- [ ] Add pencil icon tooltip (Comment 2)
- [ ] **Insert new section `Pool Revenue Source` between Allocation Targets and Waterfall Tiers** (Comment 3)
- [ ] Update Waterfall Tiers intro + Tier 1 description text to reference "pool revenue" (Comment 3)
- [ ] Add helper text under Fee Type dropdown distinguishing fee vs pool allocation (Comment 3)
- [ ] Redesign Investor Pool Configuration section: file metadata + aggregate stats + 10-row preview + "View all in Participants" link (Comment 4)
- [ ] Add re-upload warning modal (Comment 4)

### Step 3 [REVIEW] — node `814:11895`

- [ ] Add tooltip on `Net %` column header (Comment 5)
- [ ] Add footnote below Participant Terms table explaining tier/net semantics (Comment 5)
- [ ] Rename `Tier 1 Cap` → `Tier 1 Cap (per investor)` (Comment 6)
- [ ] Rename `Tier 2 Cap` → `Tier 2 Cap (per investor)` (Comment 6)
- [ ] Add expandable chevron on the Investor Pool row (Comment 6)
- [ ] Design the expanded per-investor breakdown view (Comment 6)
- [ ] Verify `Individual Cap` subtitle stays on Rule Summary card (Comment 6)

### Detail Rule Snapshot [REVIEW] — node `816:25241`

- [ ] Apply same fixes from Comments 5 and 6 (this frame shares the Participant Terms table structure with Step 3)

### Participants List [Revisi] — node `589:18614`

- [ ] Add conditional columns: `Investment $`, `Units`, `Price/Unit` (Comment 7)
- [ ] OR use expandable row pattern to reveal investment details on Recoupment rows (Comment 7)
- [ ] Update Import CSV modal instruction text to include new optional columns (Comment 7)

### Add Participant form — node `672:17502`

- [ ] Add conditional "Investment Details" section revealed when Behavior = Recoupment (Comment 7)
- [ ] Fields: `Investment Amount $`, `Units Held`, `Price per Unit $` (auto-computed) (Comment 7)

### Import Complete modal — node `621:16756` (overlay)

- [ ] Remove full-width download-only button (Comment 8)
- [ ] Add inline expandable error table with `Row / Name / Issue` columns (Comment 8)
- [ ] Add "What now?" guidance paragraph below the table (Comment 8)
- [ ] Restructure footer: `Re-upload` / `Download errors as CSV` / `Go to Participants` (Comment 8)

### Pool Configuration cross-link (Step 2 [REVIEW])

- [ ] Rename `View all 200 in Participants` → `Manage pool members in Participants →` (Comment 7)
- [ ] Ensure link pre-filters Participants list by `behaviorType = RECOUPMENT` (Comment 7)

---

## Backend impact

**Minimal.** Most fixes are presentation-layer only. The engine already enforces per-investor caps (Rev 3), the participant name is already free-text (FB-002), `BulkImportResultDto` (from FB-001) already returns row-level errors, and the Pool Revenue Source concept slots into the existing `RuleSnapshot.rules` JSON structure as a new field (`poolRevenueSource: { percentage, basis: 'GROSS' | 'NET' }`).

BE deltas (all small, roll into existing tickets):

- Pool Revenue Source parsing in engine (~0.5 day) — rolls into the "Tier 2 Waterfall Phase" ticket
- Participant investment fields surfaced via DTO (~0.5 day) — extends FB-002 DTO, data already fits in `Participant.metadata` JSON per Prisma schema
- CSV import template extension with investmentAmount/units/pricePerUnit columns (~0.5 day) — extends FB-001 parser

Total BE delta: ~1.5 dev days on top of existing FB-003 Rev 3 estimate.

---

## Deliverables from Designer

1. Updated Figma frames for Step 2, Step 3, and Detail
2. Ping in Slack when ready for Liang to re-review
3. Move both FEA-13 and FEA-14 from `Design Rejected` → `Design In Review` once updated

---

## Deliverables from BE / FE (after design re-approval)

- BE: add `poolRevenueSource` field to `RuleSnapshot.rules` DTO + engine (rolls into existing Tier 2 ticket)
- FE: implement new Pool Revenue Source section, deduction card edit affordance, pool config preview table, expandable per-investor rows
- FE: wire the "View all in Participants" cross-link

---

## Reply template for Liang

Copy-paste into Figma comment thread:

> Thanks for the review, Liang — all 8 comments validated and logged in [`FB003_FIGMA_REVIEW_FIXES.md`](./FB003_FIGMA_REVIEW_FIXES.md). Summary:
>
> 1 + 2 — Deduction participant names are editable (FB-002 shipped this at the backend); Designer will add a pencil icon + "Add participant" button so it's visually obvious.
>
> 3 — You're right, "% of gross" isn't a deduction. We're adding a new `Pool Revenue Source` section above the Waterfall Tiers (Take X% from Gross / Net), keeping Deductions Layer strictly for ABCD fees.
>
> 4 — Pool Configuration page will stay lightweight (file + aggregate stats + 10-row preview), with full per-investor edit on the Participants page. Cross-linked.
>
> 5 — `Net %` column stays, meaning adapts: simple revenue share = direct share, pool + tiers = Tier 2 allocation. Adding a tooltip + footnote for clarity.
>
> 6 — Completely right: caps are per-investor. We're renaming columns to `(per investor)` and adding an expandable row to drill into individual investor caps.
>
> 7 — Agreed — investors ARE participants. We'll extend the Add Participant form + CSV template + Participants list with optional investment fields (amount, units, price/unit) that appear when behavior = Recoupment. Pool Configuration becomes a light summary + bulk-upload shortcut that cross-links to the Participants page for full edits.
>
> 8 — Removing the download-only error flow. Errors will show inline in the Import Complete modal with row/name/issue per skipped row, plus a "What now?" guidance block and three options: Re-upload corrected CSV / Download errors / Go to Participants.
>
> Designer is on it — I'll ping you when the updated frames are ready.

---

## Rev history

- **Apr 16, 2026** — Initial version covering 6 [REVIEW] comments on Rule Snapshot Step 2 + Step 3
- **Apr 16, 2026 (later)** — Added Comments 7 and 8 covering Participants List thread + Import Complete modal (Revision [REVIEW] section, node `621:17141`)
