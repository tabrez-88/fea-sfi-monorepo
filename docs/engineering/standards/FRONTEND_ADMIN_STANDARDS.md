# Frontend Admin Standards — `apps/sfi-admin`

Canonical rules for every file written in the FEA SFI Admin Portal. These standards apply **strictly** — they are not guidelines, they are the shape of the codebase. Read this end-to-end before writing your first line.

**Scope:** `apps/sfi-admin` only. `apps/fea` (public marketing site) is exempt — follow its existing conventions when editing that app.

---

## Table of Contents

1. [Folder structure](#1-folder-structure)
2. [TypeScript configuration](#2-typescript-configuration)
3. [Environment variables](#3-environment-variables)
4. [Constants](#4-constants)
5. [Types](#5-types)
6. [API client — Axios](#6-api-client--axios)
7. [React Query — data fetching hooks](#7-react-query--data-fetching-hooks)
8. [React Query — mutation hooks](#8-react-query--mutation-hooks)
9. [Components — shadcn/ui](#9-components--shadcnui)
10. [Services layer](#10-services-layer)
11. [Utils](#11-utils)
12. [Naming conventions](#12-naming-conventions)
13. [Anti-patterns](#13-anti-patterns)

---

## 1. Folder structure

```
apps/sfi-admin/
├── src/
│   ├── app/                        # Next.js App Router — pages only (no logic)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── (dashboard)/
│   │       ├── layout.tsx
│   │       ├── deals/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       └── participants/
│   │           └── page.tsx
│   ├── components/                 # Reusable UI components
│   │   ├── ui/                     # shadcn generated components (do not hand-edit)
│   │   ├── layout/                 # Shell, Sidebar, Header, etc.
│   │   └── <feature>/              # Feature-specific composites
│   │       └── DealCard.tsx
│   ├── hooks/                      # React Query hooks (queries + mutations)
│   │   ├── deals/
│   │   │   ├── useDeals.ts
│   │   │   ├── useDeal.ts
│   │   │   └── useCreateDeal.ts
│   │   └── participants/
│   │       └── useParticipants.ts
│   ├── services/                   # Raw API call functions (no React)
│   │   ├── deals.service.ts
│   │   └── participants.service.ts
│   ├── types/                      # TypeScript type/interface definitions
│   │   ├── deal.types.ts
│   │   ├── participant.types.ts
│   │   └── api.types.ts            # Shared API shapes (pagination, errors)
│   ├── constants/                  # App-wide constants
│   │   ├── routes.ts
│   │   ├── api.ts
│   │   ├── query-keys.ts
│   │   └── ui.ts                   # Colors, sizes, status badge variants
│   ├── utils/                      # Pure functions — no React, no side effects
│   │   ├── format.ts
│   │   ├── date.ts
│   │   └── validators.ts
│   └── lib/                        # Third-party client setup
│       ├── axios.ts                # Configured Axios instance
│       └── query-client.ts         # QueryClient singleton
├── public/
├── next.config.ts
├── tsconfig.json
└── package.json
```

### Rules

✅ **Do:**
- Pages (`app/`) only import components and call hooks — no direct service calls in page files
- `hooks/` owns all React Query calls — no `useQuery` or `useMutation` outside `hooks/`
- `services/` are pure async functions — no React, no hooks, no side effects beyond the HTTP call
- `types/` are pure TypeScript types/interfaces — no runtime values, no enums (use `const` objects instead)
- `constants/` are runtime values — routes, API paths, query keys, UI tokens

❌ **Don't:**
- Don't put `useQuery` / `useMutation` directly inside page or component files
- Don't call `axios` directly from components or pages — always go through `services/`
- Don't define types inline inside component props unless they are truly one-off and local
- Don't create `utils/` helpers that have React dependencies — those belong in `hooks/`

---

## 2. TypeScript configuration

📎 **`tsconfig.json` — required settings:**

```json
{
  "extends": "@sfi-fea/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Rules

✅ **Do:**
- `strict: true` — enables `strictNullChecks`, `strictFunctionTypes`, etc.
- `noUncheckedIndexedAccess: true` — array access returns `T | undefined`, not `T`
- `noUnusedLocals / noUnusedParameters` — unused code is a compile error
- `paths` alias `@/*` → `src/*` — use `@/components/...` not `../../components/...`

❌ **Don't:**
- Never use `// @ts-ignore` or `// @ts-expect-error` — fix the type instead
- Never use `as any` — use `as unknown as T` if you must cast, with a comment explaining why
- Never disable strict checks for a file via `// @ts-nocheck`

---

## 3. Environment variables

📎 **`src/lib/env.ts` — validated env config:**

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
});

// Throws at startup if env vars are missing or invalid
export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
});
```

📎 **`.env.local` template:**

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_ENV=development
```

### Rules

- All env vars used in client code must be `NEXT_PUBLIC_` prefixed
- Always validate env vars at startup via the Zod schema — never access `process.env` directly in components
- Import from `@/lib/env` everywhere: `import { env } from '@/lib/env'`

---

## 4. Constants

### `src/constants/routes.ts`

```typescript
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  DEALS: {
    LIST: '/deals',
    CREATE: '/deals/create',
    DETAIL: (id: string) => `/deals/${id}`,
    EDIT: (id: string) => `/deals/${id}/edit`,
  },
  PARTICIPANTS: {
    LIST: '/participants',
    DETAIL: (id: string) => `/participants/${id}`,
  },
  RULES: {
    LIST: '/rules',
  },
  REVENUE: {
    LIST: '/revenue',
  },
  SETTLEMENT: {
    RUNS: '/settlement/runs',
    DETAIL: (id: string) => `/settlement/runs/${id}`,
  },
  AUDIT_LOG: '/audit-log',
} as const;
```

### `src/constants/api.ts`

```typescript
import { env } from '@/lib/env';

const BASE = env.NEXT_PUBLIC_API_URL;

export const API_ENDPOINTS = {
  DEALS: {
    LIST: `${BASE}/deals`,
    CREATE: `${BASE}/deals`,
    DETAIL: (id: string) => `${BASE}/deals/${id}`,
    UPDATE: (id: string) => `${BASE}/deals/${id}`,
    DELETE: (id: string) => `${BASE}/deals/${id}`,
  },
  PARTICIPANTS: {
    LIST: `${BASE}/participants`,
    CREATE: `${BASE}/participants`,
    DETAIL: (id: string) => `${BASE}/participants/${id}`,
  },
  RULES: {
    LIST: `${BASE}/rules`,
    DETAIL: (id: string) => `${BASE}/rules/${id}`,
  },
  REVENUE: {
    LIST: `${BASE}/revenue`,
  },
  SETTLEMENT: {
    RUNS: `${BASE}/settlement/runs`,
    RUN_DETAIL: (id: string) => `${BASE}/settlement/runs/${id}`,
    TRIGGER: `${BASE}/settlement/runs`,
  },
  AUDIT_LOG: {
    LIST: `${BASE}/audit-logs`,
  },
} as const;
```

### `src/constants/query-keys.ts`

```typescript
export const QUERY_KEYS = {
  DEALS: {
    ALL: ['deals'] as const,
    LIST: (params?: Record<string, unknown>) => ['deals', 'list', params] as const,
    DETAIL: (id: string) => ['deals', id] as const,
  },
  PARTICIPANTS: {
    ALL: ['participants'] as const,
    LIST: (params?: Record<string, unknown>) => ['participants', 'list', params] as const,
    DETAIL: (id: string) => ['participants', id] as const,
  },
  RULES: {
    ALL: ['rules'] as const,
    LIST: (params?: Record<string, unknown>) => ['rules', 'list', params] as const,
    DETAIL: (id: string) => ['rules', id] as const,
  },
  REVENUE: {
    ALL: ['revenue'] as const,
    LIST: (params?: Record<string, unknown>) => ['revenue', 'list', params] as const,
  },
  SETTLEMENT: {
    RUNS: ['settlement', 'runs'] as const,
    RUN_DETAIL: (id: string) => ['settlement', 'runs', id] as const,
  },
  AUDIT_LOG: {
    LIST: (params?: Record<string, unknown>) => ['audit-log', 'list', params] as const,
  },
} as const;
```

### `src/constants/ui.ts`

```typescript
// Status badge variants — map API enums to shadcn Badge variant
export const DEAL_STATUS_VARIANTS = {
  DRAFT: 'secondary',
  ACTIVE: 'default',
  SUSPENDED: 'outline',
  CLOSED: 'destructive',
} as const satisfies Record<string, 'default' | 'secondary' | 'outline' | 'destructive'>;

// Table page size options
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

// Sidebar nav width
export const SIDEBAR_WIDTH = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 64;
```

### Rules

- All route strings live in `ROUTES` — never hardcode a path string in a component
- All API URLs live in `API_ENDPOINTS` — never concatenate `env.NEXT_PUBLIC_API_URL` + a path in a service file
- All query keys live in `QUERY_KEYS` — never write `['deals']` inline in a hook
- All UI constants (colors, sizes, variants) live in `ui.ts` — never hardcode `'secondary'` badge variants inline

---

## 5. Types

### Rules

- One file per domain entity: `deal.types.ts`, `participant.types.ts`, etc.
- Use `interface` for object shapes that components and services consume
- Use `type` for unions, intersections, and utility derivations
- Use `const` objects (not TypeScript `enum`) for discriminated union values — avoids enum pitfalls
- Re-export from `types/index.ts` for clean imports

📎 **`src/types/deal.types.ts` — template:**

```typescript
// Mirror the backend DealStatus enum as a const object
export const DealStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  CLOSED: 'CLOSED',
} as const;

export type DealStatus = (typeof DealStatus)[keyof typeof DealStatus];

export interface Deal {
  id: string;
  name: string;
  description: string | null;
  status: DealStatus;
  effectiveDate: string; // ISO string from API
  terminationDate: string | null;
  metadata: Record<string, unknown> | null;
  participantsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDealInput {
  name: string;
  description?: string;
  status?: DealStatus;
  effectiveDate: string;
  terminationDate?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateDealInput extends Partial<CreateDealInput> {}
```

📎 **`src/types/api.types.ts` — shared API shapes:**

```typescript
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface ListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
```

---

## 6. API client — Axios

📎 **`src/lib/axios.ts` — configured instance:**

```typescript
import axios, { AxiosError } from 'axios';

import { env } from '@/lib/env';

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

// ─── Request interceptor — attach auth token ─────────────────────────────────
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response interceptor — handle 401 ───────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
```

### Rules

- Only one Axios instance exists in the app — `apiClient` from `@/lib/axios`
- Never call `axios.get(...)` directly — always `apiClient.get(...)`
- Never pass auth tokens manually in service files — the request interceptor handles it
- The 401 redirect lives in the interceptor only — no other code redirects to login

---

## 7. React Query — data fetching hooks

📎 **`src/lib/query-client.ts`:**

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,     // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && 'response' in error) {
          const status = (error as { response?: { status?: number } }).response?.status;
          if (status && status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
    },
  },
});
```

📎 **`src/hooks/deals/useDeals.ts` — list query hook template:**

```typescript
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { dealsService } from '@/services/deals.service';
import type { ListParams } from '@/types/api.types';

export function useDeals(params?: ListParams) {
  return useQuery({
    queryKey: QUERY_KEYS.DEALS.LIST(params),
    queryFn: () => dealsService.list(params),
  });
}
```

📎 **`src/hooks/deals/useDeal.ts` — single item query hook template:**

```typescript
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { dealsService } from '@/services/deals.service';

export function useDeal(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.DEALS.DETAIL(id),
    queryFn: () => dealsService.getById(id),
    enabled: Boolean(id),
  });
}
```

### Rules

- Every query hook returns the raw `useQuery` result — don't cherry-pick `{ data }` inside the hook
- Always pass `enabled: Boolean(id)` when the query depends on a param that might be undefined
- `queryKey` always comes from `QUERY_KEYS` — never write inline arrays
- `queryFn` always calls a `services/` function — never inline Axios calls

---

## 8. React Query — mutation hooks

📎 **`src/hooks/deals/useCreateDeal.ts` — mutation hook template:**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { dealsService } from '@/services/deals.service';
import type { CreateDealInput } from '@/types/deal.types';

export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDealInput) => dealsService.create(input),
    onSuccess: () => {
      // Invalidate the list so the new deal appears
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEALS.ALL });
    },
  });
}
```

📎 **`src/hooks/deals/useUpdateDeal.ts`:**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { dealsService } from '@/services/deals.service';
import type { UpdateDealInput } from '@/types/deal.types';

export function useUpdateDeal(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateDealInput) => dealsService.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEALS.DETAIL(id) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEALS.ALL });
    },
  });
}
```

### Rules

- Every mutation hook **must** call `invalidateQueries` on success — stale data is a user-facing bug
- Invalidate both the detail key AND the list/ALL key when a record is created or updated
- Pass `onError` if the component needs to display a toast — the hook handles the side effect, not the component
- Never call `mutate` directly from a `useEffect` — mutations are triggered by user actions

---

## 9. Components — shadcn/ui

### Rules

- `src/components/ui/` contains **only** shadcn-generated files — do not hand-edit these
- Re-export from `ui/` if you need to wrap a shadcn component with project-specific defaults
- Composite components (e.g., `DealStatusBadge`) live in `src/components/<feature>/`
- Shell components (Sidebar, Header, PageLayout) live in `src/components/layout/`

📎 **`src/components/deals/DealStatusBadge.tsx` — composite component template:**

```tsx
import { Badge } from '@/components/ui/badge';
import { DEAL_STATUS_VARIANTS } from '@/constants/ui';
import type { DealStatus } from '@/types/deal.types';

interface DealStatusBadgeProps {
  status: DealStatus;
}

export function DealStatusBadge({ status }: DealStatusBadgeProps) {
  return (
    <Badge variant={DEAL_STATUS_VARIANTS[status]}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}
```

📎 **Page component pattern (thin page, logic in hooks):**

```tsx
// app/(dashboard)/deals/page.tsx
import { DealsTable } from '@/components/deals/DealsTable';

export default function DealsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Deals</h1>
      </div>
      <DealsTable />
    </div>
  );
}
```

```tsx
// components/deals/DealsTable.tsx
'use client';

import { useState } from 'react';
import { useDeals } from '@/hooks/deals/useDeals';
import { DEFAULT_PAGE_SIZE } from '@/constants/ui';
// ...

export function DealsTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useDeals({ page, limit: DEFAULT_PAGE_SIZE });

  if (isLoading) return <TableSkeleton />;
  if (isError) return <ErrorMessage />;

  return (
    // table JSX using data.data and data.meta
  );
}
```

### Component rules

✅ **Do:**
- Mark components that use hooks or browser APIs with `'use client'`
- Keep page files (`app/*/page.tsx`) as server components unless they directly use hooks
- Export components as named exports (not default) from `components/` — default only in `app/` pages
- Use Tailwind classes — no inline `style` objects, no CSS modules

❌ **Don't:**
- Don't fetch data in page components — delegate to a `<FeatureContainer>` client component
- Don't define new color values inline — use tokens from `constants/ui.ts` or Tailwind config
- Don't use `React.FC<Props>` — use plain function components with explicit `props: Props` parameter

---

## 10. Services layer

Services are plain async functions that wrap Axios calls. They have no React dependency.

📎 **`src/services/deals.service.ts` — template:**

```typescript
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api';
import type { Deal, CreateDealInput, UpdateDealInput } from '@/types/deal.types';
import type { PaginatedResponse, ListParams } from '@/types/api.types';

export const dealsService = {
  async list(params?: ListParams): Promise<PaginatedResponse<Deal>> {
    const { data } = await apiClient.get<PaginatedResponse<Deal>>(
      API_ENDPOINTS.DEALS.LIST,
      { params },
    );
    return data;
  },

  async getById(id: string): Promise<Deal> {
    const { data } = await apiClient.get<Deal>(API_ENDPOINTS.DEALS.DETAIL(id));
    return data;
  },

  async create(input: CreateDealInput): Promise<Deal> {
    const { data } = await apiClient.post<Deal>(API_ENDPOINTS.DEALS.CREATE, input);
    return data;
  },

  async update(id: string, input: UpdateDealInput): Promise<Deal> {
    const { data } = await apiClient.patch<Deal>(API_ENDPOINTS.DEALS.UPDATE(id), input);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.DEALS.DELETE(id));
  },
};
```

### Rules

- Services are exported as a `const` object of named async functions — not a class
- Every function is typed: input type + return type explicitly declared
- Services never import from `hooks/` — dependency goes one way: hooks → services → lib/axios
- Services never catch errors — let them propagate to React Query's error state

---

## 11. Utils

Utils are pure functions with no side effects.

📎 **`src/utils/format.ts`:**

```typescript
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
}
```

📎 **`src/utils/date.ts`:**

```typescript
export function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(isoString));
}

export function formatDateTime(isoString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString));
}

export function isDateAfter(a: string, b: string): boolean {
  return new Date(a) > new Date(b);
}
```

### Rules

- No React imports in utils — if you need `useState` or `useEffect`, it belongs in a hook
- No Axios calls in utils — HTTP belongs in services
- Utils are co-located by domain: `date.ts`, `format.ts`, `validators.ts` — not one giant `helpers.ts`

---

## 12. Naming conventions

| Artifact | Convention | Example |
|---|---|---|
| Page file | `page.tsx` (Next.js) | `app/deals/page.tsx` |
| Component file | `PascalCase.tsx` | `DealStatusBadge.tsx` |
| Hook file | `camelCase.ts`, `use` prefix | `useDeals.ts`, `useCreateDeal.ts` |
| Service file | `camelCase.service.ts` | `deals.service.ts` |
| Type file | `camelCase.types.ts` | `deal.types.ts` |
| Constants file | `kebab-case.ts` | `query-keys.ts`, `routes.ts` |
| Constant values | `SCREAMING_SNAKE_CASE` | `QUERY_KEYS`, `API_ENDPOINTS`, `ROUTES` |
| Component exports | Named (not default) | `export function DealCard()` |
| Page exports | Default | `export default function DealsPage()` |
| Interface names | `PascalCase`, no `I` prefix | `Deal`, `CreateDealInput` |
| Type names | `PascalCase` | `DealStatus`, `PaginatedResponse<T>` |

---

## 13. Anti-patterns

| Anti-pattern | Why it's bad | What to do instead |
|---|---|---|
| `useQuery` inside a page or component | Bypasses hook layer, can't be reused | Create a hook in `hooks/<feature>/` |
| `axios.get(...)` in a component | Bypasses interceptors, no auth header | Go through `services/` → `apiClient` |
| Hardcoded route strings (`href="/deals"`) | Breaks on rename | Use `ROUTES.DEALS.LIST` |
| Hardcoded API paths in service files | Breaks on base URL change | Use `API_ENDPOINTS.DEALS.LIST` |
| Inline query keys `['deals', id]` in hooks | Invalidation mismatch risk | Use `QUERY_KEYS.DEALS.DETAIL(id)` |
| TypeScript `enum` | Runtime footgun, poor tree-shaking | Use `const` object + `type` derivation |
| `as any` | Disables type checking | Use `as unknown as T` with a comment |
| Mutable `let` for constants | Signals the value might change | Use `const` |
| Fetching data in `useEffect` | Bypasses caching, double-fetch race | Use `useQuery` hook |
| Mutation without `invalidateQueries` | Stale data shown after write | Always invalidate on `onSuccess` |
| `console.log` in components | Leaks to production | Use a proper logger or remove before commit |
| Default exports from `components/` | Hard to trace in imports, IDEs struggle | Named exports only (except pages) |
| `style={{}}` inline objects | Creates new object on every render | Use Tailwind classes |
