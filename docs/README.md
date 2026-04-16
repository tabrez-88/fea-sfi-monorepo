# SFI-FEA Documentation

This folder contains all documentation for the SFI-FEA (Settlement and Financial Infrastructure — Film Entertainment Assets) project, organized by audience and purpose.

---

## Folder Structure

```
docs/
├── README.md                  # This index
├── client-reports/            # Client-facing reports & overviews (for Liang)
├── design/                    # UI/UX design specs & concepts
├── demos/                     # Demo scripts & API tutorials
├── engineering/               # Technical implementation reports
├── execution/                 # Sprint execution workflow (Notion → BE → FE gates)
└── infrastructure/            # Setup & deployment guides
```

---

## [client-reports/](./client-reports/)

Documents prepared for client review — milestone reports, portal scope overviews, delivery plans, and stakeholder explainers.

| Document                                                                                  | Purpose                                                             |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [WHAT_IS_FEA_AND_SFI.md](./client-reports/WHAT_IS_FEA_AND_SFI.md)                         | Plain-English explainer of FEA & SFI for non-technical stakeholders |
| [CLIENT_MILESTONE_1_REPORT.md](./client-reports/CLIENT_MILESTONE_1_REPORT.md)             | Milestone 1 — Settlement Computation Engine delivery report         |
| [CLIENT_MILESTONE_2B_REPORT.md](./client-reports/CLIENT_MILESTONE_2B_REPORT.md)           | Milestone 2B — Rule Snapshots & Revenue Structures delivery report  |
| [CLIENT_ADMIN_PORTAL_OVERVIEW.md](./client-reports/CLIENT_ADMIN_PORTAL_OVERVIEW.md)       | Admin Portal scope v1 (42 screens, pre-review)                      |
| [CLIENT_ADMIN_PORTAL_OVERVIEW_V2.md](./client-reports/CLIENT_ADMIN_PORTAL_OVERVIEW_V2.md) | Admin Portal scope v2 (32 screens, post-review, Phase 1)            |
| [PHASE_1_DELIVERY_PLAN.md](./client-reports/PHASE_1_DELIVERY_PLAN.md)                     | Phase 1 delivery plan — 32 screens broken into 5 milestones         |

---

## [design/](./design/)

Design blueprints and UI/UX specs for the FEA-SFI Admin Portal.

| Document                                                                            | Purpose                                                                    |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [PHASE_1_DESIGN_SPEC.md](./design/PHASE_1_DESIGN_SPEC.md)                           | Complete UI/UX spec for all 32 Phase 1 screens (Figma execution blueprint) |
| [FEA_ADMIN_PORTAL_COMPLETE_DESIGN.md](./design/FEA_ADMIN_PORTAL_COMPLETE_DESIGN.md) | Full design concept for the FEA-SFI Admin Console with SFI module          |
| [SFI_ADMIN_PORTAL_DESIGN_CONCEPT.md](./design/SFI_ADMIN_PORTAL_DESIGN_CONCEPT.md)   | Early SFI-specific design concept (superseded by complete design)          |

---

## [demos/](./demos/)

Demo walkthroughs, presenter cheat sheets, and Swagger tutorials.

| Document                                                         | Purpose                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------- |
| [CLIENT_DEMO_GUIDE.md](./demos/CLIENT_DEMO_GUIDE.md)             | Non-technical walkthrough of the settlement engine demo       |
| [DEMO_QUICK_REFERENCE.md](./demos/DEMO_QUICK_REFERENCE.md)       | One-page cheat sheet for the demo presenter                   |
| [SETTLEMENT_LIVE_DEMO.md](./demos/SETTLEMENT_LIVE_DEMO.md)       | Live Swagger demo — "The Last Horizon" ($200M settlement)     |
| [SETTLEMENT_LIVE_DEMO_2B.md](./demos/SETTLEMENT_LIVE_DEMO_2B.md) | Live Swagger demo — Milestone 2B ("Echoes of Tomorrow", $75M) |
| [SWAGGER_TUTORIAL.md](./demos/SWAGGER_TUTORIAL.md)               | How to use Swagger UI for non-technical users                 |

---

## [engineering/](./engineering/)

