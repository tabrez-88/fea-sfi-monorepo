# SFI-FEA Monorepo

Settlement and Financial Infrastructure platform for managing deals, revenue allocation, and financial settlements.

## Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: Next.js 15 (React 19, TypeScript)
- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL 16
- **ORM**: Prisma

## Prerequisites

- **Node.js**: v20+ (LTS recommended)
- **pnpm**: v9+ (`npm install -g pnpm`)
- **Docker**: For local PostgreSQL

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repo-url>
cd sfi-fea

# Install dependencies
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment files
cp .env.example .env
cp apps/sfi-api/.env.example apps/sfi-api/.env
cp infra/.env.example infra/.env

# Edit the .env files with your configuration
```

### 3. Start Database

```bash
# Start PostgreSQL
make db-up

# Or manually
cd infra && docker-compose up -d
```

### 4. Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate
```

### 5. Run Development Servers

```bash
# Run all apps (frontend + backend)
pnpm dev

# Or run individually
pnpm dev:api   # Backend only (http://localhost:3001)
pnpm dev:fea   # Frontend only (http://localhost:3000)
```

## Project Structure

```
sfi-fea/
├── apps/
│   ├── fea/                    # Next.js frontend
│   │   ├── src/
│   │   │   └── app/            # App router pages
│   │   └── package.json
│   │
│   └── sfi-api/                # NestJS backend
│       ├── prisma/
│       │   └── schema.prisma   # Database schema
│       ├── src/
│       │   ├── common/         # Shared utilities, filters, interceptors
│       │   ├── modules/        # Domain modules
│       │   │   ├── deals/
│       │   │   ├── participants/
│       │   │   ├── rules/      # (placeholder)
│       │   │   ├── revenue/    # (placeholder)
│       │   │   ├── settlement/ # (placeholder)
│       │   │   ├── ledger/     # (placeholder)
│       │   │   └── documents/  # (placeholder)
│       │   ├── prisma/         # Prisma module
│       │   └── main.ts         # Entry point
│       └── package.json
│
├── packages/
│   ├── shared/                 # Shared types, enums, DTOs, utilities
│   ├── eslint-config/          # Shared ESLint configurations
│   ├── tsconfig/               # Shared TypeScript configurations
│   └── api-contract/           # OpenAPI spec & client (placeholder)
│
├── infra/
│   ├── docker-compose.yml      # Local development services
│   └── README.md
│
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # pnpm workspace config
├── turbo.json                  # Turborepo config
├── Makefile                    # Common commands
└── README.md
```

## Available Commands

### Root Level

```bash
pnpm dev          # Run all apps in dev mode
pnpm dev:api      # Run API only
pnpm dev:fea      # Run frontend only
pnpm build        # Build all packages/apps
pnpm lint         # Lint all packages/apps
pnpm typecheck    # Type check all packages/apps
pnpm test         # Run all tests
pnpm clean        # Clean all build artifacts
```

### Database

```bash
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run migrations (dev)
pnpm db:push      # Push schema changes (no migration)
pnpm db:studio    # Open Prisma Studio
```

### Make Commands

```bash
make help         # Show all available commands
make setup        # Full setup (install + db + migrate)
make dev          # Run all apps
make db-up        # Start PostgreSQL
make db-down      # Stop PostgreSQL
make db-reset     # Reset database
```

## API Documentation

When the API is running, Swagger documentation is available at:
- http://localhost:3001/docs

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/deals` | Create a deal |
| GET | `/api/v1/deals` | List all deals |
| GET | `/api/v1/deals/:id` | Get deal by ID |
| POST | `/api/v1/deals/:id/participants` | Add participant to deal |
| GET | `/api/v1/deals/:id/participants` | List deal participants |

## Database Schema

The database schema includes the following main entities:

- **Deals**: Core deal entity
- **Participants**: Deal participants with roles
- **Rule Snapshots**: Point-in-time rule configurations
- **Revenue Batches**: Revenue intake records
- **Settlement Runs**: Settlement execution records
- **Settlement Allocations**: Participant allocations
- **Ledger Journals**: Accounting journals
- **Ledger Postings**: Double-entry postings
- **Documents**: Evidence storage
- **Proof Records**: Audit proof records

See [prisma/schema.prisma](apps/sfi-api/prisma/schema.prisma) for full schema.

## Development

### Adding a New Package

```bash
mkdir packages/new-package
cd packages/new-package
pnpm init
```

Add to workspace by ensuring it's under `packages/` directory.

### Adding Dependencies

```bash
# Add to specific workspace
pnpm add lodash --filter @sfi-fea/api

# Add to root (dev dependencies for tooling)
pnpm add -D some-tool -w
```

### Running Specific Tasks

```bash
# Run lint for API only
pnpm lint --filter @sfi-fea/api

# Build shared package only
pnpm build --filter @sfi-fea/shared
```

## Environment Variables

### Root `.env`

```bash
NODE_ENV=development
POSTGRES_USER=sfi_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=sfi_fea_db
POSTGRES_PORT=5432
```

### API `.env` (apps/sfi-api/.env)

```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://sfi_user:password@localhost:5432/sfi_fea_db?schema=public
CORS_ORIGIN=http://localhost:3000
```

### Frontend `.env.local` (apps/fea/.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## License

UNLICENSED - Private repository
