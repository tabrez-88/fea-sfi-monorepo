# ===========================================
# SFI-FEA Monorepo Makefile
# ===========================================

.PHONY: help install dev dev-api dev-fea build lint typecheck test clean db-up db-down db-reset db-logs db-migrate db-studio

# Default target
help:
	@echo "SFI-FEA Monorepo Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install       Install all dependencies"
	@echo "  make setup         Full setup (install + db + migrate)"
	@echo ""
	@echo "Development:"
	@echo "  make dev           Run all apps in development mode"
	@echo "  make dev-api       Run API only"
	@echo "  make dev-fea       Run frontend only"
	@echo ""
	@echo "Build & Test:"
	@echo "  make build         Build all packages and apps"
	@echo "  make lint          Run linting"
	@echo "  make typecheck     Run type checking"
	@echo "  make test          Run tests"
	@echo "  make clean         Clean all build artifacts"
	@echo ""
	@echo "Database:"
	@echo "  make db-up         Start PostgreSQL container"
	@echo "  make db-down       Stop PostgreSQL container"
	@echo "  make db-reset      Reset database (removes data)"
	@echo "  make db-logs       View database logs"
	@echo "  make db-migrate    Run Prisma migrations"
	@echo "  make db-generate   Generate Prisma client"
	@echo "  make db-studio     Open Prisma Studio"

# Setup
install:
	pnpm install

setup: install db-up
	@echo "Waiting for database to be ready..."
	@sleep 5
	$(MAKE) db-generate
	$(MAKE) db-migrate
	@echo "Setup complete! Run 'make dev' to start development servers."

# Development
dev:
	pnpm dev

dev-api:
	pnpm dev:api

dev-fea:
	pnpm dev:fea

# Build & Test
build:
	pnpm build

lint:
	pnpm lint

typecheck:
	pnpm typecheck

test:
	pnpm test

clean:
	pnpm clean

# Database
db-up:
	cd infra && docker-compose up -d

db-down:
	cd infra && docker-compose down

db-reset:
	cd infra && docker-compose down -v
	cd infra && docker-compose up -d
	@echo "Waiting for database to be ready..."
	@sleep 5
	$(MAKE) db-migrate

db-logs:
	cd infra && docker-compose logs -f postgres

db-migrate:
	pnpm db:migrate

db-generate:
	pnpm db:generate

db-studio:
	pnpm db:studio
