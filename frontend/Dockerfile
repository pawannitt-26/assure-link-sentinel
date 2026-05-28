# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=
ARG VITE_BACKEND_URL=
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
RUN npm run build

# Stage 2: Serve with nginx (Cloud Run listens on PORT 8080)
FROM nginx:alpine AS runtime
ENV PORT=8080
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
