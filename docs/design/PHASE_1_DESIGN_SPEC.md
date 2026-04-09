# FEA Admin Portal — Phase 1 Complete Design Specification

**Purpose:** Complete UI/UX design blueprint for all 32 screens in Phase 1
**Audience:** UI/UX Designers (Figma execution)
**Date:** March 2026
**Backend API:** All endpoints are built and tested. This doc maps every screen to real API data.

---

## Table of Contents

1. [Portal Overview](#portal-overview)
2. [Design System Foundations](#design-system-foundations)
3. [Navigation & Layout](#navigation--layout)
4. [MS-1: Shell & Deals (8 screens)](#ms-1-shell--deals)
5. [MS-2: Participants & Rules (6 screens)](#ms-2-participants--rules)
6. [MS-3: Revenue & Documents (5 screens)](#ms-3-revenue--documents)
7. [MS-4: Settlement Core (8 screens)](#ms-4-settlement-core)
8. [MS-5: Reports & Proof (5 screens)](#ms-5-reports--proof)
9. [Shared Components Library](#shared-components-library)
10. [API Endpoint Reference](#api-endpoint-reference)

---

## Portal Overview

This is a **standalone web portal** (not embedded inside another app). It has its own authentication, navigation, and deal management. Users log in, see a global dashboard, manage deals, and within each deal access the full SFI settlement engine.

### Information Architecture

```
FEA Admin Portal (standalone)
│
├── Auth (no sidebar)
│   ├── Login
│   ├── Register
│   └── Forgot Password
│
├── Global Shell (with sidebar)
│   ├── Dashboard (cross-deal overview)
│   └── Deals
│       ├── Deals List
│       ├── Create Deal
│       └── Edit Deal
│
└── Deal Context (sidebar changes to deal sub-nav)
    ├── Deal Overview
    ├── Participants
    ├── Rules (Rule Snapshots)
    ├── Revenue (Revenue Batches)
    ├── Settlement
    ├── Documents
    ├── Reports (Ledger, Recoupment, Statements)
    └── Proof
```

### Two Layout Modes

1. **Auth Layout** — Centered card on background, no sidebar. Used by: Login, Register, Forgot Password.
2. **App Layout** — Sidebar + top bar + content area. Used by: Everything else.

The sidebar has two states:
- **Global mode:** Dashboard, Deals
- **Deal mode:** When user is inside a deal, sidebar shows deal sub-navigation (Overview, Participants, Rules, Revenue, Settlement, Documents, Reports, Proof). A "back to Deals" link at the top returns to global mode.

---

## Design System Foundations

### Status Color System

Every entity has a status. These colors are used **consistently** across the entire portal.

| Color | Hex Suggestion | Meaning | Used For |
|-------|---------------|---------|----------|
| Gray | `#6B7280` | Not started / Draft | DRAFT deals, DRAFT settlement runs |
| Yellow/Amber | `#F59E0B` | Awaiting action | PENDING revenue batches, PREVIEWED settlement runs |
| Green | `#10B981` | Active / Approved / Done | ACTIVE deals, VALIDATED batches, FINALIZED runs |
| Blue | `#3B82F6` | Completed / Processed | PROCESSED revenue batches |
| Red | `#EF4444` | Error / Rejected / Stopped | REJECTED batches, VOIDED runs, SUSPENDED deals |
| Purple | `#8B5CF6` | Special / Correction | CORRECTION run type |

### Role Badge Colors (Participants)

| Role | Color | Hex Suggestion |
|------|-------|---------------|
| STUDIO | Blue | `#3B82F6` |
| DISTRIBUTOR | Purple | `#8B5CF6` |
| INVESTOR | Green | `#10B981` |
| TALENT | Orange | `#F97316` |
| PRODUCER | Indigo | `#6366F1` |
| LICENSOR | Teal | `#14B8A6` |
| LICENSEE | Teal | `#14B8A6` |
| COLLECTION_AGENT | Gray | `#6B7280` |

### Typography Hierarchy

| Level | Usage | Weight |
|-------|-------|--------|
| H1 (Page Title) | Page name: "Deals", "Settlement Run #2" | Bold |
| H2 (Section Title) | Card headers: "Phase 1: Gross Receipts" | Semibold |
| H3 (Subsection) | Group labels: "Quick Actions" | Medium |
| Body | Table content, descriptions | Regular |
| Caption | Timestamps, helper text, metadata | Regular, muted color |
| Stat Number | Dashboard cards, totals | Bold, larger size |

### Spacing & Layout

- **Content max-width:** 1200px (centered within content area)
- **Card padding:** 24px
- **Card gap:** 16px (between cards in a grid)
- **Table row height:** 48-56px
- **Form field spacing:** 16px vertical gap
- **Section spacing:** 32px between major sections on a page

### Common Patterns

- **Stat Card:** Icon + number + label. Used in dashboards and overviews.
- **Data Table:** Sortable columns, pagination footer, optional status filter tabs.
- **Status Badge:** Pill shape with colored background + text. Always consistent per status.
- **Action Button Bar:** Fixed at bottom of page or inside a card. Primary action right, secondary left.
- **Confirmation Modal:** Centered overlay with warning icon, description, cancel + confirm buttons.
- **Empty State:** Illustration + "No [items] yet" + CTA button.
- **Breadcrumb:** Shows hierarchy: `Deals > The Last Horizon > Settlement > Run #2`
- **Back Link:** `← Back to [parent]` at top-left of detail pages.

### Currency Formatting

- Always show currency symbol: `$200,000,000` for USD
- Use thousand separators: `$1,234,567.89`
- Supported currencies: USD, EUR, GBP, JPY, CHF, CAD, AUD
- Show currency code next to amount when deal is non-USD: `€500,000 EUR`

### Date Formatting

- Display: `Mar 5, 2026` (short month, day, full year)
- Periods: `Jan–Mar 2026` (en-dash between)
- Timestamps: `Mar 5, 2026 2:30 PM` (for audit/proof)
- API sends ISO 8601, frontend formats for display

---

## Navigation & Layout

### Auth Layout (Login, Register, Forgot Password)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                    ┌─────────────────────┐                      │
│                    │                     │                      │
│                    │    FEA Logo         │                      │
│                    │                     │                      │
│                    │   [Auth Form]       │                      │
│                    │                     │                      │
│                    │                     │                      │
│                    └─────────────────────┘                      │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- Centered card (max-width ~400px)
- Clean background (solid color or subtle gradient)
- FEA logo at top of card
- No sidebar, no top bar

### App Layout — Global Mode

```
┌──────────┬──────────────────────────────────────────────────────┐
│          │  Top Bar: [Breadcrumb]              [User Avatar ▼]  │
│ SIDEBAR  ├──────────────────────────────────────────────────────┤
│          │                                                      │
│ FEA Logo │                                                      │
│          │              CONTENT AREA                             │
│ ──────── │              (max 1200px, centered)                   │
│ Dashboard│                                                      │
│ Deals    │                                                      │
│          │                                                      │
│          │                                                      │
│          │                                                      │
│          │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

### App Layout — Deal Context Mode

```
┌──────────┬──────────────────────────────────────────────────────┐
│          │  Top Bar: Deals > The Last Horizon > Settlement      │
│ SIDEBAR  ├──────────────────────────────────────────────────────┤
│          │                                                      │
│ ← Deals  │                                                      │
│          │              CONTENT AREA                             │
│ THE LAST │              (deal-specific page)                     │
│ HORIZON  │                                                      │
│ ──────── │                                                      │
│ Overview │                                                      │
│ Partici… │                                                      │
│ Rules    │                                                      │
│ Revenue  │                                                      │
│ Settle…  │                                                      │
│ Documents│                                                      │
│ Reports  │                                                      │
│ Proof    │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

- Sidebar shows deal name at top
- "← Deals" link returns to global Deals List
- Active nav item highlighted
- Sidebar is collapsible on smaller screens (hamburger icon)

---

## MS-1: Shell & Deals

**8 screens:** Login, Register, Forgot Password, Global Dashboard, Deals List, Create Deal, Deal Overview, Edit Deal

---

### Screen 1.1: Login

**Layout:** Auth Layout (centered card)
**URL:** `/login`

```
┌────────────────────────────────────────┐
│                                        │
│            [FEA Logo]                  │
│                                        │
│         Welcome Back                   │
│    Sign in to your account             │
│                                        │
│    Email *                             │
│    ┌──────────────────────────────┐    │
│    │ email@example.com            │    │
│    └──────────────────────────────┘    │
│                                        │
│    Password *                          │
│    ┌──────────────────────────────┐    │
│    │ ••••••••            [👁]     │    │
│    └──────────────────────────────┘    │
│                                        │
│    [Forgot password?]                  │
│                                        │
│    ┌──────────────────────────────┐    │
│    │         Sign In              │    │
│    └──────────────────────────────┘    │
│                                        │
│    Don't have an account? [Register]   │
│                                        │
└────────────────────────────────────────┘
```

**Form Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Email | Email input | Yes | Valid email format |
| Password | Password input (with show/hide toggle) | Yes | Min 8 chars |

**Interactions:**
- "Forgot password?" link → navigates to `/forgot-password`
- "Register" link → navigates to `/register`
- Submit → POST auth endpoint → on success redirect to `/dashboard`
- On error → show inline error: "Invalid email or password"
- Show/hide password toggle (eye icon)

**States:**
- Default (empty form)
- Filled (user typing)
- Loading (button shows spinner, inputs disabled)
- Error (red border on fields, error message below)

---

### Screen 1.2: Register

**Layout:** Auth Layout (centered card)
**URL:** `/register`

```
┌────────────────────────────────────────┐
│                                        │
│            [FEA Logo]                  │
│                                        │
│        Create Account                  │
│    Get started with FEA Admin          │
│                                        │
│    Full Name *                         │
│    ┌──────────────────────────────┐    │
│    │                              │    │
│    └──────────────────────────────┘    │
│                                        │
│    Email *                             │
│    ┌──────────────────────────────┐    │
│    │                              │    │
│    └──────────────────────────────┘    │
│                                        │
│    Password *                          │
│    ┌──────────────────────────────┐    │
│    │                     [👁]     │    │
│    └──────────────────────────────┘    │
│    Min 8 characters                    │
│                                        │
│    Confirm Password *                  │
│    ┌──────────────────────────────┐    │
│    │                     [👁]     │    │
│    └──────────────────────────────┘    │
│                                        │
│    ┌──────────────────────────────┐    │
│    │       Create Account         │    │
│    └──────────────────────────────┘    │
│                                        │
│    Already have an account? [Sign in]  │
│                                        │
└────────────────────────────────────────┘
```

**Form Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Full Name | Text input | Yes | 1-255 chars |
| Email | Email input | Yes | Valid email, unique |
| Password | Password input | Yes | Min 8 chars |
| Confirm Password | Password input | Yes | Must match Password |

**Interactions:**
- "Sign in" link → `/login`
- Submit → on success redirect to `/login` with success toast "Account created. Please sign in."
- Password mismatch → inline error under Confirm Password
- Duplicate email → inline error "Email already registered"

---

### Screen 1.3: Forgot Password

**Layout:** Auth Layout (centered card)
**URL:** `/forgot-password`

```
┌────────────────────────────────────────┐
│                                        │
│            [FEA Logo]                  │
│                                        │
│        Forgot Password?                │
│  Enter your email and we'll send       │
│  you a reset link.                     │
│                                        │
│    Email *                             │
│    ┌──────────────────────────────┐    │
│    │                              │    │
│    └──────────────────────────────┘    │
│                                        │
│    ┌──────────────────────────────┐    │
│    │       Send Reset Link        │    │
│    └──────────────────────────────┘    │
│                                        │
│    [← Back to Sign in]                 │
│                                        │
└────────────────────────────────────────┘
```

**After Submit (success state):**

```
┌────────────────────────────────────────┐
│                                        │
│            [FEA Logo]                  │
│                                        │
│         Check Your Email               │
│                                        │
│    [✉ Email icon]                      │
│                                        │
│  We sent a password reset link to      │
│  john@example.com                      │
│                                        │
│  Didn't receive it?                    │
│  [Resend]   [Try different email]      │
│                                        │
│  [← Back to Sign in]                  │
│                                        │
└────────────────────────────────────────┘
```

---

### Screen 1.4: Global Dashboard

**Layout:** App Layout — Global Mode
**URL:** `/dashboard`

**Purpose:** Cross-deal overview. Shows aggregate stats and items needing attention.

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │     12     │ │      8     │ │      3     │ │  $450M     │  │
│  │ Total Deals│ │   Active   │ │  Pending   │ │  Settled   │  │
│  │            │ │   Deals    │ │  Reviews   │ │  (total)   │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
│                                                                 │
│  ┌─ Pending Reviews ───────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Revenue Batches Awaiting Validation                     │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ The Last Horizon │ RB-2026-004 │ $50M │ PENDING  │   │   │
│  │  │ Midnight Express │ RB-2026-007 │ $12M │ PENDING  │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  Settlements Awaiting Finalization                       │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ The Last Horizon │ Run #3 │ $5M │ PREVIEWED      │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  [View All Pending Reviews →]                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Recent Deals ──────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Deal Name           │ Status │ Participants │ Updated   │   │
│  │  ────────────────────────────────────────────────────── │   │
│  │  The Last Horizon    │ ACTIVE │ 5            │ Mar 5     │   │
│  │  Midnight Express    │ ACTIVE │ 3            │ Mar 3     │   │
│  │  Starlight Contract  │ DRAFT  │ 0            │ Mar 1     │   │
│  │  Ocean Protocol      │ ACTIVE │ 4            │ Feb 28    │   │
│  │  Sunset Boulevard V2 │ CLOSED │ 6            │ Feb 20    │   │
│  │                                                          │   │
│  │  [View All Deals →]                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources:**
- GET `/deals` → total count, filter by status for active count
- GET `/deals?sortBy=updatedAt&sortOrder=desc&limit=5` → recent deals
- Pending reviews: aggregate from multiple deal revenue-batches with status=PENDING and settlement-runs with status=PREVIEWED

**Components:**
- 4x Stat Cards (Total Deals, Active Deals, Pending Reviews, Total Settled)
- Pending Reviews section with two sub-lists (revenue batches + settlements)
- Recent Deals table (top 5, clickable rows → deal overview)
- "View All" links

**Designer Notes:**
- Stat cards should be visually prominent (large numbers)
- Pending Reviews section should have a subtle urgency feel (amber/yellow accent border or icon)
- Each deal row is clickable → navigates to Deal Overview
- Empty state for Pending Reviews: "All caught up! No items need your attention."
- Empty state for Recent Deals: "No deals yet. Create your first deal to get started." + [Create Deal] button

---

### Screen 1.5: Deals List

**Layout:** App Layout — Global Mode
**URL:** `/deals`

```
┌─────────────────────────────────────────────────────────────────┐
│  Deals                                              [+ New Deal] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [All (12)]  [Active (8)]  [Draft (2)]  [Closed (2)]           │
│                                                                 │
│  ┌─ Search ──────────────────────┐                              │
│  │ 🔍 Search deals...            │                              │
│  └───────────────────────────────┘                              │
│                                                                 │
│  Deal Name              │ Status  │ Currency │ Participants │ Created    │
│  ──────────────────────────────────────────────────────────────  │
│  The Last Horizon       │ 🟢ACTIVE │ USD     │ 5            │ Feb 1, 2026│
│  Midnight Express       │ 🟢ACTIVE │ USD     │ 3            │ Feb 5, 2026│
│  Starlight Contract     │ ⚪DRAFT  │ EUR     │ 0            │ Mar 1, 2026│
│  Ocean Protocol         │ 🟢ACTIVE │ USD     │ 4            │ Jan 15     │
│  Sunset Boulevard V2    │ ⚫CLOSED │ USD     │ 6            │ Dec 1, 2025│
│  ...                                                            │
│                                                                 │
│  ◄ 1  2  3  ►                         Showing 1-10 of 12       │
└─────────────────────────────────────────────────────────────────┘
```

**Data Source:** GET `/deals` with pagination + sorting

**Interactions:**
- Status tabs filter the list (All / Active / Draft / Closed)
- Search filters by deal name (client-side or query param)
- Each row is clickable → navigates to `/deals/:id/overview` (Deal Overview)
- [+ New Deal] button → navigates to `/deals/new` (Create Deal)
- Column headers are sortable (click to toggle asc/desc)

**Table Columns:**

| Column | Source Field | Sortable | Notes |
|--------|-------------|----------|-------|
| Deal Name | `name` | Yes | Primary identifier, bold |
| Status | `status` | Yes | Color badge |
| Currency | from deal metadata | No | e.g., "USD" |
| Participants | count from API | No | Number |
| Created | `createdAt` | Yes | Formatted date |

**Empty State:** "No deals yet. Create your first deal to get started." + [Create Deal] CTA

---

### Screen 1.6: Create Deal

**Layout:** App Layout — Global Mode
**URL:** `/deals/new`

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Deals                                                        │
│                                                                 │
│  Create New Deal                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Deal Name *                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Description                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │                                                          │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  0/2000 characters                                              │
│                                                                 │
│  ┌─ Deal Details ──────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Status               Effective Date *                   │   │
│  │  ┌──────────────┐    ┌──────────────────┐               │   │
│  │  │ DRAFT    ▼   │    │ [Date Picker]    │               │   │
│  │  └──────────────┘    └──────────────────┘               │   │
│  │                                                          │   │
│  │  Termination Date                                        │   │
│  │  ┌──────────────────┐                                    │   │
│  │  │ [Date Picker]    │  (optional — leave empty for      │   │
│  │  └──────────────────┘   ongoing deals)                   │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Additional (optional, collapsible) ────────────────────┐   │
│  │  ▶ Metadata (JSON)                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│                                     [Cancel]  [Create Deal]     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Form Fields:**

| Field | Type | Required | Validation | API Field |
|-------|------|----------|------------|-----------|
| Deal Name | Text input | Yes | 1-255 chars | `name` |
| Description | Textarea | No | 0-2000 chars | `description` |
| Status | Dropdown | No | DRAFT (default), ACTIVE | `status` |
| Effective Date | Date picker | Yes | Valid date | `effectiveDate` |
| Termination Date | Date picker | No | Must be after Effective Date | `terminationDate` |
| Metadata | JSON editor (collapsible) | No | Valid JSON | `metadata` |

**API:** POST `/deals`

**Interactions:**
- [Cancel] → back to Deals List
- [Create Deal] → submit → on success navigate to the new Deal Overview with success toast "Deal created"
- Validation errors shown inline under each field

---

### Screen 1.7: Deal Overview

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/overview`

**Purpose:** Per-deal dashboard. This is the landing page when a user clicks into a deal. Shows deal summary stats and quick access to all deal sections.

```
┌─────────────────────────────────────────────────────────────────┐
│  The Last Horizon                          Status: 🟢 ACTIVE    │
│  Film deal — Created Feb 1, 2026                     [Edit Deal]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │     5      │ │     3      │ │   $200M    │ │     2      │  │
│  │Participants│ │  Rule      │ │  Total     │ │ Settlement │  │
│  │            │ │  Snapshots │ │  Revenue   │ │ Runs       │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
│                                                                 │
│  ┌─ Latest Settlement ─────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Run #2 — FINALIZED — Mar 5, 2026                       │   │
│  │  Total Revenue: $200,000,000 → Total Allocated: $200M   │   │
│  │  Rule Snapshot: v3  │  Revenue Batches: 2                │   │
│  │  Proof: sha256:a3f8b2...                                 │   │
│  │                                                          │   │
│  │  [View Details]                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Quick Actions ─────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  [+ New Revenue Batch]   [+ New Settlement Run]          │   │
│  │  [+ Add Participant]     [View Ledger]                   │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Recent Activity ───────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Mar 5   Settlement Run #2 finalized                     │   │
│  │  Mar 4   Revenue Batch RB-2026-003 validated             │   │
│  │  Mar 3   Rule Snapshot v3 created                        │   │
│  │  Mar 1   Participant "Sarah Chen" added                  │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources:**
- GET `/deals/:id` → deal name, description, status, dates
- GET `/deals/:dealId/participants` → participant count
- GET `/deals/:dealId/rule-snapshots` → snapshot count
- GET `/deals/:dealId/revenue-batches` → total revenue sum, batch count
- GET `/deals/:dealId/settlement-runs?limit=1&sortBy=createdAt&sortOrder=desc` → latest settlement

**Components:**
- Deal header (name, description, status badge, [Edit Deal] button)
- 4x Stat Cards (clickable — navigates to respective section)
- Latest Settlement Card (only shown if settlements exist)
- Quick Actions (4 buttons linking to create forms)
- Recent Activity timeline (derived from timestamps of entities)

**Empty State (new deal):**
- Stat cards all show 0
- Instead of Latest Settlement, show: "No settlements yet. Start by adding participants and creating rules."
- Quick Actions guide the user: "1. Add Participants → 2. Create Rules → 3. Submit Revenue → 4. Run Settlement"

---

### Screen 1.8: Edit Deal

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/edit`

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Deal Overview                                                │
│                                                                 │
│  Edit Deal                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Deal Name *                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ The Last Horizon                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Description                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ A major film production deal involving international     │   │
│  │ distribution and multiple investor groups.               │   │
│  └─────────────────────────────────────────────────────────┘   │
│  156/2000 characters                                            │
│                                                                 │
│  ┌─ Deal Details ──────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Status               Effective Date *                   │   │
│  │  ┌──────────────┐    ┌──────────────────┐               │   │
│  │  │ ACTIVE   ▼   │    │ Feb 1, 2026      │               │   │
│  │  └──────────────┘    └──────────────────┘               │   │
│  │                                                          │   │
│  │  Termination Date                                        │   │
│  │  ┌──────────────────┐                                    │   │
│  │  │                  │                                    │   │
│  │  └──────────────────┘                                    │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Additional ────────────────────────────────────────────┐   │
│  │  ▶ Metadata (JSON)                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│                                [Cancel]  [Save Changes]         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Same form as Create Deal but pre-filled with existing data.**

**Status Dropdown Options:** DRAFT, ACTIVE, SUSPENDED, CLOSED
- Changing to SUSPENDED or CLOSED should show a confirmation: "Are you sure? This will affect all ongoing work in this deal."

**Interactions:**
- [Cancel] → back to Deal Overview
- [Save Changes] → PATCH/PUT → on success navigate back to Deal Overview with success toast

---

## MS-2: Participants & Rules

**6 screens:** Participants List, Add Participant, Participant Detail, Rule Snapshots List, Rule Snapshot Detail, Create Rule Snapshot

---

### Screen 2.1: Participants List

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/participants`

```
┌─────────────────────────────────────────────────────────────────┐
│  Participants (5)                            [+ Add Participant]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Name                   │ Role              │ Email          │ Added       │
│  ──────────────────────────────────────────────────────────────  │
│  Zenith Pictures        │ 🔵 STUDIO         │ —              │ Feb 1, 2026 │
│  Global Cinema Partners │ 🟣 DISTRIBUTOR    │ gc@cinema.com  │ Feb 1, 2026 │
│  Horizon Ventures Fund  │ 🟢 INVESTOR       │ hv@fund.com    │ Feb 1, 2026 │
│  Pacific Capital Group  │ 🟢 INVESTOR       │ pc@capital.com │ Feb 2, 2026 │
│  Sarah Chen             │ 🟠 TALENT         │ sarah@chen.com │ Feb 3, 2026 │
│                                                                 │
│  ◄ 1 of 1 ►                                  Showing 1-5 of 5  │
└─────────────────────────────────────────────────────────────────┘
```

**Data Source:** GET `/deals/:dealId/participants`

**Table Columns:**

| Column | Source Field | Notes |
|--------|-------------|-------|
| Name | `name` | Bold, clickable → opens Participant Detail |
| Role | `role` | Color-coded badge (see Role Badge Colors) |
| Email | `email` | Show "—" if empty |
| Added | `createdAt` | Formatted date |

**Interactions:**
- [+ Add Participant] → opens Add Participant modal/drawer
- Click on row → opens Participant Detail drawer
- No edit/delete (participants are immutable reference data)

**Empty State:** "No participants yet. Add the parties involved in this deal." + [+ Add Participant] CTA

---

### Screen 2.2: Add Participant (Modal or Drawer)

**Type:** Modal (centered overlay) or right-side drawer
**Triggered from:** [+ Add Participant] button on Participants List

```
┌─────────────────────────────────────────────────┐
│  Add Participant                         [✕]     │
├─────────────────────────────────────────────────┤
│                                                  │
│  Name *                                          │
│  ┌──────────────────────────────────────────┐   │
│  │                                           │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  Role *                                          │
│  ┌──────────────────────────────────────────┐   │
│  │ Select role...                        ▼   │   │
│  └──────────────────────────────────────────┘   │
│  Options: Producer, Distributor, Investor,       │
│  Talent, Studio, Licensor, Licensee,             │
│  Collection Agent                                │
│                                                  │
│  Email                                           │
│  ┌──────────────────────────────────────────┐   │
│  │                                           │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  External ID                                     │
│  ┌──────────────────────────────────────────┐   │
│  │                                           │   │
│  └──────────────────────────────────────────┘   │
│  For linking to external systems (e.g., SAP ID)  │
│                                                  │
│  ▶ Additional Metadata (JSON)                    │
│                                                  │
│                     [Cancel]  [Add Participant]   │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Form Fields:**

| Field | Type | Required | Validation | API Field |
|-------|------|----------|------------|-----------|
| Name | Text input | Yes | 1-255 chars | `name` |
| Role | Dropdown select | Yes | One of 8 roles | `role` |
| Email | Email input | No | Valid email format | `email` |
| External ID | Text input | No | 0-100 chars | `externalId` |
| Metadata | JSON editor (collapsible) | No | Valid JSON | `metadata` |

**API:** POST `/deals/:dealId/participants`

**Interactions:**
- [Cancel] or [✕] → closes modal, no changes
- [Add Participant] → submit → on success: close modal, refresh participants list, show success toast "Participant added"
- Role dropdown should show the role name with its color dot preview

**Designer Notes:**
- The role dropdown items should show the colored badge next to each role name, so the user sees the color coding while selecting
- Email field: show helper text "Optional — for reference only"

---

### Screen 2.3: Participant Detail (Drawer)

**Type:** Right-side drawer (slides in from right)
**Triggered from:** Clicking a participant row in the list

```
┌─────────────────────────────────────────────────────┐
│  Participant Detail                          [✕]     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─ Profile ────────────────────────────────────┐   │
│  │                                               │   │
│  │  Horizon Ventures Fund                        │   │
│  │  🟢 INVESTOR                                  │   │
│  │                                               │   │
│  │  Email:       hv@fund.com                     │   │
│  │  External ID: HVF-001                         │   │
│  │  Added:       Feb 1, 2026                     │   │
│  │                                               │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ Payout Summary ─────────────────────────────┐   │
│  │                                               │   │
│  │  Total Received    $60,900,000                │   │
│  │  ──────────────────────────────               │   │
│  │  From Recoupment   $45,000,000                │   │
│  │  From Net Profit   $15,900,000                │   │
│  │                                               │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ Settlement History ─────────────────────────┐   │
│  │                                               │   │
│  │  Run  │ Status     │ Amount       │ Date      │   │
│  │  ─────────────────────────────────────────── │   │
│  │  #2   │ FINALIZED  │ $60,900,000  │ Mar 5     │   │
│  │  #1   │ FINALIZED  │ $22,700,000  │ Feb 15    │   │
│  │                                               │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│                              [View Full Ledger →]    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Data Sources:**
- Participant data from the list (already loaded)
- GET `/participants/:participantId/ledger` → payout summary and settlement history

**Components:**
- Profile card (name, role badge, email, external ID, date)
- Payout Summary (total, breakdown by type)
- Settlement History table (mini table showing each settlement's contribution)
- [View Full Ledger] link → navigates to Participant Statement (MS-5)

**Designer Notes:**
- If participant has no settlements yet, Payout Summary shows "$0" and Settlement History shows "No settlements yet"
- The drawer should be ~400px wide on desktop
- Clicking outside the drawer or pressing Esc closes it

---

### Screen 2.4: Rule Snapshots List

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/rules`

```
┌─────────────────────────────────────────────────────────────────┐
│  Rule Snapshots (3 versions)                [+ Create Snapshot]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Version │ Effective From  │ Effective To  │ Participants │ Status │
│  ──────────────────────────────────────────────────────────────  │
│  v3      │ Mar 1, 2026     │ — (current)   │ 5            │ 🟢 ACTIVE │
│  v2      │ Feb 15, 2026    │ Mar 1, 2026   │ 5            │ ⚫ CLOSED │
│  v1      │ Feb 1, 2026     │ Feb 15, 2026  │ 4            │ ⚫ CLOSED │
│                                                                 │
│  ℹ Rule snapshots are immutable. Once created, they cannot      │
│    be edited. Create a new version to change rules.             │
│                                                                 │
│  ◄ 1 of 1 ►                                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Data Source:** GET `/deals/:dealId/rule-snapshots`

**Table Columns:**

| Column | Source Field | Notes |
|--------|-------------|-------|
| Version | `version` | Prefixed with "v", bold. e.g., "v3" |
| Effective From | `effectiveFrom` | Formatted date |
| Effective To | `effectiveTo` | "— (current)" if null |
| Participants | `participantCount` | Number |
| Status | derived | ACTIVE if no effectiveTo, CLOSED if has effectiveTo |

**Interactions:**
- Each row clickable → navigates to Rule Snapshot Detail
- [+ Create Snapshot] → navigates to Create Rule Snapshot form
- Active row (current version) should be visually highlighted (subtle green background or green left border)
- Closed rows slightly muted

**Empty State:** "No rule snapshots yet. Define your first set of settlement rules." + [+ Create Snapshot] CTA

---

### Screen 2.5: Rule Snapshot Detail

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/rules/:snapshotId`

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Rules                                                        │
│                                                                 │
│  Rule Snapshot v3                              Status: 🟢 ACTIVE │
│  Effective: Mar 1, 2026 — Present                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Rule Summary ──────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Total Participants: 5                                   │   │
│  │                                                          │   │
│  │  Role Breakdown:                                         │   │
│  │  🔵 STUDIO (1)  🟣 DISTRIBUTOR (1)  🟢 INVESTOR (2)     │   │
│  │  🟠 TALENT (1)                                           │   │
│  │                                                          │   │
│  │  Distribution Fee: 12% off the top                       │   │
│  │  Total Recoupment Cap: $70,000,000                       │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Net Profit Split (visual) ─────────────────────────────┐   │
│  │                                                          │   │
│  │  Zenith Pictures        ████████████████████████  65%    │   │
│  │  Horizon Ventures Fund  ████████                 15%    │   │
│  │  Pacific Capital Group  ██████                   12%    │   │
│  │  Sarah Chen             ████                      8%    │   │
│  │  ─────────────────────────────────────────── 100% ✓     │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Participant Terms (frozen) ────────────────────────────┐   │
│  │                                                          │   │
│  │  Name                  │ Role        │ Fee % │ Recoup Cap  │ Priority │ Net % │
│  │  ──────────────────────────────────────────────────────────────────────────── │
│  │  Zenith Pictures       │ STUDIO      │ —     │ —           │ —        │ 65%   │
│  │  Global Cinema Partners│ DISTRIBUTOR │ 12%   │ —           │ —        │ —     │
│  │  Horizon Ventures Fund │ INVESTOR    │ —     │ $45,000,000 │ 1        │ 15%   │
│  │  Pacific Capital Group │ INVESTOR    │ —     │ $25,000,000 │ 2        │ 12%   │
│  │  Sarah Chen            │ TALENT      │ —     │ —           │ —        │ 8%    │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Notes ─────────────────────────────────────────────────┐   │
│  │ Updated profit splits after Pacific Capital Group joined │   │
│  │ as second investor. Sarah Chen's net profit reduced      │   │
│  │ from 10% to 8%.                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Warnings ──────────────────────────────────────────────┐   │
│  │  ✓ No warnings                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Raw Rules JSON (collapsible) ──────────────────────────┐   │
│  │  ▶ Click to expand                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Source:** GET `/rule-snapshots/:id` → includes `ruleSummary`, `participants`, `rules`

**Components:**
1. **Header:** Version, status badge, effective date range
2. **Rule Summary Card:** Total participants, role breakdown (colored badges), distribution fee %, total recoupment cap
3. **Net Profit Split Bar Chart:** Horizontal stacked bars showing each participant's share. Must total 100%. Show checkmark if valid.
4. **Participant Terms Table:** Frozen data from snapshot. Columns show role-specific fields (Fee % for distributors, Recoup Cap + Priority for investors, Net % for profit participants)
5. **Notes:** Free text from snapshot creation
6. **Warnings:** From `ruleSummary.warnings[]`. Show green checkmark if none.
7. **Raw JSON Viewer:** Collapsible accordion showing the raw `rules` JSON. Syntax-highlighted if possible.

**Designer Notes:**
- The profit split bar chart is the visual centerpiece — make it visually clear and proportional
- Use the role badge colors in the bar chart segments
- Table cells with "—" should be muted/gray to reduce visual noise
- This page is read-only (no actions) — it's an immutable record

---

### Screen 2.6: Create Rule Snapshot (Multi-step Form)

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/rules/new`

**This is the most complex form in the portal. It has 3 steps.**

#### Step 1 of 3: Basic Settings

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Rules                                                        │
│                                                                 │
│  Create Rule Snapshot                             Step 1 of 3   │
│  ─────────────── ○ ─ ─ ─ ─ ○ ─ ─ ─ ─ ○                        │
│                 1           2           3                        │
│               Basic      Participant   Review                   │
│              Settings      Rules                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Effective From *                                               │
│  ┌──────────────────────────────┐                               │
│  │ [Date Picker — today]        │                               │
│  └──────────────────────────────┘                               │
│  This snapshot takes effect from this date.                     │
│  The previous snapshot (if any) will be closed automatically.   │
│                                                                 │
│  Notes                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Optional — describe what changed in this version               │
│                                                                 │
│                                          [Cancel]  [Next →]     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 2 of 3: Participant Rules

```
┌─────────────────────────────────────────────────────────────────┐
│  Create Rule Snapshot                             Step 2 of 3   │
│  ─ ─ ─ ─ ─ ─ ─ ● ─ ─ ─ ─ ○ ─ ─ ─ ─ ○                        │
│                 1           2           3                        │
│                           Participant                           │
│                             Rules                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Define rules for each participant.                             │
│  Select participants and assign their settlement terms.         │
│                                                                 │
│  ┌─ Select Participants ───────────────────────────────────┐   │
│  │  [Select All]  [Clear All]                               │   │
│  │                                                          │   │
│  │  ☑ Zenith Pictures (🔵 STUDIO)                           │   │
│  │  ┌────────────────────────────────────────────────┐     │   │
│  │  │  Net Profit %:  [  65  ]                        │     │   │
│  │  └────────────────────────────────────────────────┘     │   │
│  │                                                          │   │
│  │  ☑ Global Cinema Partners (🟣 DISTRIBUTOR)               │   │
│  │  ┌────────────────────────────────────────────────┐     │   │
│  │  │  Distribution Fee %:  [  12  ]                  │     │   │
│  │  └────────────────────────────────────────────────┘     │   │
│  │                                                          │   │
│  │  ☑ Horizon Ventures Fund (🟢 INVESTOR)                   │   │
│  │  ┌────────────────────────────────────────────────┐     │   │
│  │  │  Recoupment Cap:  [$ 45,000,000 ]               │     │   │
│  │  │  Priority:        [  1  ]                       │     │   │
│  │  │  Net Profit %:    [  15  ]                      │     │   │
│  │  └────────────────────────────────────────────────┘     │   │
│  │                                                          │   │
│  │  ☑ Pacific Capital Group (🟢 INVESTOR)                   │   │
│  │  ┌────────────────────────────────────────────────┐     │   │
│  │  │  Recoupment Cap:  [$ 25,000,000 ]               │     │   │
│  │  │  Priority:        [  2  ]                       │     │   │
│  │  │  Net Profit %:    [  12  ]                      │     │   │
│  │  └────────────────────────────────────────────────┘     │   │
│  │                                                          │   │
│  │  ☑ Sarah Chen (🟠 TALENT)                                │   │
│  │  ┌────────────────────────────────────────────────┐     │   │
│  │  │  Net Profit %:  [  8  ]                         │     │   │
│  │  └────────────────────────────────────────────────┘     │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Running Totals (sticky footer or fixed bar) ───────────┐   │
│  │                                                          │   │
│  │  Net Profit Total: 100% ✓     Distribution Fee: 12%     │   │
│  │  Total Recoupment Cap: $70,000,000                       │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│                                     [← Back]  [Next →]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Role-specific fields (shown dynamically based on participant role):**

| Role | Fields Shown |
|------|-------------|
| DISTRIBUTOR | Distribution Fee % |
| INVESTOR | Recoupment Cap ($), Priority (number), Net Profit % |
| STUDIO, PRODUCER, TALENT, LICENSOR, LICENSEE | Net Profit % |
| COLLECTION_AGENT | Distribution Fee % |

**Live Validation:**
- Net Profit % running total (sum of all selected participants with Net Profit %)
  - Green checkmark at 100%
  - Yellow warning at < 100% ("Under-allocated by X%")
  - Red error at > 100% ("Over-allocated by X% — must equal 100%")
- Distribution Fee must be 0-100%
- Recoupment Cap must be > 0
- Priority must be positive integer, unique among investors
- At least 1 participant must be selected

**Designer Notes:**
- The running totals bar should be sticky/fixed at the bottom so it's always visible while scrolling
- Unchecked participants collapse to just the checkbox + name (fields hidden)
- Checked participants expand to show their rule fields
- The profit total indicator is the most important validation — make it visually prominent

#### Step 3 of 3: Review & Confirm

```
┌─────────────────────────────────────────────────────────────────┐
│  Create Rule Snapshot                             Step 3 of 3   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ●                     │
│                 1           2           3                        │
│                                       Review                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ ⚠ Warning ────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Once created, this rule snapshot is PERMANENTLY          │   │
│  │  IMMUTABLE. It cannot be edited or deleted.              │   │
│  │  To change rules, you must create a new version.         │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Preview ───────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  [Same layout as Rule Snapshot Detail — Screen 2.5]      │   │
│  │  Shows: Rule Summary, Profit Split Chart,                │   │
│  │         Participant Terms Table                           │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│                              [← Back]  [Create Snapshot ✓]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**API:** POST `/deals/:dealId/rule-snapshots`

**Request body structure:**
```json
{
  "effectiveFrom": "2026-03-01",
  "rules": {
    "currency": "USD",
    "allocationRules": [...],
    "additionalParams": {}
  },
  "participants": [
    { "participantId": "uuid", "participantData": { "feePercent": 12 } },
    ...
  ],
  "notes": "Updated profit splits..."
}
```

**On Success:** Navigate to the new Rule Snapshot Detail page with success toast "Rule Snapshot v3 created"

**Designer Notes:**
- Step indicator (progress dots/line) at top shows current step
- Steps should be clickable to go back (but not forward past current)
- On Step 3, the [Create Snapshot] button should feel "final" — consider a different color or icon to emphasize permanence
- The warning banner on Step 3 is important — use amber/yellow with warning icon

---

## MS-3: Revenue & Documents

**5 screens:** Revenue Batches List, Revenue Batch Detail, Create Revenue Batch, Documents List, Upload Document

---

### Screen 3.1: Revenue Batches List

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/revenue`

```
┌─────────────────────────────────────────────────────────────────┐
│  Revenue Batches (4)                                [+ New Batch] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [All (4)]  [Pending (1)]  [Validated (1)]  [Processed (2)]    │
│                                                                 │
│  Batch #      │ Period        │ Amount       │ Currency │ Status     │
│  ──────────────────────────────────────────────────────────────  │
│  RB-2026-004  │ Oct–Dec 2026  │ $50,000,000  │ USD      │ 🟡 PENDING  │
│  RB-2026-003  │ Jul–Sep 2026  │ $75,000,000  │ USD      │ 🟢 VALIDATED│
│  RB-2026-002  │ Apr–Jun 2026  │ $50,000,000  │ USD      │ 🔵 PROCESSED│
│  RB-2026-001  │ Jan–Mar 2026  │ $25,000,000  │ USD      │ 🔵 PROCESSED│
│                                                                 │
│  ┌─ Summary ───────────────────────────────────────────────┐   │
│  │  Total Revenue: $200,000,000                             │   │
│  │  Pending: $50M  │  Validated: $75M  │  Processed: $100M  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ◄ 1 of 1 ►                                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Data Source:** GET `/deals/:dealId/revenue-batches` with optional `status` filter

**Table Columns:**

| Column | Source Field | Notes |
|--------|-------------|-------|
| Batch # | `batchNumber` | Auto-generated, e.g., "RB-2026-004" |
| Period | `periodStart` + `periodEnd` | Formatted as "Oct–Dec 2026" |
| Amount | `totalAmount` | Currency-formatted |
| Currency | `currency` | e.g., "USD" |
| Status | `status` | Color badge |

**Status Filter Tabs:** All, Pending, Validated, Processed, Rejected
- Tab shows count in parentheses
- Rejected tab only appears if there are rejected batches

**Interactions:**
- Each row clickable → navigates to Revenue Batch Detail
- [+ New Batch] → navigates to Create Revenue Batch
- Status tabs filter the table

**Summary Bar:** Shows total revenue and breakdown by status. Positioned below the table.

**Empty State:** "No revenue batches yet. Submit your first revenue to start the settlement process." + [+ New Batch] CTA

---

### Screen 3.2: Revenue Batch Detail

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/revenue/:batchId`

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Revenue Batches                                              │
│                                                                 │
│  RB-2026-004                                Status: 🟡 PENDING  │
│  Created: Mar 8, 2026                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Batch Details ─────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Amount          $50,000,000                             │   │
│  │  Currency        USD                                     │   │
│  │  Period          Oct 1, 2026 — Dec 31, 2026              │   │
│  │  Source          Q4 2026 Streaming Revenue — Netflix +   │   │
│  │                  Disney+                                 │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Metadata ──────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Line Items:                                             │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ Netflix Streaming       $30,000,000              │   │   │
│  │  │ Disney+ Licensing       $15,000,000              │   │   │
│  │  │ Merchandise              $5,000,000              │   │   │
│  │  │ ────────────────────────────────────             │   │   │
│  │  │ Total                   $50,000,000              │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Linked Documents ──────────────────────────────────────┐   │
│  │                                                          │   │
│  │  File Name              │ Type           │ Size          │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  netflix_q4_report.pdf  │ REVENUE_REPORT │ 2.3 MB        │   │
│  │  disney_license_stmt.pdf│ REVENUE_REPORT │ 1.1 MB        │   │
│  │                                                          │   │
│  │  [+ Upload Document]                                     │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Actions ───────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  [✓ Validate Batch]          [✗ Reject Batch]            │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources:**
- GET `/revenue-batches/:id` → batch details
- GET `/revenue-batches/:revenueBatchId/documents` → linked documents

**Action Buttons (conditional by status):**

| Status | Actions Shown |
|--------|--------------|
| PENDING | [Validate Batch] (green) + [Reject Batch] (red outline) |
| VALIDATED | [Reject Batch] (red outline) only |
| PROCESSED | No actions — show info: "This batch has been used in a finalized settlement and is locked." |
| REJECTED | No actions — show info: "This batch was rejected." + show rejection reason |

**Validate Confirmation Modal:**

```
┌───────────────────────────────────────────┐
│  Validate Revenue Batch?                   │
│                                            │
│  Batch:   RB-2026-004                      │
│  Amount:  $50,000,000                      │
│                                            │
│  Validation Notes (optional):              │
│  ┌────────────────────────────────────┐   │
│  │                                     │   │
│  └────────────────────────────────────┘   │
│                                            │
│  This batch will become eligible for       │
│  use in settlement runs.                   │
│                                            │
│              [Cancel]  [Confirm Validate]   │
└───────────────────────────────────────────┘
```

**Reject Confirmation Modal:**

```
┌───────────────────────────────────────────┐
│  Reject Revenue Batch?                     │
│                                            │
│  Batch:   RB-2026-004                      │
│  Amount:  $50,000,000                      │
│                                            │
│  Rejection Reason *:                       │
│  ┌────────────────────────────────────┐   │
│  │                                     │   │
│  └────────────────────────────────────┘   │
│  Required — explain why this batch is      │
│  being rejected.                           │
│                                            │
│              [Cancel]  [Confirm Reject]     │
└───────────────────────────────────────────┘
```

**API calls:**
- Validate: PATCH `/revenue-batches/:id/validate` body: `{ validationNotes?: "..." }`
- Reject: PATCH `/revenue-batches/:id/reject` body: `{ rejectionReason: "..." }`

---

### Screen 3.3: Create Revenue Batch

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/revenue/new`

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Revenue Batches                                              │
│                                                                 │
│  New Revenue Batch                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Total Amount *                                                 │
│  ┌──────────────────────────────┐                               │
│  │ $                             │                               │
│  └──────────────────────────────┘                               │
│                                                                 │
│  Currency *                                                     │
│  ┌──────────────────────────────┐                               │
│  │ USD                       ▼  │                               │
│  └──────────────────────────────┘                               │
│                                                                 │
│  ┌─ Reporting Period ──────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Period Start *             Period End *                  │   │
│  │  ┌──────────────────┐     ┌──────────────────┐          │   │
│  │  │ [Date Picker]    │     │ [Date Picker]    │          │   │
│  │  └──────────────────┘     └──────────────────┘          │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Source                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ e.g., "Q4 2026 Netflix Revenue"                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Where this revenue comes from (for reference)                  │
│                                                                 │
│  ┌─ Line Items (optional) ─────────────────────────────────┐   │
│  │  ▼ Expand                                                │   │
│  │                                                          │   │
│  │  Platform/Source       Amount                            │   │
│  │  ┌─────────────────┐ ┌──────────────┐  [✕]             │   │
│  │  │ Netflix          │ │ $30,000,000  │                   │   │
│  │  └─────────────────┘ └──────────────┘                   │   │
│  │  ┌─────────────────┐ ┌──────────────┐  [✕]             │   │
│  │  │ Disney+          │ │ $15,000,000  │                   │   │
│  │  └─────────────────┘ └──────────────┘                   │   │
│  │                                                          │   │
│  │  [+ Add Line Item]                                       │   │
│  │                                                          │   │
│  │  Line Items Total: $45,000,000                           │   │
│  │  ⚠ Does not match Total Amount ($50,000,000)             │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│                                  [Cancel]  [Create Batch]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Form Fields:**

| Field | Type | Required | Validation | API Field |
|-------|------|----------|------------|-----------|
| Total Amount | Currency input | Yes | >= 0 | `totalAmount` |
| Currency | Dropdown | Yes | USD, EUR, GBP, JPY, CHF, CAD, AUD | `currency` |
| Period Start | Date picker | Yes | Valid date | `periodStart` |
| Period End | Date picker | Yes | After Period Start | `periodEnd` |
| Source | Text input | No | 0-255 chars | `source` |
| Line Items | Repeatable row group | No | Valid JSON | `metadata.lineItems` |

**API:** POST `/deals/:dealId/revenue-batches`

**Live Validation:**
- Period End must be after Period Start (show error immediately)
- If line items are added, show running total and warn if it doesn't match Total Amount (non-blocking warning, not a hard error)
- Amount must be >= 0

**Interactions:**
- [+ Add Line Item] → adds a new row (platform text + amount number)
- [✕] next to each line item → removes it
- [Cancel] → back to Revenue Batches List
- [Create Batch] → submit → on success navigate to the new batch detail with toast "Revenue batch created"
- Batch is created with status PENDING

---

### Screen 3.4: Documents List

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/documents`

```
┌─────────────────────────────────────────────────────────────────┐
│  Documents (6)                                       [+ Upload]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [All (6)] [Contracts (2)] [Revenue Reports (2)]                │
│  [Settlement Reports (1)] [Other (1)]                           │
│                                                                 │
│  File Name               │ Type              │ Linked To     │ Size  │ Uploaded   │
│  ──────────────────────────────────────────────────────────────────────────────── │
│  deal_contract_v1.pdf    │ CONTRACT          │ Deal          │ 5.2MB │ Feb 1      │
│  amendment_01.pdf        │ AMENDMENT         │ Deal          │ 1.1MB │ Feb 15     │
│  netflix_q4_report.pdf   │ REVENUE_REPORT    │ RB-2026-004   │ 2.3MB │ Mar 8      │
│  disney_license.pdf      │ REVENUE_REPORT    │ RB-2026-004   │ 1.1MB │ Mar 8      │
│  settlement_run2.pdf     │ SETTLEMENT_REPORT │ Run #2        │ 3.0MB │ Mar 5      │
│  audit_proof.pdf         │ AUDIT_REPORT      │ Run #2        │ 0.5MB │ Mar 6      │
│                                                                 │
│  ◄ 1 of 1 ►                                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Data Source:** GET `/deals/:dealId/documents` with optional `docType` filter

**Table Columns:**

| Column | Source Field | Notes |
|--------|-------------|-------|
| File Name | `fileName` | Truncate if too long, show full on hover |
| Type | `docType` | Badge-style label |
| Linked To | `revenueBatchId` / `settlementRunId` / deal | "Deal" if no batch/run link; show batch # or run # if linked |
| Size | `fileSize` | Formatted: KB, MB |
| Uploaded | `uploadedAt` | Formatted date |

**Document Type Filter Tabs:** All, Contracts, Revenue Reports, Settlement Reports, Audit Reports, Other

**Interactions:**
- [+ Upload] → opens Upload Document modal
- Row click → could download the file or show a detail modal
- Delete action: Show a delete icon on hover (only for documents not linked to finalized settlements)

**Empty State:** "No documents uploaded yet. Attach contracts, revenue reports, and other supporting files." + [+ Upload] CTA

---

### Screen 3.5: Upload Document (Modal)

**Type:** Modal overlay
**Triggered from:** [+ Upload] button on Documents List (or from Revenue Batch Detail)

```
┌─────────────────────────────────────────────────────┐
│  Upload Document                              [✕]    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─ Drop Zone ──────────────────────────────────┐   │
│  │                                               │   │
│  │       📄 Drag & drop a file here              │   │
│  │          or [Browse Files]                    │   │
│  │                                               │   │
│  │       Max 50MB. PDF, DOC, DOCX, XLS,         │   │
│  │       XLSX, CSV, PNG, JPG                     │   │
│  │                                               │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  (After file selected:)                              │
│  ┌───────────────────────────────────────────────┐   │
│  │  📄 netflix_q4_report.pdf  2.3 MB     [✕]    │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  Document Type *                                     │
│  ┌──────────────────────────────────────────┐       │
│  │ Select type...                        ▼   │       │
│  └──────────────────────────────────────────┘       │
│  Options: Contract, Amendment, Revenue Report,       │
│  Settlement Report, Audit Report, Proof Record,      │
│  Other                                               │
│                                                      │
│  Link To (optional)                                  │
│  ┌──────────────────────────────────────────┐       │
│  │ None (deal-level document)            ▼   │       │
│  └──────────────────────────────────────────┘       │
│  Options: None, Revenue Batch (dropdown),            │
│  Settlement Run (dropdown)                           │
│                                                      │
│                       [Cancel]  [Upload Document]    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Form Fields:**

| Field | Type | Required | Validation | API Field |
|-------|------|----------|------------|-----------|
| File | File upload / drag-drop | Yes | Max 50MB, allowed types | `file` (multipart) |
| Document Type | Dropdown | Yes | One of 7 types | `docType` |
| Link To | Dropdown | No | Valid batch or run ID | `revenueBatchId` or `settlementRunId` |

**API:** POST `/deals/:dealId/documents` (multipart/form-data)

**Interactions:**
- Drag & drop zone highlights on dragover
- After file selected, show file name + size + remove button
- Upload progress bar during submission
- On success: close modal, refresh documents list, show toast "Document uploaded"
- If file too large: inline error "File exceeds 50MB limit"

**Designer Notes:**
- The "Link To" dropdown should be contextual: if opened from a Revenue Batch Detail page, pre-select that batch
- Show a preview/thumbnail for image files (PNG, JPG) if possible

---

## MS-4: Settlement Core

**8 screens:** All Settlements, Pending Reviews, Settlement Runs List, Settlement Run Detail, Create Settlement Run, Create Correction Run, Correction Detail, Settlement Comparison

---

### Screen 4.1: All Settlements (Cross-deal View)

**Layout:** App Layout — Global Mode (sidebar shows Dashboard, Deals)
**URL:** `/settlements`

**Purpose:** View every settlement across ALL deals in one place. This is a global view, not scoped to a single deal.

```
┌─────────────────────────────────────────────────────────────────┐
│  All Settlements                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [All]  [Draft]  [Previewed]  [Finalized]  [Voided]            │
│                                                                 │
│  ┌─ Filters ───────────────────────────────────────────────┐   │
│  │  Deal: [All Deals ▼]    Type: [All ▼]    🔍 Search      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Deal               │ Run # │ Type       │ Rule │ Total Allocated │ Status      │ Date       │
│  ──────────────────────────────────────────────────────────────────────────────────────────── │
│  The Last Horizon   │ #3    │ 🟣CORRECTION│ v3   │ $5,000,000      │ 🟢FINALIZED │ Mar 10     │
│  The Last Horizon   │ #2    │ NORMAL      │ v3   │ $200,000,000    │ 🟢FINALIZED │ Mar 5      │
│  Midnight Express   │ #1    │ NORMAL      │ v2   │ $45,000,000     │ 🟡PREVIEWED │ Mar 3      │
│  The Last Horizon   │ #1    │ NORMAL      │ v1   │ —               │ ⚪DRAFT     │ Feb 15     │
│  Ocean Protocol     │ #2    │ NORMAL      │ v1   │ $80,000,000     │ 🟢FINALIZED │ Feb 10     │
│  Ocean Protocol     │ #1    │ NORMAL      │ v1   │ $30,000,000     │ 🟢FINALIZED │ Jan 20     │
│                                                                 │
│  ◄ 1  2  ►                              Showing 1-10 of 15     │
└─────────────────────────────────────────────────────────────────┘
```

**Data Source:** Aggregated from GET `/deals/:dealId/settlement-runs` for each deal, or a dedicated cross-deal endpoint if available.

**Table Columns:**

| Column | Source | Notes |
|--------|--------|-------|
| Deal | `deal.name` | Clickable → Deal Overview |
| Run # | sequential per deal | e.g., "#3" |
| Type | `runType` | NORMAL or CORRECTION (purple badge) |
| Rule | `ruleSnapshot.version` | e.g., "v3" |
| Total Allocated | `totalAllocated` | Currency-formatted. "—" if DRAFT |
| Status | `status` | Color badge |
| Date | `createdAt` | Formatted date |

**Filters:**
- Status tabs (All / Draft / Previewed / Finalized / Voided)
- Deal dropdown (filter by specific deal)
- Type dropdown (All / Normal / Correction)

**Interactions:**
- Click on a row → navigates to Settlement Run Detail within that deal's context
- Correction runs show a visual link indicator (e.g., "↳ correction of #2")

**Designer Notes:**
- This is a global navigation item alongside "Dashboard" and "Deals" in the sidebar
- Correction rows could be slightly indented or have an arrow icon showing the relationship

---

### Screen 4.2: Pending Reviews (Action Queue)

**Layout:** App Layout — Global Mode
**URL:** `/pending-reviews`

**Purpose:** One page showing everything that needs human action: revenue batches waiting for validation + settlements waiting for finalization.

```
┌─────────────────────────────────────────────────────────────────┐
│  Pending Reviews                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Revenue Batches Awaiting Validation (3) ───────────────┐   │
│  │                                                          │   │
│  │  Deal              │ Batch #     │ Amount      │ Period          │ Submitted  │
│  │  ──────────────────────────────────────────────────────────────────────────  │
│  │  The Last Horizon  │ RB-2026-004 │ $50,000,000 │ Oct–Dec 2026    │ Mar 8      │
│  │  Midnight Express  │ RB-2026-007 │ $12,000,000 │ Jan–Mar 2026    │ Mar 6      │
│  │  Ocean Protocol    │ RB-2026-010 │ $8,500,000  │ Q4 2025         │ Mar 1      │
│  │                                                          │   │
│  │  Click a row to review and validate/reject               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Settlements Awaiting Finalization (2) ─────────────────┐   │
│  │                                                          │   │
│  │  Deal              │ Run # │ Type   │ Total Allocated │ Previewed On  │
│  │  ──────────────────────────────────────────────────────────────────── │
│  │  Midnight Express  │ #1    │ NORMAL │ $45,000,000     │ Mar 3          │
│  │  The Last Horizon  │ #4    │ NORMAL │ $125,000,000    │ Mar 9          │
│  │                                                          │   │
│  │  Click a row to review and finalize                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ All Clear ─────────────────────────────────────────────┐   │
│  │  (shown when both lists are empty)                       │   │
│  │                                                          │   │
│  │  ✓ All caught up! No items need your attention.          │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources:**
- Revenue batches: Aggregate GET `/deals/:dealId/revenue-batches?status=PENDING` across all deals
- Settlement runs: Aggregate GET `/deals/:dealId/settlement-runs?status=PREVIEWED` across all deals

**Two sections, each with its own table:**

**Section 1: Revenue Batches Awaiting Validation**
| Column | Notes |
|--------|-------|
| Deal | Deal name (clickable → Deal Overview) |
| Batch # | Auto-generated batch number |
| Amount | Currency-formatted |
| Period | Formatted date range |
| Submitted | `createdAt` |

**Section 2: Settlements Awaiting Finalization**
| Column | Notes |
|--------|-------|
| Deal | Deal name |
| Run # | Settlement run number |
| Type | NORMAL or CORRECTION |
| Total Allocated | Currency-formatted |
| Previewed On | Date of last preview |

**Interactions:**
- Click revenue batch row → navigates to that batch's Revenue Batch Detail
- Click settlement row → navigates to that run's Settlement Run Detail
- Both navigations go into the deal context (sidebar switches to deal mode)

**Designer Notes:**
- This is a global navigation item — appears in the sidebar as "Pending Reviews" with a count badge (e.g., "Pending Reviews (5)")
- The count badge in the sidebar should update dynamically
- Each section header shows count: "Revenue Batches Awaiting Validation (3)"
- Empty state per section: "No revenue batches pending" / "No settlements pending"
- Both empty: Show the "All caught up" message with checkmark icon

---

### Screen 4.3: Settlement Runs List (Per-deal)

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/settlement`

```
┌─────────────────────────────────────────────────────────────────┐
│  Settlement Runs (3)                          [+ New Settlement]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [All (3)]  [Draft (0)]  [Previewed (1)]  [Finalized (2)]      │
│                                                                 │
│  #  │ Type        │ Rule  │ Batches │ Total Allocated  │ Status      │ Date       │
│  ─────────────────────────────────────────────────────────────────────────────── │
│  3  │ 🟣CORRECTION │ v3   │ 1       │ $5,000,000       │ 🟢FINALIZED │ Mar 10     │
│  2  │ NORMAL       │ v3   │ 2       │ $200,000,000     │ 🟢FINALIZED │ Mar 5      │
│  1  │ NORMAL       │ v1   │ 1       │ —                │ 🟡PREVIEWED │ Feb 15     │
│                                                                 │
│  ℹ Run #3 is a correction of Run #2                             │
│                                                                 │
│  ◄ 1 of 1 ►                                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Data Source:** GET `/deals/:dealId/settlement-runs` with optional `status` and `runType` filters

**Table Columns:**

| Column | Source Field | Notes |
|--------|-------------|-------|
| # | sequential | Run number within this deal |
| Type | `runType` | NORMAL or CORRECTION (purple badge) |
| Rule | `ruleSnapshot.version` | "v3" |
| Batches | count of linked revenue batches | Number |
| Total Allocated | `totalAllocated` | "—" if DRAFT (not yet computed) |
| Status | `status` | Color badge |
| Date | `createdAt` | Formatted date |

**Correction Link:** When a run has `originalSettlementRunId`, show a note below the table or inline: "Run #3 is a correction of Run #2" with a link.

**Interactions:**
- Each row clickable → Settlement Run Detail
- [+ New Settlement] → Create Settlement Run
- Status tabs filter the list

**Empty State:** "No settlements yet. Create your first settlement run after adding rules and revenue." + [+ New Settlement] CTA (disabled if no rules or validated revenue exist)

---

### Screen 4.4: Settlement Run Detail

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/settlement/:runId`

**Purpose:** THE core screen. Shows the full waterfall computation, proof, and actions.

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Settlement Runs                                              │
│                                                                 │
│  Settlement Run #2                         Status: 🟢 FINALIZED  │
│  Type: NORMAL  │  Rule: v3  │  Created: Mar 5, 2026             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Summary ───────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│   │
│  │  │  $200M   │  │  $200M   │  │   USD    │  │    2    ││   │
│  │  │  Total   │  │  Total   │  │ Currency │  │ Revenue ││   │
│  │  │  Revenue │  │ Allocated│  │          │  │ Batches ││   │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘│   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Revenue Batches Included ──────────────────────────────┐   │
│  │  RB-2026-002 │ $50,000,000  │ Apr–Jun 2026              │   │
│  │  RB-2026-003 │ $75,000,000  │ Jul–Sep 2026              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ═══════════════════════════════════════════════════════════    │
│  WATERFALL BREAKDOWN                                            │
│  ═══════════════════════════════════════════════════════════    │
│                                                                 │
│  ┌─ Phase 1: Gross Receipts ───────────────────────────────┐   │
│  │                                                          │   │
│  │  Total Gross Revenue                     $200,000,000    │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│          │                                                      │
│          ▼                                                      │
│  ┌─ Phase 2: Distribution Fees ────────────────────────────┐   │
│  │                                                          │   │
│  │  Global Cinema Partners     12%          $24,000,000     │   │
│  │  ────────────────────────────────────────────────────── │   │
│  │  Remaining after fees                    $176,000,000    │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│          │                                                      │
│          ▼                                                      │
│  ┌─ Phase 3: Recoupment ───────────────────────────────────┐   │
│  │                                                          │   │
│  │  Horizon Ventures Fund                                   │   │
│  │    Cap: $45,000,000   Recouped: $45,000,000    ✓ Full   │   │
│  │    ████████████████████████████████████████ 100%          │   │
│  │                                                          │   │
│  │  Pacific Capital Group                                   │   │
│  │    Cap: $25,000,000   Recouped: $25,000,000    ✓ Full   │   │
│  │    ████████████████████████████████████████ 100%          │   │
│  │  ────────────────────────────────────────────────────── │   │
│  │  Total Recouped: $70,000,000                             │   │
│  │  Remaining after recoupment              $106,000,000    │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│          │                                                      │
│          ▼                                                      │
│  ┌─ Phase 4: Net Profit Split ─────────────────────────────┐   │
│  │                                                          │   │
│  │  Zenith Pictures           65%           $68,900,000     │   │
│  │  Horizon Ventures Fund     15%           $15,900,000     │   │
│  │  Pacific Capital Group     12%           $12,720,000     │   │
│  │  Sarah Chen                 8%            $8,480,000     │   │
│  │  ────────────────────────────────────────────────────── │   │
│  │  Total Net Profit                        $106,000,000    │   │
│  │  Remaining                                        $0     │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ═══════════════════════════════════════════════════════════    │
│  TOTAL PAYOUT SUMMARY                                           │
│  ═══════════════════════════════════════════════════════════    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  Participant          │ Dist Fee    │ Recoup     │ Net Profit  │ Total        │
│  │  ─────────────────────────────────────────────────────────────────────────  │
│  │  Global Cinema        │ $24,000,000 │ —          │ —           │ $24,000,000  │
│  │  Horizon Ventures     │ —           │ $45,000,000│ $15,900,000 │ $60,900,000  │
│  │  Pacific Capital      │ —           │ $25,000,000│ $12,720,000 │ $37,720,000  │
│  │  Zenith Pictures      │ —           │ —          │ $68,900,000 │ $68,900,000  │
│  │  Sarah Chen           │ —           │ —          │ $8,480,000  │ $8,480,000   │
│  │  ─────────────────────────────────────────────────────────────────────────  │
│  │  TOTAL                │ $24,000,000 │ $70,000,000│$106,000,000 │$200,000,000  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Proof ─────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Hash:       sha256:a3f8b2c9d1e4f567890abcdef...        │   │
│  │  Algorithm:  SHA-256                                     │   │
│  │  Timestamp:  Mar 5, 2026 2:30:00 PM UTC                  │   │
│  │  Input:      Rule v3 × 2 batches × 5 participants       │   │
│  │                                                          │   │
│  │  [📋 Copy Hash]    [🔍 Verify Integrity]                 │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Actions ───────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  [Create Correction Run]    [View Ledger]                │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Source:** GET `/settlement-runs/:id` → full detail with allocations, proof, revenue batches

**Action Buttons (conditional by status):**

| Status | Actions |
|--------|---------|
| DRAFT | [Preview Settlement] — primary blue button |
| PREVIEWED | [Finalize Settlement] — primary green button with lock icon. [Re-Preview] — secondary |
| FINALIZED | [Create Correction Run] — secondary. [View Ledger] — link |
| VOIDED | No actions. Show info: "This settlement has been voided." |

**Waterfall Section Visibility:**
- DRAFT: Only Summary and Revenue Batches shown. Waterfall hidden. Message: "Click Preview to compute the waterfall breakdown."
- PREVIEWED / FINALIZED: Full waterfall shown.

**Finalize Confirmation Modal:**

```
┌───────────────────────────────────────────────┐
│  ⚠ Finalize Settlement?                       │
│                                                │
│  This action is IRREVERSIBLE.                  │
│                                                │
│  What happens:                                 │
│  • Allocations will be permanently locked      │
│  • Ledger entries will be created              │
│  • Revenue batches will be marked PROCESSED    │
│  • Proof record will be generated              │
│                                                │
│  Total Allocated: $200,000,000                 │
│  Participants: 5                               │
│                                                │
│  Type FINALIZE to confirm:                     │
│  ┌──────────────────────────────┐              │
│  │                               │              │
│  └──────────────────────────────┘              │
│                                                │
│              [Cancel]  [Finalize ✓]            │
│              (button disabled until typed)      │
└───────────────────────────────────────────────┘
```

**Verify Integrity Response (inline or toast):**
- Success: "✓ Integrity verified. Hash matches." (green)
- Failure: "✗ Integrity check failed. Stored hash does not match computed hash." (red)

**Designer Notes:**
- The waterfall is the visual centerpiece — each phase should be a distinct card
- Use downward arrows (▼) between phases to show the flow
- Phase cards should have subtle left-border color coding
- The Payout Summary table at the bottom is the "final answer" — bold the Total row
- Proof section: the hash should be in a monospace font, truncated with "..." and expandable
- On PREVIEWED status, add a subtle yellow banner at top: "This settlement is in preview. Review the numbers and finalize when ready."

---

### Screen 4.5: Create Settlement Run

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/settlement/new`

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Settlement Runs                                              │
│                                                                 │
│  New Settlement Run                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Select Rule Snapshot *                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  ● v3 (Mar 1, 2026 — Present)                            │  │
│  │    5 participants • 12% dist fee • $70M recoup cap        │  │
│  │                                                           │  │
│  │  ○ v2 (Feb 15 — Mar 1, 2026) — CLOSED                    │  │
│  │    5 participants • 10% dist fee • $45M recoup cap        │  │
│  │                                                           │  │
│  │  ○ v1 (Feb 1 — Feb 15, 2026) — CLOSED                    │  │
│  │    4 participants • 10% dist fee • $45M recoup cap        │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Select Revenue Batches * (only VALIDATED batches can be used)  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  ☑ RB-2026-003  │ $75,000,000  │ Jul–Sep 2026 │ VALIDATED│  │
│  │  ☑ RB-2026-002  │ $50,000,000  │ Apr–Jun 2026 │ VALIDATED│  │
│  │  ☐ RB-2026-001  │ $25,000,000  │ Jan–Mar 2026 │ PROCESSED│  │
│  │    (already used in Run #1)                               │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Selected Summary ──────────────────────────────────────┐   │
│  │  Rule: v3 (5 participants)                               │   │
│  │  Revenue Batches: 2 selected                             │   │
│  │  Total Revenue: $125,000,000                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Notes (optional)                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                          [Cancel]  [Create Settlement Run]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources:**
- GET `/deals/:dealId/rule-snapshots` → list of available snapshots
- GET `/deals/:dealId/revenue-batches` → list of batches (show VALIDATED as selectable, PROCESSED as disabled)

**Form Fields:**

| Field | Type | Required | Validation | API Field |
|-------|------|----------|------------|-----------|
| Rule Snapshot | Radio button list | Yes | Exactly 1 selected | `ruleSnapshotId` |
| Revenue Batches | Checkbox list | Yes | At least 1 VALIDATED batch | `revenueBatchIds` |
| Notes | Textarea | No | Free text | `notes` |

**API:** POST `/deals/:dealId/settlement-runs`

**Interactions:**
- Radio buttons for rule snapshots — only 1 can be selected. Active snapshot pre-selected by default.
- Checkboxes for revenue batches — multiple selection allowed
- PROCESSED batches shown but disabled with explanation "(already used in Run #X)"
- PENDING and REJECTED batches NOT shown
- Selected Summary updates live as user selects/deselects
- [Cancel] → back to Settlement Runs List
- [Create Settlement Run] → submit → on success navigate to Settlement Run Detail (status: DRAFT) with toast "Settlement run created"

**Designer Notes:**
- Rule snapshot radio items should show key info inline (participant count, fees, recoup cap) so user doesn't need to navigate away
- CLOSED snapshots should be visually muted but still selectable (there may be valid reasons to use older rules)
- The "Selected Summary" box at the bottom provides a quick confirmation before submitting

---

### Screen 4.6: Create Correction Run

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/settlement/:runId/correct`
**Triggered from:** [Create Correction Run] button on a FINALIZED Settlement Run Detail

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Settlement Run #2                                            │
│                                                                 │
│  Create Correction Run                                          │
│  Correcting: Settlement Run #2 (FINALIZED, $200,000,000)        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ ℹ How Corrections Work ────────────────────────────────┐   │
│  │                                                          │   │
│  │  The original settlement (Run #2) will NOT be modified.  │   │
│  │  A new correction run will be created that adjusts the   │   │
│  │  original amounts. Both runs remain in the audit trail.  │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Adjustment Revenue Batches (optional)                          │
│  Select additional VALIDATED revenue batches for the correction │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  ☑ RB-2026-005  │ $5,000,000  │ Correction batch │ VALIDATED│
│  │  ☐ RB-2026-006  │ $3,000,000  │ Q1 adjustment    │ VALIDATED│
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Reason / Notes *                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Revenue from Netflix was under-reported by $5M due to   │   │
│  │ late reporting from international territories.           │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Explain what is being corrected and why                        │
│                                                                 │
│                       [Cancel]  [Create Correction Run]         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**API:** POST `/settlement-runs/:id/corrections`

**Request:**
```json
{
  "notes": "Revenue under-reported by $5M...",
  "adjustmentRevenueBatchIds": ["uuid-of-batch"]
}
```

**Interactions:**
- Shows which settlement is being corrected (Run # and amount)
- Info box explains the correction model (original untouched)
- Revenue batch selection: only shows VALIDATED batches not already used
- Notes/reason is strongly recommended (marked with asterisk but backend may not require it)
- [Cancel] → back to Settlement Run Detail
- [Create Correction Run] → submit → on success navigate to the new Correction Run Detail (status: DRAFT) with toast "Correction run created. Preview it to compute adjustments."

**Designer Notes:**
- The info box at top is important for user understanding — make it visually distinct (blue/info styling)
- Show the original run's key info (number, amount, date) for context

---

### Screen 4.7: Correction Detail

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/settlement/:runId` (same as Settlement Run Detail, but for a CORRECTION type run)

**This is NOT a separate screen design — it's the Settlement Run Detail (Screen 4.4) but with additional correction-specific information.**

The differences when `runType === CORRECTION`:

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Settlement Runs                                              │
│                                                                 │
│  Settlement Run #3                         Status: 🟢 FINALIZED  │
│  Type: 🟣 CORRECTION  │  Rule: v3  │  Created: Mar 10, 2026     │
│                                                                 │
│  ┌─ Correction Info ───────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Corrects: Settlement Run #2    [View Original →]        │   │
│  │  Reason: Revenue from Netflix was under-reported by $5M  │   │
│  │  due to late reporting from international territories.   │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [... same waterfall breakdown as Screen 4.4, but for the ...]  │
│  [... correction amount ($5M in this case) ..................]  │
│                                                                 │
│  ┌─ Actions ───────────────────────────────────────────────┐   │
│  │  [Compare with Original]    [View Ledger]                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Additional elements for CORRECTION runs:**
1. **Correction Info Box** (shown above the waterfall):
   - Which run it corrects (with link to original)
   - The correction reason/notes
2. **Type badge** is CORRECTION (purple) instead of NORMAL
3. **Actions** include [Compare with Original] instead of [Create Correction Run]

---

### Screen 4.8: Settlement Comparison

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/settlement/compare?original=:runId&correction=:runId`

**Purpose:** Side-by-side comparison of original settlement vs correction.

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Settlement Run #3                                            │
│                                                                 │
│  Settlement Comparison                                          │
│  Original: Run #2  vs  Correction: Run #3                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Summary ───────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │           │ Original (#2) │ Correction (#3) │ Combined   │   │
│  │  Revenue  │ $200,000,000  │ $5,000,000      │ $205,000,000│  │
│  │  Status   │ FINALIZED     │ FINALIZED       │            │   │
│  │  Rule     │ v3            │ v3              │            │   │
│  │  Date     │ Mar 5         │ Mar 10          │            │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Per-Participant Comparison ────────────────────────────┐   │
│  │                                                          │   │
│  │  Participant          │ Original      │ Correction  │ Combined      │ Delta  │
│  │  ─────────────────────────────────────────────────────────────────────────  │
│  │  Global Cinema        │ $24,000,000   │ $600,000    │ $24,600,000   │ +2.5%  │
│  │  Horizon Ventures     │ $60,900,000   │ $660,000    │ $61,560,000   │ +1.1%  │
│  │  Pacific Capital      │ $37,720,000   │ $528,000    │ $38,248,000   │ +1.4%  │
│  │  Zenith Pictures      │ $68,900,000   │ $2,860,000  │ $71,760,000   │ +4.2%  │
│  │  Sarah Chen           │ $8,480,000    │ $352,000    │ $8,832,000    │ +4.2%  │
│  │  ─────────────────────────────────────────────────────────────────────────  │
│  │  TOTAL                │ $200,000,000  │ $5,000,000  │ $205,000,000  │ +2.5%  │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Phase-by-Phase Delta ──────────────────────────────────┐   │
│  │                                                          │   │
│  │  Phase              │ Original      │ Correction  │ Delta │   │
│  │  ────────────────────────────────────────────────────── │   │
│  │  Distribution Fees  │ $24,000,000   │ $600,000    │ +$600K│   │
│  │  Recoupment         │ $70,000,000   │ $0          │ $0    │   │
│  │  Net Profit         │ $106,000,000  │ $4,400,000  │+$4.4M│   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Correction Chain ──────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Run #2 (NORMAL) ────→ Run #3 (CORRECTION)              │   │
│  │  $200,000,000          $5,000,000                        │   │
│  │  Mar 5, 2026           Mar 10, 2026                      │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources:**
- GET `/settlement-runs/:originalId` → original run allocations
- GET `/settlement-runs/:correctionId` → correction run allocations

**Components:**
1. **Summary Table:** Side-by-side showing revenue, status, rule, date for each run
2. **Per-Participant Comparison Table:** Original amount, correction amount, combined total, delta percentage
3. **Phase-by-Phase Delta:** Shows how each waterfall phase was affected
4. **Correction Chain Visualization:** Simple flow diagram showing the link between original and correction

**Designer Notes:**
- Delta column: green for positive, red for negative
- The Per-Participant table is the key output — make it the most prominent section
- Correction Chain: simple horizontal flow with arrow. If there are multiple corrections of the same original, show them as a chain: `#2 → #3 → #5`
- Consider adding a "Download Comparison Report" button for export
- Recoupment phase may show $0 in correction if investors were already fully recouped in the original

---

## MS-5: Reports & Proof

**5 screens:** Ledger Overview, Journal Detail, Recoupment Report, Participant Statement, Proof Overview

---

### Screen 5.1: Ledger Overview

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/reports/ledger`

**Purpose:** Double-entry accounting view. Every settlement creates a balanced journal.

```
┌─────────────────────────────────────────────────────────────────┐
│  Ledger — The Last Horizon                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │     3      │  │  $275M     │  │  $275M     │               │
│  │  Journals  │  │  Total     │  │  Total     │               │
│  │            │  │  Debits    │  │  Credits   │               │
│  └────────────┘  └────────────┘  └────────────┘               │
│                                                                 │
│  ✓ All journals balance (total debits = total credits)          │
│                                                                 │
│  Journal #        │ Settlement │ Posted        │ Debits       │ Credits      │ Postings │
│  ─────────────────────────────────────────────────────────────────────────────────────── │
│  JRN-2026-00003   │ Run #3     │ Mar 10, 2026  │ $5,000,000   │ $5,000,000   │ 6        │
│  JRN-2026-00002   │ Run #2     │ Mar 5, 2026   │ $200,000,000 │ $200,000,000 │ 6        │
│  JRN-2026-00001   │ Run #1     │ Feb 15, 2026  │ $70,000,000  │ $70,000,000  │ 5        │
│                                                                 │
│  ◄ 1 of 1 ►                                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Data Source:** GET `/deals/:dealId/ledger`

**Table Columns:**

| Column | Source Field | Notes |
|--------|-------------|-------|
| Journal # | `journalNumber` | Auto-generated, e.g., "JRN-2026-00003" |
| Settlement | linked run | "Run #3" — clickable → Settlement Run Detail |
| Posted | `postedAt` | Formatted date |
| Debits | `totalDebit` | Currency-formatted |
| Credits | `totalCredit` | Currency-formatted |
| Postings | `postingCount` | Number of line items in the journal |

**Components:**
- 3x Stat Cards (Total Journals, Total Debits, Total Credits)
- Balance confirmation message (green checkmark if balanced)
- Journals table (each row clickable → Journal Detail)

**Designer Notes:**
- The balance confirmation is always visible — it's the key trust signal
- Debits and Credits columns should be right-aligned for numeric readability
- If debits != credits (shouldn't happen), show red warning with exclamation icon

**Empty State:** "No ledger entries yet. Ledger journals are created automatically when settlements are finalized."

---

### Screen 5.2: Journal Detail

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/reports/ledger/:journalId`

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Ledger                                                       │
│                                                                 │
│  JRN-2026-00002                                                  │
│  Settlement Run #2  │  Posted: Mar 5, 2026                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Account Code  │ Account Type │ Participant          │ Debit        │ Credit       │
│  ──────────────────────────────────────────────────────────────────────────────── │
│  1000-REVENUE  │ REVENUE      │ —                    │ —            │ $200,000,000 │
│  2100-PAYABLE  │ LIABILITY    │ Global Cinema        │ $24,000,000  │ —            │
│  2100-PAYABLE  │ LIABILITY    │ Horizon Ventures     │ $60,900,000  │ —            │
│  2100-PAYABLE  │ LIABILITY    │ Pacific Capital      │ $37,720,000  │ —            │
│  2100-PAYABLE  │ LIABILITY    │ Zenith Pictures      │ $68,900,000  │ —            │
│  2100-PAYABLE  │ LIABILITY    │ Sarah Chen           │ $8,480,000   │ —            │
│  ──────────────────────────────────────────────────────────────────────────────── │
│  TOTAL         │              │                      │ $200,000,000 │ $200,000,000 │
│                                                                 │
│  ✓ Balanced                                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Source:** GET `/ledger-journals/:id` → includes `postings[]`

**Table Columns:**

| Column | Source Field | Notes |
|--------|-------------|-------|
| Account Code | `accountCode` | e.g., "1000-REVENUE", "2100-PAYABLE" |
| Account Type | `accountType` | REVENUE, LIABILITY, ASSET, etc. |
| Participant | `participantName` | "—" for system accounts (revenue) |
| Debit | `debitAmount` | Show "—" if 0 |
| Credit | `creditAmount` | Show "—" if 0 |

**Components:**
- Header with journal number, linked settlement, posted date
- Postings table (all line items)
- Total row (bold, highlighted)
- Balance confirmation (checkmark)

**Designer Notes:**
- Revenue line (credit) should be visually distinct — perhaps a different background shade
- Debit and Credit columns right-aligned
- Total row: bold with a top border separator
- Participant names should be clickable → opens Participant Detail drawer
- This is a "printable" view — design it to look clean when printed or exported

---

### Screen 5.3: Recoupment Report

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/reports/recoupment`

**Purpose:** Shows investor recoupment progress. How much of each investor's investment has been recovered.

```
┌─────────────────────────────────────────────────────────────────┐
│  Recoupment Report — The Last Horizon                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Horizon Ventures Fund ─────────────────────────────────┐   │
│  │                                                          │   │
│  │  Role: 🟢 INVESTOR    Priority: 1                        │   │
│  │                                                          │   │
│  │  Recoupment Cap:     $45,000,000                         │   │
│  │  Total Recouped:     $45,000,000                         │   │
│  │  Remaining:          $0                                  │   │
│  │  Status:             ✓ FULLY RECOUPED                    │   │
│  │                                                          │   │
│  │  ████████████████████████████████████████████████ 100%   │   │
│  │                                                          │   │
│  │  ─── Recoupment History ───                              │   │
│  │                                                          │   │
│  │  Settlement │ Recouped     │ Carry Forward │ Cumulative   │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  Run #1     │ $21,750,000  │ $23,250,000   │ $21,750,000  │   │
│  │  Run #2     │ $23,250,000  │ $0            │ $45,000,000  │   │
│  │                                                          │   │
│  │  ✓ Fully recouped as of Run #2 (Mar 5, 2026)            │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Pacific Capital Group ─────────────────────────────────┐   │
│  │                                                          │   │
│  │  Role: 🟢 INVESTOR    Priority: 2                        │   │
│  │                                                          │   │
│  │  Recoupment Cap:     $25,000,000                         │   │
│  │  Total Recouped:     $25,000,000                         │   │
│  │  Remaining:          $0                                  │   │
│  │  Status:             ✓ FULLY RECOUPED                    │   │
│  │                                                          │   │
│  │  ████████████████████████████████████████████████ 100%   │   │
│  │                                                          │   │
│  │  ─── Recoupment History ───                              │   │
│  │                                                          │   │
│  │  Settlement │ Recouped     │ Carry Forward │ Cumulative   │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  Run #1     │ $0           │ $25,000,000   │ $0           │   │
│  │  Run #2     │ $25,000,000  │ $0            │ $25,000,000  │   │
│  │                                                          │   │
│  │  ✓ Fully recouped as of Run #2 (Mar 5, 2026)            │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Summary ───────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Total Recoupment Cap:  $70,000,000                      │   │
│  │  Total Recouped:        $70,000,000                      │   │
│  │  All investors fully recouped ✓                          │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources:**
- GET `/deals/:dealId/participants` → filter investors
- GET `/participants/:participantId/ledger` → recoupment postings
- Settlement allocation data for recoupment phase breakdowns

**Components (per investor):**
1. **Header:** Investor name, role badge, priority
2. **Summary Stats:** Cap, total recouped, remaining, status
3. **Progress Bar:** Visual fill showing percentage recouped
   - Green if fully recouped (100%)
   - Yellow if partially recouped (1-99%)
   - Gray if not started (0%)
4. **Recoupment History Table:** Per-settlement breakdown showing:
   - How much was recouped in each settlement
   - Carry-forward balance (amount deferred to next settlement)
   - Cumulative total

**Summary Section:** Bottom of page showing aggregate across all investors.

**Designer Notes:**
- Progress bars are the visual centerpiece — make them large and clear
- Sort investors by priority (Priority 1 first)
- If no investors exist, show: "No investors with recoupment caps in this deal."
- If no settlements have been finalized, show: "Recoupment data will appear after settlements are finalized."
- Carry-forward is a key concept — consider a tooltip explaining: "Amount that couldn't be recouped in this settlement and was deferred to the next one"

---

### Screen 5.4: Participant Statement

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/reports/statements/:participantId`

**Purpose:** Printable/exportable statement for one participant showing all their payouts.

**Accessed from:** Participant Detail drawer → [View Full Ledger] link, or from a "Generate Statement" action

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Reports                                                      │
│                                                                 │
│  Participant Statement                   [Export PDF] [Export CSV]│
│  Horizon Ventures Fund — 🟢 INVESTOR                            │
│  Deal: The Last Horizon                                         │
│  Generated: Mar 26, 2026                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Summary ───────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Total Received:       $61,560,000                       │   │
│  │  From Recoupment:      $45,000,000                       │   │
│  │  From Net Profit:      $16,560,000                       │   │
│  │  Settlements Included: 3                                 │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Settlement Breakdown ──────────────────────────────────┐   │
│  │                                                          │   │
│  │  Settlement │ Type       │ Date     │ Recoupment   │ Net Profit   │ Total        │
│  │  ──────────────────────────────────────────────────────────────────────────────  │
│  │  Run #1     │ NORMAL     │ Feb 15   │ $21,750,000  │ —            │ $21,750,000  │
│  │  Run #2     │ NORMAL     │ Mar 5    │ $23,250,000  │ $15,900,000  │ $39,150,000  │
│  │  Run #3     │ CORRECTION │ Mar 10   │ —            │ $660,000     │ $660,000     │
│  │  ──────────────────────────────────────────────────────────────────────────────  │
│  │  TOTAL      │            │          │ $45,000,000  │ $16,560,000  │ $61,560,000  │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Ledger Postings ──────────────────────────────────────┐    │
│  │                                                          │   │
│  │  Journal         │ Date      │ Account      │ Debit        │ Credit │
│  │  ─────────────────────────────────────────────────────── │   │
│  │  JRN-2026-00001  │ Feb 15    │ 2100-PAYABLE │ $21,750,000  │ —      │
│  │  JRN-2026-00002  │ Mar 5     │ 2100-PAYABLE │ $39,150,000  │ —      │
│  │  JRN-2026-00003  │ Mar 10    │ 2100-PAYABLE │ $660,000     │ —      │
│  │  ─────────────────────────────────────────────────────── │   │
│  │  Net Balance: $61,560,000                                │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Proof Verification ───────────────────────────────────┐    │
│  │                                                          │   │
│  │  All amounts are backed by cryptographic proof:          │   │
│  │  Run #1: sha256:7b2e1f3a...  ✓ Verified                 │   │
│  │  Run #2: sha256:a3f8b2c9...  ✓ Verified                 │   │
│  │  Run #3: sha256:d4e5f6a7...  ✓ Verified                 │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources:**
- GET `/participants/:participantId/ledger` → all ledger postings
- Settlement allocation data for breakdown by type (recoupment vs net profit)
- Proof data from settlement runs

**Components:**
1. **Header:** Participant name, role, deal name, generation date
2. **Export Buttons:** [Export PDF] and [Export CSV] at top-right
3. **Summary Card:** Total received, broken down by recoupment and net profit
4. **Settlement Breakdown Table:** Per-settlement amounts with type and date
5. **Ledger Postings Table:** Raw accounting entries
6. **Proof Verification:** Lists all settlement proof hashes with verification status

**Designer Notes:**
- This page should be "print-friendly" — clean layout that looks good on paper
- Export PDF should generate a branded statement with FEA logo, deal details, and all the data
- The Settlement Breakdown table is the primary view; Ledger Postings is secondary (could be collapsible)
- Consider a participant selector dropdown at the top to quickly switch between participants without going back

---

### Screen 5.5: Proof Overview

**Layout:** App Layout — Deal Context Mode
**URL:** `/deals/:dealId/proof`

**Purpose:** View all proof records for the deal. Cryptographic verification that settlements are untampered.

```
┌─────────────────────────────────────────────────────────────────┐
│  Proof & Verification — The Last Horizon                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ ℹ What is Proof? ─────────────────────────────────────┐    │
│  │                                                          │   │
│  │  Every finalized settlement generates a SHA-256 hash     │   │
│  │  that captures the exact inputs and outputs. This hash   │   │
│  │  can be used to verify that no data was changed after    │   │
│  │  finalization. This is SFI's core trust guarantee.       │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Settlement Proof Records ──────────────────────────────┐   │
│  │                                                          │   │
│  │  ┌─ Run #3 — CORRECTION — FINALIZED ────────────────┐  │   │
│  │  │                                                    │  │   │
│  │  │  Hash:      sha256:d4e5f6a7b8c9...               │  │   │
│  │  │  Algorithm: SHA-256                               │  │   │
│  │  │  Computed:  Mar 10, 2026 3:15:00 PM UTC           │  │   │
│  │  │  Input:     Rule v3 × 1 batch × 5 participants   │  │   │
│  │  │  Revenue:   $5,000,000                            │  │   │
│  │  │                                                    │  │   │
│  │  │  [📋 Copy Hash]  [🔍 Verify Integrity]            │  │   │
│  │  │                                                    │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  ┌─ Run #2 — NORMAL — FINALIZED ───────────────────┐   │   │
│  │  │                                                    │  │   │
│  │  │  Hash:      sha256:a3f8b2c9d1e4...               │  │   │
│  │  │  Algorithm: SHA-256                               │  │   │
│  │  │  Computed:  Mar 5, 2026 2:30:00 PM UTC            │  │   │
│  │  │  Input:     Rule v3 × 2 batches × 5 participants │  │   │
│  │  │  Revenue:   $200,000,000                          │  │   │
│  │  │                                                    │  │   │
│  │  │  [📋 Copy Hash]  [🔍 Verify Integrity]            │  │   │
│  │  │                                                    │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Correction Chain ──────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Run #2 (NORMAL) ────────→ Run #3 (CORRECTION)          │   │
│  │  $200,000,000              $5,000,000                    │   │
│  │  sha256:a3f8...            sha256:d4e5...                │   │
│  │  Mar 5, 2026               Mar 10, 2026                  │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources:**
- GET `/deals/:dealId/settlement-runs?status=FINALIZED` → all finalized runs with proof data
- Proof data from `settlement.proof` (proofHash, algorithm, timestamp, inputSummary)

**Components:**
1. **Info Box:** Explains what proof is and why it matters (collapsible after first read)
2. **Proof Record Cards:** One card per finalized settlement, showing:
   - Run number, type, status
   - SHA-256 hash (monospace font, truncated with expand)
   - Algorithm used
   - Computation timestamp
   - Input summary (rule version, batch count, participant count, total revenue)
   - [Copy Hash] and [Verify Integrity] action buttons
3. **Correction Chain Visualization:** Shows relationships between original and correction runs as a flow diagram

**Verify Integrity Action:**
- Calls POST `/settlement-runs/:id/verify`
- Shows inline result:
  - Success: Green checkmark "Integrity verified — hash matches"
  - Failure: Red X "Integrity check FAILED — stored hash does not match computed hash"
- The verify button should show a loading spinner while checking

**Designer Notes:**
- Hash values should always be in monospace font
- The info box at top is for users who don't understand cryptographic proof — keep it simple
- Proof cards ordered by most recent first
- The correction chain visualization is a nice-to-have — a simple horizontal flow with arrows
- Consider a "Verify All" button at the top that checks all settlements at once
- Only FINALIZED settlements have proof records — DRAFT/PREVIEWED/VOIDED do not appear here

**Empty State:** "No proof records yet. Proof hashes are generated when settlements are finalized."

---

## Shared Components Library

This section documents reusable components that appear across multiple screens. Design these as a component library in Figma for consistency and reuse.

### Status Badge

Used everywhere to show entity status.

```
┌────────────┐
│ ● ACTIVE   │  ← colored dot + uppercase text + pill shape
└────────────┘
```

| Status | Dot Color | Background | Text Color |
|--------|-----------|------------|------------|
| DRAFT | Gray | Light gray | Dark gray |
| PENDING | Amber | Light amber | Dark amber |
| ACTIVE | Green | Light green | Dark green |
| VALIDATED | Green | Light green | Dark green |
| PREVIEWED | Amber | Light amber | Dark amber |
| FINALIZED | Green | Light green | Dark green |
| PROCESSED | Blue | Light blue | Dark blue |
| REJECTED | Red | Light red | Dark red |
| VOIDED | Red | Light red | Dark red |
| SUSPENDED | Red | Light red | Dark red |
| CLOSED | Gray | Light gray | Dark gray |
| CORRECTION | Purple | Light purple | Dark purple |

### Role Badge

```
┌───────────────┐
│ ● DISTRIBUTOR │  ← colored dot + role name
└───────────────┘
```

Colors defined in the Role Badge Colors section above.

### Stat Card

```
┌────────────────┐
│   [Icon]       │
│     12         │  ← large bold number
│  Total Deals   │  ← muted label
└────────────────┘
```

- Used in: Dashboard, Deal Overview, Ledger Overview
- Icon is optional but recommended for visual distinction
- Number should be the largest text element
- Clickable variant: cursor pointer, subtle hover effect → navigates to related section

### Data Table

Standard table pattern used across all list screens.

```
┌──────────────────────────────────────────────────────────────┐
│  Column A ▼  │  Column B    │  Column C    │  Column D       │
│  ─────────────────────────────────────────────────────────── │
│  Row 1 data  │  data        │  data        │  data           │
│  Row 2 data  │  data        │  data        │  data           │
│  Row 3 data  │  data        │  data        │  data           │
│                                                               │
│  ◄ 1  2  3  ►                       Showing 1-10 of 25       │
└──────────────────────────────────────────────────────────────┘
```

Features:
- Sortable columns (click header → toggle sort, show ▲/▼ indicator)
- Pagination footer (page numbers + showing X of Y)
- Hoverable rows (subtle background change)
- Clickable rows where specified (cursor pointer)
- Empty state slot (centered text + optional CTA button)
- Loading state (skeleton rows or spinner)

### Confirmation Modal

Used for irreversible or significant actions.

```
┌─────────────────────────────────────────┐
│  [⚠ Icon]  Title                        │
│                                         │
│  Description text explaining what       │
│  will happen.                           │
│                                         │
│  • Bullet point consequence 1           │
│  • Bullet point consequence 2           │
│                                         │
│  [Optional input field]                 │
│                                         │
│              [Cancel]  [Confirm Action]  │
└─────────────────────────────────────────┘
```

Variants:
- **Warning (amber):** For significant actions (validate, create snapshot)
- **Danger (red):** For irreversible actions (finalize settlement, reject batch)
- **Info (blue):** For informational confirmations

### Toast Notification

Appears top-right, auto-dismisses after 5 seconds.

```
┌──────────────────────────────────────┐
│  ✓ Deal created successfully    [✕]  │
└──────────────────────────────────────┘
```

Types: Success (green), Error (red), Warning (amber), Info (blue)

### Empty State

```
┌──────────────────────────────────────────┐
│                                          │
│        [Illustration / Icon]             │
│                                          │
│     No [items] yet                       │
│     Description of what to do next.      │
│                                          │
│     [+ Primary CTA Button]              │
│                                          │
└──────────────────────────────────────────┘
```

### Form Patterns

- **Labels:** Above the input, medium weight
- **Required indicator:** Asterisk (*) after label
- **Helper text:** Below input, muted color, smaller size
- **Error text:** Below input, red, replaces helper text
- **Input states:** Default, Focus (blue border), Error (red border), Disabled (gray bg)
- **Dropdowns:** Native select or custom dropdown with search for long lists
- **Date pickers:** Calendar popup, supports date range selection

### Back Link

```
← Back to [Parent Name]
```

Always top-left of the page, above the title. Links to the logical parent page.

### Breadcrumb

```
Deals  >  The Last Horizon  >  Settlement  >  Run #2
```

Shown in the top bar. Each segment is clickable. Current page is bold/non-clickable.

---

## API Endpoint Reference

Quick reference for developers and designers to understand what data is available for each screen.

### Base URL
```
Development: http://localhost:3001/api/v1
```

### Pagination Standard
All list endpoints accept:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `sortBy` (field name)
- `sortOrder` ('asc' | 'desc')

Response format:
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### Endpoints by Screen

| Screen | Endpoint | Method | Notes |
|--------|----------|--------|-------|
| **MS-1** | | | |
| Dashboard | `/deals` | GET | With pagination for counts |
| Deals List | `/deals` | GET | Filterable, sortable |
| Create Deal | `/deals` | POST | Returns new deal |
| Deal Overview | `/deals/:id` | GET | + participants, snapshots, revenue, settlement counts |
| Edit Deal | `/deals/:id` | PATCH | Update fields |
| **MS-2** | | | |
| Participants List | `/deals/:dealId/participants` | GET | Paginated |
| Add Participant | `/deals/:dealId/participants` | POST | Returns new participant |
| Participant Detail | `/participants/:id/ledger` | GET | Ledger postings |
| Rule Snapshots List | `/deals/:dealId/rule-snapshots` | GET | Paginated |
| Rule Snapshot Detail | `/rule-snapshots/:id` | GET | Includes ruleSummary + participants |
| Create Rule Snapshot | `/deals/:dealId/rule-snapshots` | POST | Complex body |
| **MS-3** | | | |
| Revenue Batches List | `/deals/:dealId/revenue-batches` | GET | Filter by status |
| Revenue Batch Detail | `/revenue-batches/:id` | GET | + documents |
| Create Revenue Batch | `/deals/:dealId/revenue-batches` | POST | Returns new batch (PENDING) |
| Validate Batch | `/revenue-batches/:id/validate` | PATCH | PENDING → VALIDATED |
| Reject Batch | `/revenue-batches/:id/reject` | PATCH | PENDING/VALIDATED → REJECTED |
| Documents List | `/deals/:dealId/documents` | GET | Filter by docType |
| Upload Document | `/deals/:dealId/documents` | POST | Multipart form data |
| Delete Document | `/documents/:id` | DELETE | If not linked to finalized settlement |
| **MS-4** | | | |
| Settlement Runs List | `/deals/:dealId/settlement-runs` | GET | Filter by status, runType |
| Settlement Run Detail | `/settlement-runs/:id` | GET | Includes allocations, proof |
| Create Settlement Run | `/deals/:dealId/settlement-runs` | POST | Requires ruleSnapshotId + revenueBatchIds |
| Preview Settlement | `/settlement-runs/:id/preview` | POST | DRAFT → PREVIEWED |
| Finalize Settlement | `/settlement-runs/:id/finalize` | POST | PREVIEWED → FINALIZED |
| Create Correction | `/settlement-runs/:id/corrections` | POST | Creates CORRECTION type run |
| Verify Integrity | `/settlement-runs/:id/verify` | POST | Re-computes and compares hash |
| **MS-5** | | | |
| Ledger Overview | `/deals/:dealId/ledger` | GET | Journals with totals |
| Journal Detail | `/ledger-journals/:id` | GET | All postings |
| Participant Ledger | `/participants/:id/ledger` | GET | Per-participant postings |
| Settlement Run Ledger | `/settlement-runs/:id/ledger` | GET | Journal for specific run |

### Enums Reference

**DealStatus:** DRAFT, ACTIVE, SUSPENDED, CLOSED
**ParticipantRole:** PRODUCER, DISTRIBUTOR, INVESTOR, TALENT, STUDIO, LICENSOR, LICENSEE, COLLECTION_AGENT
**RevenueBatchStatus:** PENDING, VALIDATED, PROCESSED, REJECTED
**SettlementRunStatus:** DRAFT, PREVIEWED, FINALIZED, VOIDED
**RunType:** NORMAL, CORRECTION
**SettlementPhase:** GROSS_RECEIPTS, DISTRIBUTION_FEES, RECOUPMENT, NET_PROFITS
**DocumentType:** CONTRACT, AMENDMENT, REVENUE_REPORT, SETTLEMENT_REPORT, AUDIT_REPORT, PROOF_RECORD, OTHER
**Currency:** USD, EUR, GBP, JPY, CHF, CAD, AUD
**LedgerAccountType:** ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE

---

## Screen Count Summary

| Milestone | Screens | Screen Numbers |
|-----------|:-------:|----------------|
| MS-1: Shell & Deals | 8 | 1.1–1.8 |
| MS-2: Participants & Rules | 6 | 2.1–2.6 |
| MS-3: Revenue & Documents | 5 | 3.1–3.5 |
| MS-4: Settlement Core | 8 | 4.1–4.8 |
| MS-5: Reports & Proof | 5 | 5.1–5.5 |
| **Total** | **32** | |

---

*32 screens. Every wireframe, component, form field, API endpoint, and interaction documented. Ready for Figma execution.*
