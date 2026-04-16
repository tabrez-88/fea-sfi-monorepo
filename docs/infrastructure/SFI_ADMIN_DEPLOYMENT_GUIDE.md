# SFI-Admin Deployment Guide (Staging → Cloud Run)

> **Audience**: Admin portal maintainers, new team members.  
> **Prerequisite**: The GCP setup in `GCP_SETUP_GUIDE.md` has already been completed (service accounts, Workload Identity Federation, Artifact Registry, and GitHub secrets are all set).

---

## What Was Set Up (Summary of Code Changes)

These files were added/modified so the admin portal can be deployed to Cloud Run:

| File | Change |
|---|---|
| `apps/sfi-admin/Dockerfile` | **NEW** — Multi-stage Docker build for Next.js standalone |
| `apps/sfi-admin/.dockerignore` | **NEW** — Prevents `.next`, `node_modules`, secrets from leaking into the image |
| `apps/sfi-admin/next.config.ts` | Added `output: 'standalone'` — required for the Docker image to work |
| `.github/workflows/deploy-staging.yml` | Added `deploy-sfi-admin` job, triggered when `apps/sfi-admin/**` changes |

---

## Step-by-Step: What YOU Need to Do

### Step 1 — Add One GitHub Secret

The admin build bakes `NEXT_PUBLIC_API_URL` into the image at build time (this is a Next.js requirement — `NEXT_PUBLIC_*` vars must be known at build time, not runtime).

Go to:  
**GitHub → Repository → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|---|---|
| `STAGING_ADMIN_API_URL` | The deployed URL of `sfi-api-staging` e.g. `https://sfi-api-staging-xxxx-as.a.run.app/api/v1` |

> [!TIP]
> Get the URL of the already-deployed API:
> ```bash
> gcloud run services describe sfi-api-staging --region=asia-southeast2 --format='value(status.url)'
> ```
> Then append `/api/v1` to it.

---

### Step 2 — Verify Existing GitHub Secrets Are Present

These should already exist from the GCP setup guide. Confirm in **Settings → Secrets and variables → Actions**:

| Secret | Expected Value |
|---|---|
| `GCP_PROJECT_ID` | `fea-development-486410` |
| `GCP_NUMBERED_PROJECT_ID` | (numeric project number) |
| `GCP_SERVICE_ACCOUNT` | `sfi-fea-cloudrun@fea-development-486410.iam.gserviceaccount.com` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/746359458493/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `GCP_ARTIFACT_REGISTRY_REPO` | `sfi-fea-images` |
| `GCP_ARTIFACT_REGISTRY_LOCATION` | `asia-southeast2` |

---

### Step 3 — Trigger the First Deployment

The workflow deploys automatically when **any file under `apps/sfi-admin/**`** is pushed to the `staging` branch.

```bash
# From your local machine, after merging your work to staging:
git checkout staging
git merge main   # or your feature branch
git push origin staging
```

GitHub Actions will:
1. Detect changes in `apps/sfi-admin/`
2. Build a Docker image with the API URL baked in
3. Push the image to Artifact Registry
4. Deploy `sfi-admin-staging` on Cloud Run (port 3002)
5. Print the live URL in the workflow logs

---

### Step 4 — Verify the Deployment

After the workflow completes, get the URL:

```bash
gcloud run services describe sfi-admin-staging \
  --region=asia-southeast2 \
  --format='value(status.url)'
```

Or on the **Cloud Run console**:  
https://console.cloud.google.com/run?project=fea-development-486410

---

## How the Deployment Works (Overview)

```
push to staging branch
        |
        v
detect-changes job
  -- checks if apps/sfi-admin/** changed
        |
        v (if changed)
deploy-sfi-admin job
  |-- Authenticate to GCP via Workload Identity Federation (no keys stored)
  |-- docker build -f apps/sfi-admin/Dockerfile
  |       --build-arg NEXT_PUBLIC_API_URL=<staging API url>
  |-- docker push -> asia-southeast2-docker.pkg.dev/fea-development-486410/sfi-fea-images/sfi-admin-staging
  +-- gcloud run deploy sfi-admin-staging --port=3002
```

The two jobs (`deploy-sfi-api` and `deploy-sfi-admin`) run **in parallel** — so changing both in one push deploys both simultaneously.

---

## Environment Variables

### How `NEXT_PUBLIC_*` vars work in Next.js + Docker

