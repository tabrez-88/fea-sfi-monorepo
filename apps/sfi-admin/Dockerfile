# ===========================================
# SFI-Admin Dockerfile
# Multi-stage build for Next.js 15 (standalone)
# ===========================================

# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy workspace configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/sfi-admin/package.json ./apps/sfi-admin/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/tsconfig ./packages/tsconfig/
COPY packages/eslint-config ./packages/eslint-config/
COPY apps/sfi-admin ./apps/sfi-admin/

# Build args for env vars baked in at build time
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_ENV=staging

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV

# Build the Next.js app (requires next.config.ts output: 'standalone')
WORKDIR /app/apps/sfi-admin
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

WORKDIR /app

# Copy the standalone build artifacts
COPY --from=builder --chown=nextjs:nodejs /app/apps/sfi-admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/sfi-admin/.next/static ./apps/sfi-admin/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/sfi-admin/public ./apps/sfi-admin/public

# Set environment
ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME=0.0.0.0

USER nextjs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/ || exit 1

CMD ["dumb-init", "node", "apps/sfi-admin/server.js"]