Internal technical implementation reports, API status tracking, and coding standards.

| Document                                                                     | Purpose                                                             |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [MILESTONE_1_IMPLEMENTATION.md](./engineering/MILESTONE_1_IMPLEMENTATION.md) | Full Milestone 1 implementation report — files, tests, architecture |
| [ENDPOINT_STATUS.md](./engineering/ENDPOINT_STATUS.md)                       | API endpoint implementation status tracking                         |

### [engineering/standards/](./engineering/standards/)

Canonical coding standards — enforced for all code written from 2026-04-08 onwards.

| Document                                                                                     | Purpose                                                                                                                 |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [standards/README.md](./engineering/standards/README.md)                                     | Standards index — which rules apply to which app                                                                        |
| [standards/BACKEND_STANDARDS.md](./engineering/standards/BACKEND_STANDARDS.md)               | NestJS module layout, controllers, services, DTOs, mappers, error handling, audit logging                               |
| [standards/FRONTEND_ADMIN_STANDARDS.md](./engineering/standards/FRONTEND_ADMIN_STANDARDS.md) | `apps/sfi-admin` strict rules — folder structure, TypeScript config, Axios, React Query hooks, shadcn, constants, types |
| [standards/TESTING_STANDARDS.md](./engineering/standards/TESTING_STANDARDS.md)               | Test naming, placement, mock patterns (Prisma + MSW), coverage expectations, CI integration                             |

---

## [execution/](./execution/)

Sprint-by-sprint execution workflow for the FEA-SFI Admin Portal build. Enforces a **Notion → Backend → Frontend** gate sequence so FE work never starts against missing endpoints.

| Document                                                                               | Purpose                                                                                                               |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [README.md](./execution/README.md)                                                     | Three-gate workflow definition + sprint verification template                                                         |
| [sprints/sprint-1-be-verification.md](./execution/sprints/sprint-1-be-verification.md) | Sprint 1 (MS-1: Shell & Deals) — BE verification report                                                               |
| [FE_SLICING_TRACKER.md](./execution/FE_SLICING_TRACKER.md)                             | Sprint 1 + 2 FE slicing audit — per-screen status: Figma Hi-Fi, code slice, BE wired, mobile, empty states, open gaps |

---

## [infrastructure/](./infrastructure/)

Deployment, environment setup, and architectural decision records for infrastructure choices.

| Document                                                                | Purpose                                                                                                         |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [GCP_SETUP_GUIDE.md](./infrastructure/GCP_SETUP_GUIDE.md)               | Google Cloud Platform setup for staging/production deployment                                                   |
| [FRONTEND_REPO_STRATEGY.md](./infrastructure/FRONTEND_REPO_STRATEGY.md) | Decision record: where to host the new FEA SFI Admin Portal (verdict: add as `apps/sfi-admin` in this monorepo) |

---

## Quick Navigation by Role

**Client / Stakeholder (Liang):** start with [client-reports/](./client-reports/)
**UI/UX Designer:** start with [design/PHASE_1_DESIGN_SPEC.md](./design/PHASE_1_DESIGN_SPEC.md)
**Developer (onboarding):** start with [engineering/MILESTONE_1_IMPLEMENTATION.md](./engineering/MILESTONE_1_IMPLEMENTATION.md)
**Sprint executor (BE→FE):** start with [execution/README.md](./execution/README.md)
**Demo presenter:** start with [demos/DEMO_QUICK_REFERENCE.md](./demos/DEMO_QUICK_REFERENCE.md)
**DevOps:** start with [infrastructure/GCP_SETUP_GUIDE.md](./infrastructure/GCP_SETUP_GUIDE.md)

---

## Milestone Status

### Milestone 1 — Core Settlement Engine — **DELIVERED**

Pure computation engine, database schema, REST API, audit trail, double-entry ledger.

### Milestone 2B — Rule Snapshots & Revenue Structures — **DELIVERED**

Immutable rule snapshots, validated revenue batches, rule/revenue/engine binding.

### Phase 1 Admin Portal — **IN DESIGN**

32 screens across 8 sections, delivered in 5 milestones. See [PHASE_1_DELIVERY_PLAN.md](./client-reports/PHASE_1_DELIVERY_PLAN.md).