> [!IMPORTANT]
> Next.js `NEXT_PUBLIC_*` variables are **inlined at build time** into the JS bundle.  
> They **cannot** be changed at runtime via Cloud Run environment variables.
> 
> This means: if you change the API URL, you must **rebuild and redeploy** the image.

| Variable | How It's Set | Where |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | GitHub secret `STAGING_ADMIN_API_URL` passed as `--build-arg` | Baked into the image during `docker build` |
| `NEXT_PUBLIC_APP_ENV` | Hardcoded to `staging` in the workflow | Baked into the image during `docker build` |
| `NODE_ENV` | Set via `--set-env-vars` in `gcloud run deploy` | Runtime Cloud Run env var |

---

## Manual Deployment (Without GitHub Actions)

If you need to deploy manually from your local machine:

```bash
# 1. Authenticate Docker
gcloud auth configure-docker asia-southeast2-docker.pkg.dev

# 2. Get the sfi-api staging URL (to use as build arg)
API_URL=$(gcloud run services describe sfi-api-staging \
  --region=asia-southeast2 \
  --format='value(status.url)')/api/v1

# 3. Build the image
docker build \
  -t asia-southeast2-docker.pkg.dev/fea-development-486410/sfi-fea-images/sfi-admin-staging:latest \
  -f apps/sfi-admin/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL="${API_URL}" \
  --build-arg NEXT_PUBLIC_APP_ENV=staging \
  .

# 4. Push the image
docker push asia-southeast2-docker.pkg.dev/fea-development-486410/sfi-fea-images/sfi-admin-staging:latest

# 5. Deploy to Cloud Run
gcloud run deploy sfi-admin-staging \
  --image=asia-southeast2-docker.pkg.dev/fea-development-486410/sfi-fea-images/sfi-admin-staging:latest \
  --region=asia-southeast2 \
  --service-account=sfi-fea-cloudrun@fea-development-486410.iam.gserviceaccount.com \
  --port=3002 \
  --allow-unauthenticated \
  --project=fea-development-486410 \
  --min-instances=0 \
  --max-instances=5 \
  --memory=512Mi \
  --cpu=1 \
  --set-env-vars="NODE_ENV=staging"

# 6. Get the URL
gcloud run services describe sfi-admin-staging \
  --region=asia-southeast2 \
  --format='value(status.url)'
```

---

## Updating the API URL

If the `sfi-api-staging` URL changes (e.g., after recreating the service):

1. Get the new URL:
   ```bash
   gcloud run services describe sfi-api-staging --region=asia-southeast2 --format='value(status.url)'
   ```
2. Update the **`STAGING_ADMIN_API_URL`** GitHub secret with the new value + `/api/v1`
3. Trigger a new deployment by pushing to `staging` (even a trivial change like a comment)

---

## Troubleshooting

### Cloud Run service fails to start

```bash
# View recent logs
gcloud run services logs read sfi-admin-staging \
  --region=asia-southeast2 \
  --limit=50
```

Common causes:
- `next.config.ts` missing `output: 'standalone'` — already added, but verify it's there
- Wrong port (must be `3002`, matching what Cloud Run exposes)
- `server.js` path mismatch in Dockerfile CMD

### 404 / blank page after deployment

The `NEXT_PUBLIC_API_URL` might be wrong. Since it's baked in at build time, check the workflow logs for the `--build-arg` value used, then update `STAGING_ADMIN_API_URL` and redeploy.

### Workflow not triggering

- Confirm you pushed to the `staging` branch (not `main`)
- Check the **Actions** tab in GitHub for any skipped workflow runs
- Ensure the file you changed is under `apps/sfi-admin/` or `packages/`

---

## Quick Reference

| Resource | Link |
|---|---|
| Cloud Run console | https://console.cloud.google.com/run?project=fea-development-486410 |
| Artifact Registry | https://console.cloud.google.com/artifacts?project=fea-development-486410 |
| GitHub Actions | https://github.com/tabrez-88/fea-sfi-monorepo/actions |

```bash
# Handy commands
gcloud run services list --region=asia-southeast2
gcloud run services describe sfi-admin-staging --region=asia-southeast2
gcloud run services logs read sfi-admin-staging --region=asia-southeast2 --limit=100
gcloud run services delete sfi-admin-staging --region=asia-southeast2
```
