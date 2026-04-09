# Testing Standards

Test naming, file placement, mock patterns, coverage expectations, and CI integration for both `apps/sfi-api` (BE) and `apps/sfi-admin` (FE).

---

## Table of Contents

1. [Backend (NestJS) — unit tests](#1-backend-nestjs--unit-tests)
2. [Backend — test file placement](#2-backend--test-file-placement)
3. [Frontend (Next.js) — unit tests](#3-frontend-nextjs--unit-tests)
4. [Frontend — test file placement](#4-frontend--test-file-placement)
5. [Frontend — API mocking with MSW](#5-frontend--api-mocking-with-msw)
6. [Coverage expectations](#6-coverage-expectations)
7. [CI integration](#7-ci-integration)
8. [Anti-patterns](#8-anti-patterns)

---

## 1. Backend (NestJS) — unit tests

### Setup pattern

Every service test follows the same three-section structure:

1. Mock `@prisma/client` at the top of the file
2. Build `mockPrismaService` and `mockAuditLogService` objects with `jest.fn()` methods
3. Wire them via `Test.createTestingModule` in `beforeEach`

📎 **Template — `xxx.service.spec.ts`:**

```typescript
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';

import { XxxService } from './xxx.service';

// ─── Mock @prisma/client ──────────────────────────────────────────────────────
jest.mock('@prisma/client', () => ({
  PrismaClient: class PrismaClient {},
  XxxStatus: {          // mirror all enum values the service uses
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
  },
  Prisma: {
    JsonNull: 'DbNull', // required for JSON null handling in Prisma
  },
}));

describe('XxxService', () => {
  let service: XxxService;

  const mockPrismaService = {
    xxx: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockAuditLogService = {
    create: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XxxService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<XxxService>(XxxService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // reset call counts and return values between tests
  });

  // ─── Smoke test ─────────────────────────────────────────────────────────────

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a record and return a response DTO', async () => {
      const dto = { name: 'Test Xxx' };
      const mockRecord = {
        id: 'uuid-1',
        name: 'Test Xxx',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.xxx.create.mockResolvedValue(mockRecord);

      const result = await service.create(dto);

      expect(result.id).toBe('uuid-1');
      expect(result.name).toBe('Test Xxx');
      expect(mockPrismaService.xxx.create).toHaveBeenCalledTimes(1);
      expect(mockAuditLogService.create).toHaveBeenCalledTimes(1);
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const mockRecords = [
        { id: 'uuid-1', name: 'Xxx 1', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
      ];

      mockPrismaService.xxx.findMany.mockResolvedValue(mockRecords);
      mockPrismaService.xxx.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a record when found', async () => {
      const mockRecord = {
        id: 'uuid-1',
        name: 'Test Xxx',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.xxx.findUnique.mockResolvedValue(mockRecord);

      const result = await service.findOne('uuid-1');

      expect(result.id).toBe('uuid-1');
    });

    it('should throw NotFoundException when record does not exist', async () => {
      mockPrismaService.xxx.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return the updated record', async () => {
      const existing = { id: 'uuid-1', name: 'Old Name', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() };
      const updated = { ...existing, name: 'New Name' };

      mockPrismaService.xxx.findUnique.mockResolvedValue(existing);
      mockPrismaService.xxx.update.mockResolvedValue(updated);

      const result = await service.update('uuid-1', { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(mockAuditLogService.create).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when updating a non-existent record', async () => {
      mockPrismaService.xxx.findUnique.mockResolvedValue(null);

      await expect(service.update('bad-id', { name: 'x' })).rejects.toThrow(NotFoundException);
    });
  });
});
```

🔗 **Example:** [apps/sfi-api/src/modules/deals/services/deals.service.spec.ts](../../../apps/sfi-api/src/modules/deals/services/deals.service.spec.ts)

### Test naming rules

- Top-level `describe` matches the class name: `describe('DealsService', ...)`
- Nested `describe` matches the method name: `describe('create', ...)`
- `it()` description uses plain English: `'should throw NotFoundException when deal not found'`
- Avoid `it('works')` — describe what input leads to what outcome

---

## 2. Backend — test file placement

✅ **Do:** place the spec file **next to** the file under test:

```
services/
├── deals.service.ts
└── deals.service.spec.ts   ← same folder
```

❌ **Don't:** create a separate `__tests__/` folder for backend services — it splits the mental model.

### What to test

| File | Test? | Notes |
|---|---|---|
| `*.service.ts` | ✅ Yes | Primary test target — all public methods |
| `*.controller.ts` | ⚠️ Optional | Thin controllers rarely need unit tests; integration tests cover them |
| `*.mapper.ts` | ⚠️ Optional | If mapper has conditional logic; skip for pure field mappings |
| `*.dto/index.ts` | ❌ No | class-validator decorators are tested implicitly by service tests |
| `*.module.ts` | ❌ No | Module wiring is tested by the NestJS bootstrap — not unit testable |

---

## 3. Frontend (Next.js) — unit tests

Use **Jest + React Testing Library** for components and hooks.

### Component test pattern

📎 **`DealStatusBadge.test.tsx` — component test template:**

```typescript
import { render, screen } from '@testing-library/react';

import { DealStatusBadge } from './DealStatusBadge';

describe('DealStatusBadge', () => {
  it('renders the status text', () => {
    render(<DealStatusBadge status="ACTIVE" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders DRAFT status', () => {
    render(<DealStatusBadge status="DRAFT" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });
});
```

### Hook test pattern (with React Query)

📎 **`useDeals.test.ts` — hook test template:**

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

import { useDeals } from './useDeals';

// MSW server set up in jest.setup.ts — handlers defined in src/mocks/handlers.ts

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useDeals', () => {
  it('returns paginated deals', async () => {
    const { result } = renderHook(() => useDeals(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(2); // matches MSW mock
    expect(result.current.data?.meta.total).toBe(2);
  });

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useDeals(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });
});
```

---

## 4. Frontend — test file placement

Place test files in a `__tests__/` folder **next to** the folder being tested:

```
components/deals/
├── __tests__/
│   └── DealStatusBadge.test.tsx
└── DealStatusBadge.tsx

hooks/deals/
├── __tests__/
│   └── useDeals.test.ts
└── useDeals.ts
```

### What to test

| File | Test? | Notes |
|---|---|---|
| Custom hooks (`use*.ts`) | ✅ Yes | Core business logic lives here |
| Composite components | ✅ Yes | Especially those with conditional rendering |
| `services/*.service.ts` | ✅ Yes | Test with MSW — verify correct URL and method |
| `utils/*.ts` | ✅ Yes | Pure functions, easy to test |
| `constants/*.ts` | ❌ No | Static values — no logic to test |
| `types/*.types.ts` | ❌ No | Compile-time only |
| Page components (`app/*/page.tsx`) | ⚠️ Optional | Integration/E2E covers pages better |
| shadcn `components/ui/` | ❌ No | Third-party — not our test responsibility |

---

## 5. Frontend — API mocking with MSW

Use [MSW (Mock Service Worker)](https://mswjs.io/) for all API call mocking in FE tests. Never mock `axios` directly — MSW intercepts at the network layer, which tests the full chain (service → axios → interceptors → response parsing).

📎 **`src/mocks/handlers.ts`:**

```typescript
import { http, HttpResponse } from 'msw';

import { API_ENDPOINTS } from '@/constants/api';

export const handlers = [
  http.get(API_ENDPOINTS.DEALS.LIST, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'uuid-1',
          name: 'Test Deal A',
          status: 'ACTIVE',
          effectiveDate: '2024-01-01T00:00:00.000Z',
          terminationDate: null,
          metadata: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'uuid-2',
          name: 'Test Deal B',
          status: 'DRAFT',
          effectiveDate: '2024-02-01T00:00:00.000Z',
          terminationDate: null,
          metadata: null,
          createdAt: '2024-02-01T00:00:00.000Z',
          updatedAt: '2024-02-01T00:00:00.000Z',
        },
      ],
      meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
  }),

  http.get(API_ENDPOINTS.DEALS.DETAIL(':id'), ({ params }) => {
    return HttpResponse.json({
      id: params['id'],
      name: 'Test Deal',
      status: 'ACTIVE',
      effectiveDate: '2024-01-01T00:00:00.000Z',
      terminationDate: null,
      metadata: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });
  }),
];
```

📎 **`src/mocks/server.ts`:**

```typescript
import { setupServer } from 'msw/node';

import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

📎 **`jest.setup.ts`:**

```typescript
import '@testing-library/jest-dom';
import { server } from '@/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 6. Coverage expectations

| App | Minimum line coverage | Priority |
|---|---|---|
| `apps/sfi-api` services | 80% | All public service methods must have at least one test |
| `apps/sfi-admin` hooks | 80% | Every custom hook must be tested |
| `apps/sfi-admin` utils | 90% | Pure functions should be fully covered |
| `apps/sfi-admin` services | 70% | MSW-based; test happy path + one error case |
| Components | 60% | Focus on conditional rendering and user interaction |

⚠️ **Coverage is a floor, not a goal.** 80% coverage with good test descriptions is better than 100% coverage with `it('should work')` tests.

---

## 7. CI integration

Tests run as part of the Turborepo pipeline. The task definition in `turbo.json`:

```json
{
  "tasks": {
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

Running tests:

```bash
# Run all tests across the monorepo
pnpm turbo test

# Run tests for a single app
pnpm turbo test --filter=sfi-api
pnpm turbo test --filter=sfi-admin

# Run tests in watch mode (local development)
pnpm --filter=sfi-api test:watch
pnpm --filter=sfi-admin test:watch
```

---

## 8. Anti-patterns

| Anti-pattern | Why it's bad | What to do instead |
|---|---|---|
| `jest.mock('axios')` in FE tests | Doesn't test interceptors or response parsing | Use MSW to mock at the network layer |
| Mocking the Prisma client itself (not `PrismaService`) | Can't reflect `PrismaService` injection | Mock `PrismaService` as a provider, not the Prisma module |
| `it('works')` test descriptions | Doesn't communicate intent; fails silently when renamed | Use descriptive `'should throw NotFoundException when...'` |
| Testing implementation details | Tests break on refactors, even when behavior is correct | Test observable outputs (return values, thrown errors) |
| `beforeAll` for mock setup | State leaks between tests | Use `beforeEach` + `afterEach(() => jest.clearAllMocks())` |
| Skipping `afterEach(() => server.resetHandlers())` in FE | MSW handlers bleed between tests | Always reset after each test |
| Testing DTOs / mappers separately | Usually pointless — service tests cover them implicitly | Only test mappers with non-trivial conditional logic |
| Snapshot tests for complex components | Snapshot diffs are unreadable; snapshots are never updated | Use explicit `expect(screen.getByText(...))` assertions |
