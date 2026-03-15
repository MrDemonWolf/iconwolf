# Stage 1: Install dependencies
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/iconwolf/package.json packages/iconwolf/
COPY packages/iconwolf-mcp/package.json packages/iconwolf-mcp/
COPY apps/web/package.json apps/web/
RUN bun install --frozen-lockfile

# Stage 2: Build
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/iconwolf/node_modules ./packages/iconwolf/node_modules
COPY --from=deps /app/packages/iconwolf-mcp/node_modules ./packages/iconwolf-mcp/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN bun run build

# Stage 3: Production runner
FROM node:22-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/iconwolf/node_modules ./packages/iconwolf/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/packages/iconwolf/dist ./packages/iconwolf/dist
COPY --from=builder /app/packages/iconwolf/package.json ./packages/iconwolf/
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/apps/web/package.json ./apps/web/

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

WORKDIR /app/apps/web
CMD ["node", "dist/server/index.js"]
