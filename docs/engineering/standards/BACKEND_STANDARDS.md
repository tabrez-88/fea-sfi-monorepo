# Backend Standards — `apps/sfi-api`

Canonical rules for every NestJS module written in this repo. These standards document what is already in place and define the shape for all new modules. Read this before creating any new file.

**Scope:** `apps/sfi-api`, `packages/shared`, `packages/api-contract`

---

## Table of Contents

1. [Module folder layout](#1-module-folder-layout)
2. [Naming conventions](#2-naming-conventions)
3. [Controllers](#3-controllers)
4. [Services](#4-services)
5. [DTOs](#5-dtos)
6. [Mappers](#6-mappers)
7. [Module registration](#7-module-registration)
8. [Error handling](#8-error-handling)
9. [Audit logging](#9-audit-logging)
10. [Prisma patterns](#10-prisma-patterns)
11. [Anti-patterns](#11-anti-patterns)

---

## 1. Module folder layout

Every feature module lives under `src/modules/<module-name>/` and follows this exact structure:

```
src/modules/<module-name>/
├── controllers/
│   └── <module>.controller.ts
├── services/
│   ├── <module>.service.ts
│   └── <module>.service.spec.ts      ← test lives next to service
├── dto/
│   └── index.ts                      ← all DTOs in one barrel file
├── mappers/
│   └── <module>.mapper.ts
└── <module>.module.ts
```

📎 **Template — new module scaffold:**

```
src/modules/participants/
├── controllers/
│   └── participants.controller.ts
├── services/
│   ├── participants.service.ts
│   └── participants.service.spec.ts
├── dto/
│   └── index.ts
├── mappers/
│   └── participant.mapper.ts
└── participants.module.ts
```

🔗 **Example:** [apps/sfi-api/src/modules/deals/](../../../apps/sfi-api/src/modules/deals/)

---

## 2. Naming conventions

| Artifact | Convention | Example |
|---|---|---|
| Module folder | `kebab-case` | `audit-log/` |
| Module file | `<name>.module.ts` | `deals.module.ts` |
| Controller file | `<name>.controller.ts` | `deals.controller.ts` |
| Service file | `<name>.service.ts` | `deals.service.ts` |
| Test file | `<name>.service.spec.ts` | `deals.service.spec.ts` |
| DTO file | `dto/index.ts` (barrel) | `deals/dto/index.ts` |
| Mapper file | `<entity>.mapper.ts` (singular) | `deal.mapper.ts` |
| Class names | `PascalCase` | `DealsService`, `DealMapper` |
| Method names | `camelCase` | `findAll`, `findOne`, `create` |
| Prisma model access | singular lowercase | `this.prisma.deal.findMany()` |

✅ **Do:** Use the exact method names `create`, `findAll`, `findOne`, `update`, `remove` for CRUD operations — they match the NestJS CRUD convention and are predictable.

❌ **Don't:** Use `get`, `fetch`, `list`, `save`, `delete` — stick to the five above.

---

## 3. Controllers

### Rules

- Controllers are **thin** — no business logic, no direct Prisma calls
- One controller per module; file lives in `controllers/`
- Every controller class gets `@ApiTags('<resource>')` (kebab-case resource name)
- Every route gets `@ApiOperation`, `@ApiResponse` for 200/201 and 400/404 as appropriate
- Use `ParseUUIDPipe` on all `:id` params — never trust raw string IDs
- Return type is always the DTO — never return a raw Prisma model

📎 **Template:**

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { CreateXxxDto, UpdateXxxDto, XxxResponseDto, PaginationQueryDto } from '../dto';
import { XxxService } from '../services/xxx.service';

@ApiTags('xxxs')
@Controller('xxxs')
export class XxxController {
  constructor(private readonly xxxService: XxxService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new xxx' })
  @ApiResponse({ status: 201, description: 'Created', type: XxxResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() dto: CreateXxxDto): Promise<XxxResponseDto> {
    return this.xxxService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all xxxs (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.xxxService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get xxx by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: XxxResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<XxxResponseDto> {
    return this.xxxService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update xxx' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: XxxResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateXxxDto,
  ): Promise<XxxResponseDto> {
    return this.xxxService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete xxx' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.xxxService.remove(id);
  }
}
```

🔗 **Example:** [apps/sfi-api/src/modules/deals/controllers/deals.controller.ts](../../../apps/sfi-api/src/modules/deals/controllers/deals.controller.ts)

---

## 4. Services

### Rules

- Services hold **all** business logic and all Prisma calls
- Every service class gets `private readonly logger = new Logger(XxxService.name)`
- Log at `logger.log()` on entry to every public method (what is being done + key ID)
- Use `logger.error()` for caught exceptions before re-throwing
- `exists(id)` is a lightweight helper for inter-module checks — always `select: { id: true }`
- Inject `AuditLogService` and call `auditLog.create()` after every write operation
- Return DTOs, not Prisma models — always pass through the mapper

📎 **Template:**

```typescript
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { CreateXxxDto, UpdateXxxDto, XxxResponseDto, PaginationQueryDto } from '../dto';
import { XxxMapper } from '../mappers/xxx.mapper';

@Injectable()
export class XxxService {
  private readonly logger = new Logger(XxxService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreateXxxDto): Promise<XxxResponseDto> {
    this.logger.log(`Creating xxx: ${dto.name}`);

    const record = await this.prisma.xxx.create({
      data: {
        // ...map dto fields
      },
    });

    await this.auditLog.create({
      actor: 'system',
      action: 'CREATED',
      entityType: 'Xxx',
      entityId: record.id,
      metadata: { name: record.name },
    });

    return XxxMapper.toResponse(record);
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    this.logger.log(`Fetching xxxs - page: ${page}, limit: ${limit}`);

    const [records, total] = await Promise.all([
      this.prisma.xxx.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.xxx.count(),
    ]);

    return {
      data: records.map(XxxMapper.toResponse),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<XxxResponseDto> {
    this.logger.log(`Fetching xxx: ${id}`);

    const record = await this.prisma.xxx.findUnique({ where: { id } });

    if (!record) {
      throw new NotFoundException(`Xxx with ID ${id} not found`);
    }

    return XxxMapper.toResponse(record);
  }

  async update(id: string, dto: UpdateXxxDto): Promise<XxxResponseDto> {
    this.logger.log(`Updating xxx: ${id}`);

    await this.findOne(id); // throws NotFoundException if missing

    const record = await this.prisma.xxx.update({
      where: { id },
      data: { ...dto },
    });

    await this.auditLog.create({
      actor: 'system',
      action: 'UPDATED',
      entityType: 'Xxx',
      entityId: record.id,
      metadata: dto,
    });

    return XxxMapper.toResponse(record);
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting xxx: ${id}`);

    await this.findOne(id); // throws NotFoundException if missing

    await this.prisma.xxx.delete({ where: { id } });

    await this.auditLog.create({
      actor: 'system',
      action: 'DELETED',
      entityType: 'Xxx',
      entityId: id,
      metadata: {},
    });
  }

  async exists(id: string): Promise<boolean> {
    const record = await this.prisma.xxx.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!record;
  }
}
```

🔗 **Example:** [apps/sfi-api/src/modules/deals/services/deals.service.ts](../../../apps/sfi-api/src/modules/deals/services/deals.service.ts)

---

## 5. DTOs

### Rules

- All DTOs for a module live in one file: `dto/index.ts`
- Every field gets `@ApiProperty` or `@ApiPropertyOptional`
- Every field gets `class-validator` decorators — no unvalidated inputs
- Use `!` for required fields, `?` for optional
- Enums are defined **in the DTO file**, not imported from Prisma — they parallel the Prisma enum
- `PaginationQueryDto` is shared — import it from the deals module barrel as a reference but define module-specific list query DTOs that extend or compose it

📎 **Template — DTO barrel file:**

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  MaxLength,
  MinLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum XxxStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

// ─── Create ───────────────────────────────────────────────────────────────────

export class CreateXxxDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: XxxStatusDto, default: XxxStatusDto.ACTIVE })
  @IsOptional()
  @IsEnum(XxxStatusDto)
  status?: XxxStatusDto;
}

// ─── Update ───────────────────────────────────────────────────────────────────

export class UpdateXxxDto {
  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ enum: XxxStatusDto })
  @IsOptional()
  @IsEnum(XxxStatusDto)
  status?: XxxStatusDto;
}

// ─── Response ─────────────────────────────────────────────────────────────────

export class XxxResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ enum: XxxStatusDto })
  status!: XxxStatusDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

// ─── List / Query ─────────────────────────────────────────────────────────────

export class XxxQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ enum: XxxStatusDto })
  @IsOptional()
  @IsEnum(XxxStatusDto)
  status?: XxxStatusDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
```

🔗 **Example:** [apps/sfi-api/src/modules/deals/dto/index.ts](../../../apps/sfi-api/src/modules/deals/dto/index.ts)

---

## 6. Mappers

### Rules

- One mapper per entity; file lives in `mappers/<entity>.mapper.ts` (entity name is **singular**)
- Mapper is a plain class with `static` methods — do not inject it or make it a provider
- One public method: `toResponse(entity): ResponseDto`
- Cast Prisma JSON fields explicitly to `Record<string, unknown> | null`
- Cast Prisma enum fields to the DTO enum type with `as XxxStatusDto`
- Never add logic to a mapper — it maps fields 1:1; computations belong in the service

📎 **Template:**

```typescript
import { Xxx } from '@prisma/client';

import { XxxResponseDto, XxxStatusDto } from '../dto';

export class XxxMapper {
  static toResponse(xxx: Xxx): XxxResponseDto {
    return {
      id: xxx.id,
      name: xxx.name,
      description: xxx.description,
      status: xxx.status as XxxStatusDto,
      metadata: xxx.metadata as Record<string, unknown> | null,
      createdAt: xxx.createdAt,
      updatedAt: xxx.updatedAt,
    };
  }
}
```

🔗 **Example:** [apps/sfi-api/src/modules/deals/mappers/deal.mapper.ts](../../../apps/sfi-api/src/modules/deals/mappers/deal.mapper.ts)

---

## 7. Module registration

### Rules

- Import `AuditLogModule` in every feature module that writes audit logs
- `exports` array: only export the service (never the controller or mapper)
- Cross-module dependency: inject via module `imports`, never by importing the class directly

📎 **Template:**

```typescript
import { Module } from '@nestjs/common';

import { AuditLogModule } from '../audit-log/audit-log.module';

import { XxxController } from './controllers/xxx.controller';
import { XxxService } from './services/xxx.service';

@Module({
  imports: [AuditLogModule],
  controllers: [XxxController],
  providers: [XxxService],
  exports: [XxxService],
})
export class XxxModule {}
```

🔗 **Example:** [apps/sfi-api/src/modules/deals/deals.module.ts](../../../apps/sfi-api/src/modules/deals/deals.module.ts)

---

## 8. Error handling

### Rules

- Use NestJS built-in HTTP exceptions — never `throw new Error()`
- `NotFoundException` — entity not found by ID
- `BadRequestException` — invalid business logic (not validation — that's class-validator's job)
- `ConflictException` — duplicate / uniqueness constraint
- `ForbiddenException` — permission denied
- Let validation pipe handle 400s for DTO validation; don't manually throw `BadRequestException` for things class-validator catches
- Pattern for "update/delete requires existence check": call `findOne()` first — it throws `NotFoundException` for you, keeping the update/delete method clean

✅ **Do:**
```typescript
async findOne(id: string): Promise<XxxResponseDto> {
  const record = await this.prisma.xxx.findUnique({ where: { id } });
  if (!record) {
    throw new NotFoundException(`Xxx with ID ${id} not found`);
  }
  return XxxMapper.toResponse(record);
}

async update(id: string, dto: UpdateXxxDto): Promise<XxxResponseDto> {
  await this.findOne(id); // re-use the above — single source of truth for the 404
  // ... rest of update
}
```

❌ **Don't:**
```typescript
// Don't duplicate the not-found check:
async update(id: string, dto: UpdateXxxDto) {
  const record = await this.prisma.xxx.findUnique({ where: { id } });
  if (!record) throw new NotFoundException(...);
  // ... 
}
```

---

## 9. Audit logging

Every write operation (`create`, `update`, `remove`) MUST emit an audit log entry after the Prisma write succeeds.

### Standard action strings

| Prisma operation | `action` value |
|---|---|
| `create` | `'CREATED'` |
| `update` | `'UPDATED'` |
| `delete` | `'DELETED'` |
| `suspend` / status change | `'STATUS_CHANGED'` |

### Pattern

```typescript
await this.auditLog.create({
  actor: 'system',           // replace with real user ID once auth is added
  action: 'CREATED',
  entityType: 'Xxx',         // PascalCase entity name
  entityId: record.id,
  dealId: record.dealId,     // include if the entity is deal-scoped
  metadata: {                // include relevant fields — not the entire object
    name: record.name,
    status: record.status,
  },
});
```

⚠️ **Careful:** `auditLog.create()` must be called **after** the Prisma write — if you call it before and the Prisma write fails, you'll have a phantom log entry.

---

## 10. Prisma patterns

### ✅ Do

- Use `findUnique` for single-by-ID lookups (enforced unique constraint)
- Use `select: { id: true }` for existence checks — never fetch full rows just to check existence
- Use `Promise.all([findMany, count])` for paginated list queries — parallel execution
- Use `Prisma.JsonNull` (not JS `null`) when explicitly storing null in a JSON column
- Cast `Prisma.InputJsonValue` when writing metadata fields

### ❌ Don't

- Don't use `findFirst` when you mean `findUnique` — they behave differently on indexed columns
- Don't fetch `include` relations in list endpoints unless the FE actually needs them (N+1 risk)
- Don't use raw SQL (`$queryRaw`) unless Prisma can't express the query — document why if you must

### Paginated query pattern

```typescript
const [records, total] = await Promise.all([
  this.prisma.xxx.findMany({
    where,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  }),
  this.prisma.xxx.count({ where }),  // always pass the same `where` — count must match
]);
```

---

## 11. Anti-patterns

| Anti-pattern | Why it's bad | What to do instead |
|---|---|---|
| Business logic in a controller | Untestable, bloated controller | Move to service |
| Returning raw Prisma models | Leaks DB schema, breaks on schema change | Use mapper → DTO |
| Calling `prisma.xxx` directly from a controller | Bypasses service layer, no audit log | Inject and call the service |
| Putting multiple entities' DTOs in one barrel | Creates circular dependencies | One `dto/index.ts` per module |
| `any` on DTO fields | Bypasses type safety | Use `Record<string, unknown>` for unstructured data |
| `console.log` | Not structured, drops in prod | Use `this.logger.log()` |
| Hard-coded `actor: 'system'` forever | No user attribution | Replace with `req.user.id` once auth is wired |
| Skipping `ParseUUIDPipe` on `:id` routes | Allows garbage IDs to hit DB | Always `@Param('id', ParseUUIDPipe) id: string` |
