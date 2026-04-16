# Auth Implementation — FEA-SFI

**Status:** ✅ Implemented (2026-04-13)
**Module path:** [apps/sfi-api/src/modules/auth/](../../apps/sfi-api/src/modules/auth/)
**Closes Sprint 1 gaps:** #1, #2, #3, #15, #16, #17, #18, #19, #20, #21, #22 — see [sprint-1-be-verification.md](../execution/sprints/sprint-1-be-verification.md)

This document is the single source of truth for how authentication works in the FEA-SFI backend. It covers architecture, request flows, the database schema, environment setup, and the operator runbook.

---

## 1. Stack & Decisions

| Concern | Decision | Why |
|---|---|---|
| Token strategy | **JWT access + refresh token (rotating)** | Stateless verification on every request via JWT; refresh tokens stored server-side give us revocation, rotation, and reuse-detection without paying the cost of a session DB lookup on every API call. |
| Password hashing | **bcrypt @ cost 12** | Battle-tested, universally available, sufficient cost factor for 2026 hardware. Argon2id is slightly stronger but bcrypt's ecosystem maturity wins for this stack. |
| Email provider | **Mailtrap (SMTP via nodemailer)** | Sandbox inbox in dev/staging, no real-user spam risk during testing. Nodemailer is provider-agnostic so swapping to SES / SendGrid later is a config change. |
| Avatar storage | **Field exists, upload deferred** | `User.avatarUrl` is nullable on the schema and returned in every auth response. Actual file upload is wired against a Cloud bucket in a follow-up. Until then the field stays `null` for every user. |
| Auth framework | `@nestjs/passport` + `passport-jwt` | Standard NestJS pattern. `JwtAuthGuard` wired globally via `APP_GUARD`; routes opt out with `@Public()`. |
| Token-reuse detection | **Replay → revoke entire chain** | If an already-revoked refresh token is presented, we mark every active refresh token for that user as revoked. Forces a full re-login if a token is leaked. |

---

## 2. Architecture

```
apps/sfi-api/src/modules/auth/
├── auth.module.ts                  # registers controller, services, strategies, APP_GUARD
├── controllers/
│   └── auth.controller.ts          # 7 routes — all explicitly @Public() except /me
├── services/
│   ├── auth.service.ts             # orchestrates register / login / forgot / reset / me
│   ├── token.service.ts            # JWT signing + refresh token rotation + reuse-detection
│   ├── password.service.ts         # bcrypt wrapper (hash, compare)
│   └── email.service.ts            # mailtrap via nodemailer; falls back to console log
├── strategies/
│   └── jwt.strategy.ts             # passport JWT — validates access tokens, attaches req.user
├── guards/
│   └── jwt-auth.guard.ts           # respects @Public() metadata
├── decorators/
│   ├── public.decorator.ts         # @Public() — opts out of the global guard
│   └── current-user.decorator.ts   # @CurrentUser() — resolves req.user
├── dto/
│   └── index.ts                    # all DTOs in one barrel
└── types/
    └── jwt-payload.ts              # AccessTokenPayload, RefreshTokenPayload, AuthenticatedUser
```

### Module dependencies

`AuthModule` imports:
- `PassportModule` — registered with `defaultStrategy: 'jwt'`
- `JwtModule` — registered empty; `TokenService` signs with explicit per-token-type secrets
- `AuditLogModule` — auth flows emit audit log entries (CREATED / LOGGED_IN / PASSWORD_RESET_*)

`AppModule` imports `AuthModule`. Order matters: it sits between `CommonModule` and the domain modules so the global `APP_GUARD` is registered before any controller is mounted.

---

## 3. Database Schema

Three new models in [prisma/schema.prisma](../../apps/sfi-api/prisma/schema.prisma) under section *"8) Auth"*:

### `User`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | PK |
| `email` | `String` (unique, varchar 255) | Lowercased on write |
| `passwordHash` | `String` (varchar 255) | bcrypt hash |
| `name` | `String` (varchar 255) | Single field — matches the Figma "Full Name" input (gap #18) |
| `avatarUrl` | `String?` (varchar 1000) | Nullable; reserved for Cloud bucket integration (gap #16) |
| `role` | `UserRole` enum | `ADMIN` or `USER`. Default `USER`. |
| `lastLoginAt` | `DateTime?` | Touched on each successful login |
| `createdAt` / `updatedAt` | `DateTime` | Standard timestamps |

Indexes: unique on `email`, secondary on `email` for fast lookups.

### `RefreshToken`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | PK — also the JWT `jti` claim |
| `userId` | `String` | FK → User, `onDelete: Cascade` |
| `tokenHash` | `String` (unique, varchar 255) | SHA-256 of the raw JWT — never store the JWT itself |
| `expiresAt` | `DateTime` | Mirrors the JWT `exp` |
| `revokedAt` | `DateTime?` | Set on rotation, logout, password reset, or reuse detection |
| `replacedBy` | `String?` | Chain-of-custody — id of the token that replaced this one on rotation |
| `userAgent`, `ipAddress` | `String?` | Captured for forensic visibility |
| `createdAt` | `DateTime` | |

### `PasswordResetToken`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | PK |
| `userId` | `String` | FK → User, `onDelete: Cascade` |
| `tokenHash` | `String` (unique, varchar 255) | SHA-256 of the raw token |
| `expiresAt` | `DateTime` | TTL = 1 hour from issue |
| `usedAt` | `DateTime?` | Set on successful reset OR when invalidated by a fresh "Resend" |
| `createdAt` | `DateTime` | |

### Migration

Run before deploying:

```bash
pnpm --filter @sfi-fea/api db:migrate -- --name add_auth_user_refresh_password_reset
```

This creates three tables (`users`, `refresh_tokens`, `password_reset_tokens`) and the `UserRole` enum. No backfill required — existing audit log `actor: 'system'` strings remain valid (see §8 below).

---

## 4. Endpoint Reference

All routes are mounted under `/auth`. Every route is marked `@Public()` *except* `GET /auth/me`. Public routes still validate body shape via `class-validator`.

| Method | Path | Purpose | Public? |
|---|---|---|---|
| POST | `/auth/register` | Create account, issue tokens | ✅ |
| POST | `/auth/login` | Authenticate, issue tokens | ✅ |
| POST | `/auth/refresh` | Rotate refresh → new token pair | ✅ |
| POST | `/auth/logout` | Revoke a single refresh token (idempotent) | ✅ |
| POST | `/auth/forgot-password` | Email a reset link (idempotent, constant-response) | ✅ |
| POST | `/auth/reset-password` | Set new password using email token | ✅ |
| GET | `/auth/me` | Re-hydrate current user from access token | 🔒 |

### Standard response envelope

`POST /register`, `/login`, `/refresh` all return:

```json
{
  "user": {
    "id": "uuid",
    "name": "Sarah Chen",
    "email": "sarah@example.com",
    "avatarUrl": null,
    "role": "USER"
  },
  "tokens": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "expiresIn": 900
  }
}
```

`expiresIn` is the access-token lifetime in seconds, so the FE doesn't need to decode the JWT to schedule a refresh.

---

## 5. Request Flows

### 5.1 Register

```
FE → POST /auth/register { fullName, email, password }
   ↓
AuthService.register
   ├─ findUnique(email)              → 409 if exists
   ├─ password.hash(plain, cost=12)
   ├─ user.create
   ├─ tokens.issueTokensForUser
   │    ├─ sign access JWT (15m)
   │    ├─ sign refresh JWT (7d) with jti = uuid
   │    └─ store RefreshToken (sha256(jwt) only)
   └─ auditLog.create(action=CREATED, entityType=User)
   ↓
{ user, tokens }
```

### 5.2 Login

```
FE → POST /auth/login { email, password }
   ↓
AuthService.login
   ├─ findUnique(email)
   │    └─ if missing: still call password.compare against a dummy hash → 401
   ├─ password.compare(plain, user.passwordHash) → 401 on mismatch
   ├─ user.update { lastLoginAt: now }
   ├─ tokens.issueTokensForUser
   └─ auditLog.create(action=LOGGED_IN, metadata={ ipAddress, userAgent })
   ↓
{ user, tokens }
```

The dummy-hash comparison on missing-email is a timing-safety measure — without it, the response time alone leaks whether an account exists.

### 5.3 Refresh (rotation + reuse-detection)

```
FE → POST /auth/refresh { refreshToken }
   ↓
TokenService.rotateRefreshToken
   ├─ jwt.verify(refreshToken, refreshSecret) → 401 if invalid/expired
   ├─ findUnique(refresh_tokens, id=jti) + sha256 match → 401 if not found
   ├─ if stored.revokedAt:                     ← REPLAY DETECTED
   │    └─ updateMany { userId } { revokedAt = now }   ← invalidate entire chain
   │    └─ throw 401 "reuse detected"
   ├─ if expired                               → 401
   ├─ issueTokensForUser (new pair)
   └─ update { revokedAt: now, replacedBy: newId }   ← rotation
   ↓
{ user, tokens } (fresh user object — role/email re-resolved from DB)
```

### 5.4 Forgot Password (idempotent, constant-response)

```
FE → POST /auth/forgot-password { email }
   ↓
AuthService.forgotPassword
   ├─ findUnique(email)
   │    └─ if missing: return success message anyway (anti-enumeration)
   ├─ updateMany(passwordResetToken, { userId, usedAt: null }) { usedAt: now }   ← Resend flow
   ├─ generate 32-byte token + sha256 hash
   ├─ create PasswordResetToken { tokenHash, expiresAt: now+1h }
   ├─ emailService.sendPasswordResetEmail(email, plain token)
   └─ auditLog.create(action=PASSWORD_RESET_REQUESTED)
   ↓
{ message: "If an account...", email }
```

The constant `message` is identical for both known and unknown emails. The `email` echo is the same value the FE sent, used by the success-state screen to render `"We sent a password reset link to **john@example.com**"` (gap #21).

### 5.5 Reset Password

```
FE → POST /auth/reset-password { token, newPassword }
   ↓
AuthService.resetPassword
   ├─ sha256(token) → findUnique(passwordResetToken)
   ├─ checks: exists, not used, not expired                → 401 otherwise
   ├─ password.hash(newPassword)
   ├─ $transaction:
   │    ├─ user.update { passwordHash }
   │    └─ passwordResetToken.update { usedAt: now }
   ├─ tokens.revokeAllRefreshTokensForUser(userId)         ← force re-login on every device
   └─ auditLog.create(action=PASSWORD_RESET_COMPLETED)
   ↓
{ message: "Password updated successfully." }
```

### 5.6 Me

```
FE → GET /auth/me   (Authorization: Bearer <accessToken>)
   ↓
JwtAuthGuard → JwtStrategy.validate
   └─ attaches req.user = { id, email, role }
   ↓
AuthService.me(req.user)
   └─ findUnique(user.id) → 404 if user was deleted
   ↓
{ id, name, email, avatarUrl, role }
```

This re-hydrates the user on every page load (gap #17). The FE should call this on app boot and after any token refresh.

### 5.7 Logout

```
FE → POST /auth/logout { refreshToken }
   ↓
TokenService.revokeRefreshToken
   └─ verify → updateMany { id: jti, revokedAt: null } { revokedAt: now }
```

Idempotent: invalid/expired tokens silently succeed. The FE should also drop the access token from local storage.

---

## 6. Configuration

All settings live in [.env.example](../../apps/sfi-api/.env.example) under the *Auth* section.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `JWT_ACCESS_SECRET` | ✅ | — | Signing key for access tokens. Generate with `openssl rand -base64 64`. |
| `JWT_ACCESS_EXPIRES_IN` | optional | `15m` | Access token lifetime. `s`/`m`/`h`/`d` units supported. |
| `JWT_REFRESH_SECRET` | ✅ | — | Signing key for refresh tokens. **Must differ from access secret.** |
| `JWT_REFRESH_EXPIRES_IN` | optional | `7d` | Refresh token lifetime. |
| `MAILTRAP_HOST` | optional | — | SMTP host (e.g. `sandbox.smtp.mailtrap.io`). Leave blank to log emails to console. |
| `MAILTRAP_PORT` | optional | — | SMTP port (Mailtrap sandbox uses `2525`). |
| `MAILTRAP_USER` | optional | — | SMTP username from your Mailtrap inbox. |
| `MAILTRAP_PASS` | optional | — | SMTP password from your Mailtrap inbox. |
| `MAIL_FROM` | optional | `noreply@fea-sfi.local` | `From` address on outgoing email. |
| `APP_URL` | optional | `http://localhost:3002` | Base URL used to compose links inside emails (reset-password landing page lives at `{APP_URL}/reset-password?token=…`). |

### Staging / Production

For non-dev environments the secrets should be loaded from GCP Secret Manager via the existing `GcpSecretsService` ([apps/sfi-api/src/config/gcp-secrets.service.ts](../../apps/sfi-api/src/config/gcp-secrets.service.ts)). The naming convention already in place (e.g. `JWT_SECRET_STAGING`) extends naturally:

| Secret name (GCP) | Process env (after load) |
|---|---|
| `JWT_ACCESS_SECRET_STAGING` | `JWT_ACCESS_SECRET` |
| `JWT_REFRESH_SECRET_STAGING` | `JWT_REFRESH_SECRET` |
| `MAILTRAP_USER_STAGING` (or production SES creds) | `MAILTRAP_USER` |
| `MAILTRAP_PASS_STAGING` | `MAILTRAP_PASS` |

The `GcpSecretsService` rewrites these into `process.env` before NestJS boots so no code change is needed when promoting.

---

## 7. Mailtrap Setup (5 minutes)

1. Create a free account at <https://mailtrap.io>.
2. **Email Testing → Inboxes → New Inbox** (e.g. *"FEA-SFI Dev"*).
3. Open the inbox → **SMTP Settings** tab → choose **Nodemailer** in the *Integrations* dropdown.
4. Copy `host`, `port`, `auth.user`, `auth.pass` into your local `.env`:

   ```
   MAILTRAP_HOST=sandbox.smtp.mailtrap.io
   MAILTRAP_PORT=2525
   MAILTRAP_USER=<from-mailtrap>
   MAILTRAP_PASS=<from-mailtrap>
   MAIL_FROM=noreply@fea-sfi.local
   ```
5. Restart the API. Trigger `POST /auth/forgot-password` — the email will land in your Mailtrap inbox within seconds.

If the env vars are not set, `EmailService` falls back to logging the message contents at log level `LOG`. The auth flow itself never throws on email delivery failure — the constant-response contract for `forgot-password` is preserved.

---

## 8. Avatar Cloud Bucket (Pending)

`User.avatarUrl` is implemented at the schema level and round-trips through every auth response, but **upload is not yet wired**. Today the field is always `null`.

When the bucket is provisioned, the work is roughly:

1. Add a new `apps/sfi-api/src/modules/uploads/` module wrapping the Cloud SDK.
2. Add `POST /users/me/avatar` (multipart) — write to bucket, return signed/public URL, persist on `User.avatarUrl`.
3. Add `DELETE /users/me/avatar` — remove from bucket, set field back to `null`.
4. Wire env vars (already drafted in `.env.example`):
   - `AVATAR_BUCKET_NAME`
   - `AVATAR_BUCKET_REGION`
   - `AVATAR_PUBLIC_URL_PREFIX`

The FE navbar already expects the field nullable, so existing screens won't break when the field becomes populated.

---

## 9. Audit Log

Auth-emitted audit log entries:

| Action | Entity | When |
|---|---|---|
| `CREATED` | `User` | After successful register |
| `LOGGED_IN` | `User` | After successful login (metadata: ipAddress, userAgent) |
| `PASSWORD_RESET_REQUESTED` | `User` | After forgot-password issues a reset token |
| `PASSWORD_RESET_COMPLETED` | `User` | After reset-password completes |

These all carry `actor = user.id` (the user themselves).

### Existing `actor: 'system'` calls — follow-up

Five existing services still write `actor: 'system'` for their audit log entries:

- `apps/sfi-api/src/modules/deals/services/deals.service.ts`
- `apps/sfi-api/src/modules/settlement/services/settlement.service.ts`
- `apps/sfi-api/src/modules/rules/services/rules.service.ts`
- `apps/sfi-api/src/modules/revenue/services/revenue.service.ts`
- `apps/sfi-api/src/modules/participants/services/participants.service.ts`

Wiring `req.user.id` through every service method is intentionally **deferred** — it cascades into every controller signature and every existing test mock. The clean fix is to add an `AsyncLocalStorage`-backed request context and have `AuditLogService.create()` automatically fall back to the CLS user when `actor === 'system'`. Tracked as a follow-up; not blocking Sprint 1.

---

## 10. Testing

Unit tests live in [auth.service.spec.ts](../../apps/sfi-api/src/modules/auth/services/auth.service.spec.ts). Coverage:

- `register` — happy path + email-already-exists → 409
- `login` — happy path + unknown email + wrong password (both → 401, both call `password.compare` for timing safety)
- `forgotPassword` — unknown email returns success without sending mail; known email invalidates prior tokens before issuing a fresh one (Resend flow)
- `resetPassword` — happy path (transaction + revoke all refresh tokens + audit) + unknown / used / expired token → 401
- `logout` — revokes the supplied refresh token
- `me` — returns the user profile

Run with:

```bash
pnpm --filter @sfi-fea/api test -- auth.service.spec
```

Integration / e2e tests against a real Postgres instance are pencilled in for the Sprint 2 hardening pass.

---

## 11. Operator Runbook

### First-time setup (local dev)

1. `pnpm install` from repo root (picks up `bcrypt`, `@nestjs/jwt`, `passport-jwt`, `nodemailer`).
2. Fill in JWT secrets + Mailtrap creds in `.env`.
3. `pnpm --filter @sfi-fea/api db:migrate` — applies the auth tables.
4. `pnpm --filter @sfi-fea/api dev` — boot the API.
5. Smoke test:
   ```bash
   curl -X POST http://localhost:3001/auth/register \
     -H "Content-Type: application/json" \
     -d '{"fullName":"Dev User","email":"dev@example.com","password":"devpass123!"}'
   ```

### Rotating JWT secrets

1. Generate new secrets: `openssl rand -base64 64`.
2. Update GCP Secret Manager (staging/prod) or `.env` (local).
3. Restart the API.
4. **All existing access + refresh tokens become invalid.** Every user must re-authenticate. There is no rolling rotation today — design the cutover during a low-traffic window.

### Revoking a user's sessions

```ts
await tokenService.revokeAllRefreshTokensForUser(userId);
```

Also useful: directly mark `revokedAt` on `refresh_tokens` for the user. The next `/auth/refresh` call will fail with 401, and the access token will expire on its own within `JWT_ACCESS_EXPIRES_IN` (default 15 min).

### Switching from Mailtrap to a real provider

`EmailService` constructs nodemailer with whatever SMTP host/port/user/pass the env provides. To switch:

1. Update env: replace `MAILTRAP_*` values with the real provider's SMTP credentials (SES, SendGrid, Postmark all expose SMTP).
2. (Optional) Refactor `EmailService` to inject provider-specific clients if SMTP isn't desirable.
3. No code changes required for the basic case.

---

## 12. Known Limitations / Follow-ups

- Avatar upload (Cloud bucket) — schema ready, endpoint not yet built.
- Existing `actor: 'system'` audit log calls — see §9.
- No 2FA / MFA — out of scope for Sprint 1.
- No email verification on register — out of scope for Sprint 1; if added later, gate `/auth/login` on `emailVerifiedAt`.
- No rate limiting on auth endpoints — relies on the existing global rate limiter; consider per-IP limits on `/auth/login` and `/auth/forgot-password` before opening to public traffic.
- No account lockout after N failed logins — same rationale; revisit during the security hardening pass.
- Refresh token storage is unbounded — a periodic job to delete `refresh_tokens` where `expiresAt < now() - 30d` is recommended.
