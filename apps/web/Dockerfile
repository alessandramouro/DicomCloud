# ─── Base ─────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ─── Development ──────────────────────────────────────────────
FROM base AS development
ENV NODE_ENV=development
COPY package.json turbo.json ./
COPY packages/types/package.json ./packages/types/
COPY apps/web/package.json ./apps/web/
RUN npm install --workspace=packages/types --workspace=apps/web
COPY packages/types ./packages/types
COPY apps/web ./apps/web
WORKDIR /app/packages/types
RUN npm run build
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ─── Builder ──────────────────────────────────────────────────
FROM base AS builder
ENV NODE_ENV=production
COPY package.json turbo.json ./
COPY packages/types/package.json ./packages/types/
COPY apps/web/package.json ./apps/web/
RUN npm ci --workspace=packages/types --workspace=apps/web
COPY packages/types ./packages/types
COPY apps/web ./apps/web
WORKDIR /app/packages/types
RUN npm run build
WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── Production ───────────────────────────────────────────────
FROM node:20-alpine AS production
RUN apk add --no-cache dumb-init
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
