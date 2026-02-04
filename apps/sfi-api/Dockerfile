# ===========================================
# SFI-API Dockerfile
# Multi-stage build for NestJS + Prisma
# ===========================================

# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Install dependencies needed for native modules (Prisma)
RUN apk add --no-cache python3 make g++ openssl

# Copy workspace configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/sfi-api/package.json ./apps/sfi-api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy Prisma schema and generate client
COPY apps/sfi-api/prisma ./apps/sfi-api/prisma/
WORKDIR /app/apps/sfi-api
RUN pnpm db:generate

# Copy source code
WORKDIR /app
COPY packages/shared ./packages/shared/
COPY packages/tsconfig ./packages/tsconfig/
COPY apps/sfi-api/src ./apps/sfi-api/src/
COPY apps/sfi-api/tsconfig.json apps/sfi-api/tsconfig.build.json apps/sfi-api/nest-cli.json ./apps/sfi-api/

# Build the application
WORKDIR /app/apps/sfi-api
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm and dumb-init
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache dumb-init openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/apps/sfi-api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/sfi-api/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/apps/sfi-api/package.json ./

# Copy node_modules (production only would be ideal, but pnpm workspace needs full)
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/sfi-api/node_modules ./apps/sfi-api/node_modules

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/health || exit 1

# Start application with dumb-init for proper signal handling
CMD ["dumb-init", "node", "dist/main.js"]
