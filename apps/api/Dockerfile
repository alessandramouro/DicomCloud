# ─── Base ─────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache curl
WORKDIR /app
COPY package.json turbo.json ./
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/

# ─── Development ──────────────────────────────────────────────
FROM base AS development
ENV NODE_ENV=development
RUN npm install --workspace=packages/types --workspace=apps/api
COPY packages/types ./packages/types
COPY apps/api ./apps/api
WORKDIR /app/packages/types
RUN npm run build
WORKDIR /app/apps/api
RUN npx prisma generate
EXPOSE 3001 9464
CMD ["npx", "nest", "start", "--watch"]

# ─── Builder ──────────────────────────────────────────────────
FROM base AS builder
ENV NODE_ENV=production
RUN npm ci --workspace=packages/types --workspace=apps/api
COPY packages/types ./packages/types
COPY apps/api ./apps/api
WORKDIR /app/packages/types
RUN npm run build
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# ─── Production ───────────────────────────────────────────────
FROM node:20-alpine AS production
RUN apk add --no-cache curl dumb-init
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/packages/types/dist ./packages/types/dist

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s \
  CMD curl -f http://localhost:3001/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
