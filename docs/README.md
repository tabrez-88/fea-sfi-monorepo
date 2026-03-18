# SFI-FEA Documentation

This folder contains all documentation for the SFI-FEA (Settlement and Financial Engine - Film, Entertainment, Arts) project.

---

## 📚 Available Documents

### For Client Demo

| Document | Purpose | Audience |
|----------|---------|----------|
| **[CLIENT_DEMO_GUIDE.md](./CLIENT_DEMO_GUIDE.md)** | Step-by-step demo walkthrough with screenshots-style instructions | Non-technical client |
| **[DEMO_QUICK_REFERENCE.md](./DEMO_QUICK_REFERENCE.md)** | Quick reference card for presenter during demo | Developer (you) |

### Technical Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| **[MILESTONE_1_IMPLEMENTATION.md](./MILESTONE_1_IMPLEMENTATION.md)** | Complete technical report on what was built, how to test it, and what's next | Technical stakeholders |
| **[GCP_SETUP_GUIDE.md](./GCP_SETUP_GUIDE.md)** | Google Cloud Platform setup for deployment | DevOps/Developer |

---

## 🎯 Quick Start Guide

### For Client Demo Preparation

1. **Read first:** [DEMO_QUICK_REFERENCE.md](./DEMO_QUICK_REFERENCE.md) - Get familiar with the flow
2. **Practice:** Follow [CLIENT_DEMO_GUIDE.md](./CLIENT_DEMO_GUIDE.md) once yourself
3. **During demo:** Keep [DEMO_QUICK_REFERENCE.md](./DEMO_QUICK_REFERENCE.md) open in another tab

### For Technical Review

1. **Read:** [MILESTONE_1_IMPLEMENTATION.md](./MILESTONE_1_IMPLEMENTATION.md) - Full technical details
2. **Run tests:** `cd apps/sfi-api && npx jest --testPathPattern=engine`
3. **Review code:** All engine code in `apps/sfi-api/src/modules/settlement/engine/`

---

## 📋 Document Summaries

### CLIENT_DEMO_GUIDE.md
- **What:** Non-technical walkthrough of the settlement engine demo
- **Length:** ~10 pages
- **Time to read:** 15 minutes
- **Contains:**
  - Plain English explanation of what the system does
  - Step-by-step Swagger UI instructions with JSON examples
  - Expected results with dollar amounts
  - FAQ section for client questions

**Use this when:** Preparing for or conducting the client demo

---

### DEMO_QUICK_REFERENCE.md
- **What:** One-page cheat sheet for demo presenter
- **Length:** 1 page
- **Time to read:** 3 minutes
- **Contains:**
  - Server startup commands
  - 9-step demo flow table
  - Expected calculation results
  - Key talking points
  - Troubleshooting commands

**Use this when:** During the live demo (keep it open for quick reference)

---

### MILESTONE_1_IMPLEMENTATION.md
- **What:** Complete technical implementation report
- **Length:** ~25 pages
- **Time to read:** 45 minutes
- **Contains:**
  - Executive summary
  - Detailed list of all files created/modified
  - Test results (29 passing tests)
  - Architecture diagrams
  - How to run locally
  - Known limitations
  - Next steps

**Use this when:**
- Writing status reports to client
- Onboarding new developers
- Planning future milestones
- Technical reviews

---

### GCP_SETUP_GUIDE.md
- **What:** Google Cloud Platform deployment guide
- **Length:** ~8 pages
- **Time to read:** 20 minutes
- **Contains:**
  - Project setup instructions
  - Service account configuration
  - Secret Manager setup for production
  - Cloud Run deployment steps

**Use this when:** Deploying to staging or production

---

## 🎬 Demo Scenario: Naruto The Movie

All demo guides use the same consistent example:

**Revenue:** $150,000,000 (box office)

