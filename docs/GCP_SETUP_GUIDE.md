# GCP Setup Guide for SFI-FEA

This guide walks you through setting up Google Cloud Platform resources for the SFI-FEA monorepo deployment.

## Prerequisites

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed
- [Docker](https://docs.docker.com/get-docker/) installed
- GCP Project created (`fea-development-486410`)
- Owner or Editor access to the GCP project

## Table of Contents

1. [Initial GCP Setup](#1-initial-gcp-setup)
2. [Enable Required APIs](#2-enable-required-apis)
3. [Create Service Account](#3-create-service-account)
4. [Setup Workload Identity Federation](#4-setup-workload-identity-federation)
5. [Create Artifact Registry Repository](#5-create-artifact-registry-repository)
6. [Setup Secret Manager](#6-setup-secret-manager)
7. [Configure GitHub Secrets](#7-configure-github-secrets)
8. [Local Development Setup](#8-local-development-setup)
9. [Manual Deployment (Optional)](#9-manual-deployment-optional)

---

## 1. Initial GCP Setup

```bash
gcloud auth login

gcloud config set project fea-development-486410

gcloud config get-value project
```

## 2. Enable Required APIs

```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com cloudbuild.googleapis.com iam.googleapis.com iamcredentials.googleapis.com cloudresourcemanager.googleapis.com
```

## 3. Create Service Account

```bash
gcloud iam service-accounts create sfi-fea-cloudrun --display-name="SFI-FEA Cloud Run Service Account" --description="Service account for SFI-FEA Cloud Run services"

gcloud projects add-iam-policy-binding fea-development-486410 --member="serviceAccount:sfi-fea-cloudrun@fea-development-486410.iam.gserviceaccount.com" --role="roles/run.admin"

gcloud projects add-iam-policy-binding fea-development-486410 --member="serviceAccount:sfi-fea-cloudrun@fea-development-486410.iam.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding fea-development-486410 --member="serviceAccount:sfi-fea-cloudrun@fea-development-486410.iam.gserviceaccount.com" --role="roles/artifactregistry.reader"

gcloud projects add-iam-policy-binding fea-development-486410 --member="serviceAccount:sfi-fea-cloudrun@fea-development-486410.iam.gserviceaccount.com" --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding fea-development-486410 --member="serviceAccount:sfi-fea-cloudrun@fea-development-486410.iam.gserviceaccount.com" --role="roles/storage.objectAdmin"

gcloud iam service-accounts add-iam-policy-binding sfi-fea-cloudrun@fea-development-486410.iam.gserviceaccount.com --member="serviceAccount:sfi-fea-cloudrun@fea-development-486410.iam.gserviceaccount.com" --role="roles/iam.serviceAccountUser" --project="fea-development-486410"
```

## 4. Setup Workload Identity Federation

This allows GitHub Actions to authenticate with GCP without storing service account keys.

**Step 1: Create the pool** (already done if you ran it):

```bash
gcloud iam workload-identity-pools create "github-pool" --project="fea-development-486410" --location="global" --display-name="GitHub Actions Pool"
```

**Step 2: Create the provider** (replace `YOUR_GITHUB_USERNAME` with your GitHub username/org):

```bash
gcloud iam workload-identity-pools providers create-oidc "github-provider" --project="fea-development-486410" --location="global" --workload-identity-pool="github-pool" --display-name="GitHub Provider" --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" --attribute-condition="assertion.repository_owner=='tabrez-88'" --issuer-uri="https://token.actions.githubusercontent.com"
```

**Step 3: Get the provider path** (save this for GitHub secrets):

```bash
gcloud iam workload-identity-pools providers describe "github-provider" --project="fea-development-486410" --location="global" --workload-identity-pool="github-pool" --format="value(name)"
```

**Step 4: Get your project number:**

```bash
gcloud projects describe fea-development-486410 --format="value(projectNumber)"
```

**Step 5: Allow GitHub repo to impersonate service account** (replace `PROJECT_NUMBER` and `YOUR_GITHUB_USERNAME/fea-sfi-monorepo`):

```bash
gcloud iam service-accounts add-iam-policy-binding "sfi-fea-cloudrun@fea-development-486410.iam.gserviceaccount.com" --project="fea-development-486410" --role="roles/iam.workloadIdentityUser" --member="principalSet://iam.googleapis.com/projects/746359458493/locations/global/workloadIdentityPools/github-pool/attribute.repository/tabrez-88/fea-sfi-monorepo"
```

## 5. Create Artifact Registry Repository

```bash
gcloud artifacts repositories create sfi-fea-images --repository-format=docker --location=asia-southeast2 --description="Docker images for SFI-FEA services"

gcloud artifacts repositories add-iam-policy-binding sfi-fea-images --location=asia-southeast2 --member="serviceAccount:sfi-fea-cloudrun@fea-development-486410.iam.gserviceaccount.com" --role="roles/artifactregistry.writer"
```

## 6. Setup Secret Manager

Create secrets for staging environment. Each secret should be suffixed with `_STAGING`.

**DATABASE_URL** (replace with your Supabase connection string):

```bash
echo -n "postgresql://postgres:6Wdx%2F%2A39yYqW_HD@db.vbhayvobnjmsphjwbfzi.supabase.co:5432/postgres" | gcloud secrets create DATABASE_URL_STAGING --data-file=-
```

**DIRECT_URL** (for migrations):

```bash
echo -n "postgresql://postgres:6Wdx%2F%2A39yYqW_HD@db.vbhayvobnjmsphjwbfzi.supabase.co:5432/postgres?pgbouncer=true" | gcloud secrets create DIRECT_URL_STAGING --data-file=-
```

**JWT_SECRET** (auto-generate):

```bash
echo -n "$(openssl rand -base64 32)" | gcloud secrets create JWT_SECRET_STAGING --data-file=-
```

**JWT_REFRESH_SECRET** (auto-generate):

```bash
echo -n "$(openssl rand -base64 32)" | gcloud secrets create JWT_REFRESH_SECRET_STAGING --data-file=-
```

**CORS_ORIGIN**:

```bash
echo -n "https://fea-staging.example.com,http://localhost:3000" | gcloud secrets create CORS_ORIGIN_STAGING --data-file=-
```

**LOG_LEVEL**:

```bash
echo -n "info" | gcloud secrets create LOG_LEVEL_STAGING --data-file=-
```

**FRONTEND_URL**:

```bash
echo -n "https://fea-staging.example.com" | gcloud secrets create FRONTEND_URL_STAGING --data-file=-
```

**GCS_BUCKET_NAME**:

```bash
echo -n "sfi-fea-documents-staging" | gcloud secrets create GCS_BUCKET_NAME_STAGING --data-file=-
```

### Updating Secrets

```bash
echo -n "new-value" | gcloud secrets versions add SECRET_NAME_STAGING --data-file=-
```

### Listing Secrets

```bash
gcloud secrets list

gcloud secrets versions list SECRET_NAME_STAGING
```

## 7. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following repository secrets:

| Secret Name                      | Value                                                                                                  | Description                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------- |
| `GCP_PROJECT_ID`                 | `fea-development-486410`                                                                               | GCP Project ID                    |
| `GCP_NUMBERED_PROJECT_ID`        | _(run command below)_                                                                                  | GCP Project Number (numeric)      |
| `GCP_SERVICE_ACCOUNT`            | `sfi-fea-cloudrun@fea-development-486410.iam.gserviceaccount.com`                                      | Service account email             |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider` | Full WIF provider path            |
| `GCP_ARTIFACT_REGISTRY_REPO`     | `sfi-fea-images`                                                                                       | Artifact Registry repository name |
| `GCP_ARTIFACT_REGISTRY_LOCATION` | `asia-southeast2`                                                                                      | Artifact Registry location        |

### Getting Project Number

```bash
gcloud projects describe fea-development-486410 --format="value(projectNumber)"
```

### Getting Workload Identity Provider Path

```bash
gcloud iam workload-identity-pools providers describe "github-provider" --project="fea-development-486410" --location="global" --workload-identity-pool="github-pool" --format="value(name)"
```

## 8. Local Development Setup

### Authenticate for Local Development

```bash
gcloud auth application-default login
```

This creates credentials at:

- Windows: `%APPDATA%/gcloud/application_default_credentials.json`
- Linux/macOS: `~/.config/gcloud/application_default_credentials.json`

### Test Docker Build Locally

```bash
docker build -t sfi-api:local -f apps/sfi-api/Dockerfile .

docker run -p 3001:3001 -e NODE_ENV=development -e PORT=3001 -e DATABASE_URL="your-local-db-url" sfi-api:local
```

### Test Staging Configuration Locally

```bash
gcloud projects describe fea-development-486410 --format="value(projectNumber)"

set GCP_PROJECT_ID=PROJECT_NUMBER_HERE

docker-compose up sfi-api
```

## 9. Manual Deployment (Optional)

For manual deployment without GitHub Actions:

```bash
gcloud auth configure-docker asia-southeast2-docker.pkg.dev

docker build -t asia-southeast2-docker.pkg.dev/fea-development-486410/sfi-fea-images/sfi-api-staging:latest -f apps/sfi-api/Dockerfile .

docker push asia-southeast2-docker.pkg.dev/fea-development-486410/sfi-fea-images/sfi-api-staging:latest

gcloud run deploy sfi-api-staging --image=asia-southeast2-docker.pkg.dev/fea-development-486410/sfi-fea-images/sfi-api-staging:latest --region=asia-southeast2 --service-account=sfi-fea-cloudrun@fea-development-486410.iam.gserviceaccount.com --port=3001 --allow-unauthenticated --set-env-vars="NODE_ENV=staging,GCP_PROJECT_ID=PROJECT_NUMBER_HERE"

gcloud run services describe sfi-api-staging --region=asia-southeast2 --format="value(status.url)"
```

---

## Troubleshooting

### Secret Manager Access Denied

```bash
gcloud projects get-iam-policy fea-development-486410 --flatten="bindings[].members" --filter="bindings.members:sfi-fea-cloudrun@"

gcloud projects add-iam-policy-binding fea-development-486410 --member="serviceAccount:sfi-fea-cloudrun@fea-development-486410.iam.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
```

### Workload Identity Federation Issues

```bash
gcloud iam workload-identity-pools describe github-pool --project=fea-development-486410 --location=global

gcloud iam workload-identity-pools providers describe github-provider --project=fea-development-486410 --workload-identity-pool=github-pool --location=global
```

### Cloud Run Deployment Fails

```bash
gcloud run services logs read sfi-api-staging --region=asia-southeast2 --limit=50

gcloud artifacts docker images list asia-southeast2-docker.pkg.dev/fea-development-486410/sfi-fea-images
```

### Service Account Doesn't Exist Error

```bash
gcloud iam service-accounts list --project=fea-development-486410

gcloud iam service-accounts create sfi-fea-cloudrun --display-name="SFI-FEA Cloud Run Service Account" --description="Service account for SFI-FEA Cloud Run services"
```

---

## Quick Reference

### Important URLs

- **Cloud Run Console**: https://console.cloud.google.com/run?project=fea-development-486410
- **Artifact Registry**: https://console.cloud.google.com/artifacts?project=fea-development-486410
- **Secret Manager**: https://console.cloud.google.com/security/secret-manager?project=fea-development-486410
- **IAM**: https://console.cloud.google.com/iam-admin/iam?project=fea-development-486410
- **Service Accounts**: https://console.cloud.google.com/iam-admin/serviceaccounts?project=fea-development-486410

### Common Commands

```bash
gcloud run services list --region=asia-southeast2

gcloud run services describe sfi-api-staging --region=asia-southeast2

gcloud run services logs read sfi-api-staging --region=asia-southeast2 --limit=100

gcloud run services delete sfi-api-staging --region=asia-southeast2

gcloud iam service-accounts list --project=fea-development-486410
```
