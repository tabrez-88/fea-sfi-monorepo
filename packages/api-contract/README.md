# @sfi-fea/api-contract

API contract definitions and client generation for the SFI-FEA platform.

## Overview

This package contains:

1. **OpenAPI Specification** (`openapi/openapi.yaml`) - The source of truth for the API contract
2. **Generated TypeScript Client** (TODO) - Type-safe API client for frontend consumption
3. **Contract Testing Utilities** (TODO) - Tools for validating API implementations against the spec

## Structure

```
packages/api-contract/
├── openapi/
│   └── openapi.yaml       # OpenAPI 3.1 specification
├── src/
│   └── index.ts           # Endpoint definitions and exports
├── dist/                  # Built output (generated)
└── README.md
```

## Roadmap

### Phase 1: Contract Definition (Current)
- [x] Initial OpenAPI spec with deals and participants endpoints
- [ ] Add remaining domain endpoints (revenue, settlement, ledger, documents)
- [ ] Add authentication/authorization schemes

### Phase 2: Client Generation
- [ ] Set up `openapi-typescript-codegen` or `@hey-api/openapi-ts`
- [ ] Generate TypeScript client from spec
- [ ] Add request/response interceptors
- [ ] Export typed API client for frontend use

### Phase 3: Contract Testing
- [ ] Add `@stoplight/prism-cli` for mock server
- [ ] Set up contract testing with `dredd` or similar
- [ ] CI integration for contract validation

## Usage

### Importing Endpoint Definitions

```typescript
import { endpoints, API_BASE_PATH } from '@sfi-fea/api-contract';

// Use endpoint definitions
const dealsUrl = endpoints.deals.list;
const dealUrl = endpoints.deals.get('some-uuid');
```

### Future: Generated Client

```typescript
// TODO: After client generation is implemented
import { ApiClient } from '@sfi-fea/api-contract';

const client = new ApiClient({ baseUrl: 'http://localhost:3001' });

// Fully typed API calls
const deals = await client.deals.list({ page: 1, limit: 20 });
const deal = await client.deals.get({ dealId: 'uuid' });
```

## Development

```bash
# Build the package
pnpm build

# Validate OpenAPI spec (TODO)
pnpm validate:spec

# Generate client (TODO)
pnpm generate:client
```

## Contributing

When adding new API endpoints:

1. Update `openapi/openapi.yaml` with the new paths and schemas
2. Run spec validation
3. Regenerate the client
4. Update `src/index.ts` with endpoint definitions
