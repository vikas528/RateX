# ── Frontend production image ──────────────────────────────────────────────
# Used by the "production" Docker Compose profile.
# Two stages: build (Node) + serve (nginx).

# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ── Stage 2: serve ──────────────────────────────────────────────────────────
# nginx:alpine automatically processes files in /etc/nginx/templates/ using
# envsubst at container start — no extra scripting needed.
# The backend host/port are injected via environment variables at runtime.
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Place the template where nginx's entrypoint will expand it.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