**Participants:**
- Studio Pierrot (STUDIO) - 70% net profit
- Toho Distribution (DISTRIBUTOR) - 15% fee
- Investor Alpha Corp (INVESTOR) - $30M recoup cap, 15% net profit
- Investor Beta LLC (INVESTOR) - $20M recoup cap, 10% net profit
- Masashi Kishimoto (TALENT) - 5% net profit

**Expected Results:**
- Distributor: $22.5M (15% fee)
- Investor A: $41.625M ($30M recoup + $11.625M profit)
- Investor B: $27.75M ($20M recoup + $7.75M profit)
- Studio: $54.25M (70% of $77.5M remaining)
- Talent: $3.875M (5% of $77.5M remaining)
- **Total: $150M** ✅

---

## 🔧 Technical Setup

### Prerequisites
- Node.js v20.19.5
- pnpm installed
- Supabase database (DATABASE_URL in .env)

### Start API Server
```bash
cd apps/sfi-api
npx tsc --rootDir src --outDir dist
node dist/main.js
```

### Run Tests
```bash
cd apps/sfi-api
npx jest --testPathPattern=engine --verbose
```

### Access Swagger UI
Open browser: http://localhost:3001/docs

---

## 📊 Milestone Status

### ✅ Milestone 1: Core Settlement Engine (COMPLETE)
- Pure computation engine with 29 passing tests
- Database schema with status tracking
- Real Prisma service implementations
- REST API with Swagger documentation
- Audit trail with proof hashes
- Double-entry ledger integration

### 🔄 Milestone 2: Next Features (Planned)
- Multi-currency support
- Exchange rate handling
- Tax calculations
- Web UI (React frontend)
- Participant login portal

---

## 🆘 Need Help?

### During Demo
- **Server won't start:** See troubleshooting in [DEMO_QUICK_REFERENCE.md](./DEMO_QUICK_REFERENCE.md)
- **Wrong results:** Check you used correct participant IDs from Step 2
- **Client asks technical question:** Refer to [MILESTONE_1_IMPLEMENTATION.md](./MILESTONE_1_IMPLEMENTATION.md)

### For Development
- **Architecture questions:** See "Technical Architecture Summary" in [MILESTONE_1_IMPLEMENTATION.md](./MILESTONE_1_IMPLEMENTATION.md)
- **Test failures:** See "Test Results" section
- **API endpoints:** Open http://localhost:3001/docs

---

## 📝 Document Maintenance

### When to Update

**Update CLIENT_DEMO_GUIDE.md when:**
- API endpoints change
- Demo flow changes
- New features added

**Update MILESTONE_1_IMPLEMENTATION.md when:**
- New files added to codebase
- Test count changes
- Architecture changes
- Known limitations resolved

**Update DEMO_QUICK_REFERENCE.md when:**
- Demo steps change
- Expected results change
- New talking points needed

---

## 📂 File Structure

```
docs/
├── README.md                           # This file - documentation index
├── CLIENT_DEMO_GUIDE.md                # Non-technical demo walkthrough
├── DEMO_QUICK_REFERENCE.md             # One-page demo cheat sheet
├── MILESTONE_1_IMPLEMENTATION.md       # Complete technical report
└── GCP_SETUP_GUIDE.md                  # Cloud deployment guide
```

---

## 🚀 Quick Commands Reference

### Start Demo
```bash
# Terminal 1: Start API
cd apps/sfi-api
npx tsc --rootDir src --outDir dist
node dist/main.js

# Terminal 2: Open docs in browser
# http://localhost:3001/docs
```

### Run Tests
```bash
cd apps/sfi-api
npx jest --testPathPattern=engine --verbose
```

### Check Everything Compiles
```bash
npx tsc --noEmit --project apps/sfi-api/tsconfig.json
```

### Lint Code
```bash
npx eslint apps/sfi-api/src/modules/settlement/
```

---

**Last Updated:** February 12, 2026
**Version:** 1.0.0 (Milestone 1)
**Status:** Production Ready for Demo
