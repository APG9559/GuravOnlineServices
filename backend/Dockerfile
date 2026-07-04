# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN apk add --no-cache make gcc g++ python3 && \
    npm ci && \
    apk del make gcc g++ python3

# Copy source and build
COPY . .
RUN npm run build

# ─── Stage 2: Production image ───────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Only copy production deps
COPY package*.json ./
RUN apk add --no-cache make gcc g++ python3 && \
    npm ci --omit=dev && \
    apk del make gcc g++ python3 && \
    npm cache clean --force

# Install PostgreSQL client tools for database export/import feature
RUN apk add --no-cache postgresql16-client

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "dist/main"]
