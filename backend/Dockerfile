# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY backend/package.json ./
RUN npm install

COPY backend/tsconfig.json ./
COPY backend/src ./src

RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8001

RUN apk add --no-cache wget

COPY backend/package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY db/migrations ./db/migrations

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8001/api/health || exit 1

CMD ["node", "dist/server.js"]
