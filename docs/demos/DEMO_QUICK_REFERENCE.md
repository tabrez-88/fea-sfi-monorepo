# Settlement Engine Demo - Quick Reference Card

**API URL:** http://localhost:3001
**Swagger Docs:** http://localhost:3001/docs

---

## Before Demo: Start Server

```bash
cd c:\Users\rivol\OneDrive\Documents\GitHub\fea-sfi-monorepo\apps\sfi-api
npx tsc --rootDir src --outDir dist
node dist/main.js
```

Wait for: `"Nest application successfully started"`

---

## Demo Flow (9 Steps)

| # | Endpoint | What to Copy |
|---|----------|--------------|
| 1 | `POST /deals` | Deal ID |
| 2 | `POST /deals/{dealId}/participants` (x5) | 5 Participant IDs |
| 3 | `POST /deals/{dealId}/rule-snapshots` | Rule Snapshot ID |
| 4 | `POST /deals/{dealId}/revenue-batches` | Revenue Batch ID |
| 5 | `PATCH /revenue-batches/{id}/validate` | - |
| 6 | `POST /deals/{dealId}/settlement-runs` | Settlement Run ID |
| 7 | `POST /settlement-runs/{id}/preview` | ⭐ CALCULATION |
| 8 | `POST /settlement-runs/{id}/finalize` | Final results |
| 9 | `GET /settlement-runs/{id}` | View details |

---

## Expected Results (Naruto Movie - $150M)

| Participant | Total | Breakdown |
|-------------|-------|-----------|
| **Distributor** | $22.5M | 15% fee upfront |
| **Investor A** | $41.625M | $30M recoup + $11.625M profit |
| **Investor B** | $27.75M | $20M recoup + $7.75M profit |
| **Studio** | $54.25M | 70% of $77.5M remaining |
| **Talent** | $3.875M | 5% of $77.5M remaining |
| **TOTAL** | **$150M** | ✅ Perfect balance |

---

## Key Talking Points

### 1. Speed
"Manual calculation would take hours - this takes milliseconds"

### 2. Accuracy
"$150M in, $150M out - perfectly balanced"

### 3. Transparency
"Every dollar is itemized by phase: fees → recoupment → profit split"

### 4. Audit Trail
"Proof hash ensures this calculation can never be disputed"

### 5. Automation
"Complex waterfall logic encoded in rules - no human error"

---

## Common Questions & Answers

**Q: What if revenue changes?**
A: Add another revenue batch, system carries forward balances

**Q: What if rules change?**
A: Create new rule snapshot, old settlements stay frozen

**Q: Can we undo a finalized settlement?**
A: No - but you can create a correction run

**Q: How do we know it's correct?**
A: 29 automated tests + cryptographic proof hash

---

## Troubleshooting

### Server won't start
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Kill process if needed
taskkill /PID <process_id> /F
```

### Compilation failed
```bash
# Clean and rebuild
cd apps/sfi-api
rm -rf dist
npx tsc --rootDir src --outDir dist
```

### Database error
Check `.env` has valid `DATABASE_URL`

---

## After Demo: Cleanup

```bash
# Stop server: Ctrl+C

# Optional: Clear demo data from database
cd apps/sfi-api
npx prisma studio
# Manually delete test records
```

---

## Files to Share with Client

1. **Technical Report:** `docs/MILESTONE_1_IMPLEMENTATION.md`
2. **Non-Technical Guide:** `docs/CLIENT_DEMO_GUIDE.md`
3. **This Quick Reference:** `docs/DEMO_QUICK_REFERENCE.md`

---

## Next Steps After Demo

1. ✅ Collect client feedback
2. ✅ Confirm Milestone 1 approval
3. ✅ Discuss Milestone 2 priorities:
   - Multi-currency support
   - Tax calculations
   - Web UI
   - Participant portal

---

**Good luck with the demo! 🚀**
