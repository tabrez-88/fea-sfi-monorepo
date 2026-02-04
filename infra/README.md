# Infrastructure

Local development infrastructure for SFI-FEA.

## Services

- **PostgreSQL 16**: Primary database

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- `.env` file created from `.env.example`

### Starting Services

```bash
# From the infra directory
cd infra

# Copy environment file
cp .env.example .env
# Edit .env with your desired credentials

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Or use Makefile from root

```bash
# From repository root
make db-up        # Start database
make db-down      # Stop database
make db-reset     # Reset database (removes volumes)
make db-logs      # View database logs
```

## Database Connection

Default connection settings:
- Host: `localhost`
- Port: `5432`
- Database: `sfi_fea_db`
- User: `sfi_user`
- Password: (set in `.env`)

Connection URL format:
```
postgresql://sfi_user:your_password@localhost:5432/sfi_fea_db?schema=public
```

## Initialization Scripts

Place any `.sql` files in the `init-scripts/` directory. They will be executed in alphabetical order when the database container is first created.

Example use cases:
- Creating extensions (uuid-ossp, pg_trgm, etc.)
- Creating additional schemas
- Inserting seed data

## Health Check

The PostgreSQL container includes a health check. You can verify the database is ready:

```bash
docker-compose ps
# Should show "healthy" status

# Or manually check
docker exec sfi-fea-postgres pg_isready -U sfi_user -d sfi_fea_db
```

## Troubleshooting

### Database won't start
1. Check if port 5432 is already in use
2. Verify Docker has enough resources
3. Check logs: `docker-compose logs postgres`

### Connection refused
1. Ensure container is running: `docker-compose ps`
2. Wait for health check to pass
3. Verify port mapping in docker-compose.yml

### Permission issues on init scripts
Ensure scripts are readable:
```bash
chmod 644 init-scripts/*.sql
```
