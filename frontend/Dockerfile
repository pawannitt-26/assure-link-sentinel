# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

# Railway: set VITE_API_URL to your backend public URL (mark as available at build time).
# Local Docker Compose: leave empty — browser uses /api via nginx proxy.
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Serve with nginx (Railway injects PORT at runtime)
FROM nginx:alpine AS runtime

RUN apk add --no-cache gettext wget

ENV PORT=8080
ENV BACKEND_PROXY=http://backend:8001

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD sh -c 'wget -qO- "http://127.0.0.1:${PORT:-8080}/" || exit 1'

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
