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

# Copy all source code
COPY packages/shared ./packages/shared/
COPY packages/tsconfig ./packages/tsconfig/
COPY apps/sfi-api ./apps/sfi-api/

# Build shared package first
WORKDIR /app/packages/shared
RUN pnpm build

# Generate Prisma client and build the API
WORKDIR /app/apps/sfi-api
RUN pnpm db:generate
RUN pnpm build

# Verify build output
RUN echo "=== Build verification ===" && \
    ls -la dist/ && \
    echo "=== main.js check ===" && \
    ls -la dist/main.js

# Production stage
FROM node:20-alpine AS production

# Install dumb-init
RUN apk add --no-cache dumb-init openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Set working directory to match build structure
WORKDIR /app/apps/sfi-api

# Copy workspace root package.json
COPY --from=builder --chown=nestjs:nodejs /app/package.json /app/pnpm-workspace.yaml /app/

# Copy app package.json
COPY --from=builder --chown=nestjs:nodejs /app/apps/sfi-api/package.json ./package.json

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/sfi-api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/sfi-api/prisma ./prisma

# Copy shared package with proper structure
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/package.json /app/packages/shared/
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/dist /app/packages/shared/dist

# Copy all node_modules from builder (maintains workspace links)
COPY --from=builder --chown=nestjs:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/sfi-api/node_modules ./node_modules

# Verify production structure
RUN echo "=== Production verification ===" && \
    pwd && \
    ls -la && \
    echo "=== dist folder ===" && \
    ls -la dist/ && \
    echo "=== main.js ===" && \
    ls -la dist/main.js

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
