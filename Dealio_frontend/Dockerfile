# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite bakes VITE_* vars at build time — pass them as build args
ARG VITE_AUTH_URL
ARG VITE_BUILDER_URL
ARG VITE_CUSTOMER_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_GOOGLE_CLIENT_ID

ENV VITE_AUTH_URL=$VITE_AUTH_URL
ENV VITE_BUILDER_URL=$VITE_BUILDER_URL
ENV VITE_CUSTOMER_URL=$VITE_CUSTOMER_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# ── Stage 2: serve with nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template

# The platform provides $PORT at runtime; envsubst replaces ${PORT} in the template.
# Only substitute PORT to avoid clobbering nginx's own $uri, $request_uri, etc.
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
