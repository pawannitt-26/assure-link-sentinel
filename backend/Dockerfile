# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache wget

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY migrations ./migrations

ENV PORT=8001
EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD sh -c 'wget --quiet --tries=1 --spider "http://127.0.0.1:${PORT:-8001}/api/health" || exit 1'

CMD ["node", "dist/server.js"]
