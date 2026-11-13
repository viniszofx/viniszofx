# Bun only installs dependencies. `next build` crashes under the Bun 1.3.14
# runtime inside Linux containers (segfault/SIGILL), so build and run on Node.
FROM oven/bun:1.3.14 AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_OUTPUT=standalone
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
# Every route is dynamic, so the build only imports server modules. These
# placeholders satisfy their startup checks without baking real secrets in;
# the runtime values come from .env.production (Neon).
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build \
    AUTH_NEON_URL=https://build.invalid/neondb/auth \
    NEON_AUTH_COOKIE_SECRET=build-only-placeholder-secret-0123456789abcdef \
    node node_modules/next/dist/bin/next build

# Only what drizzle-kit needs to apply the SQL in drizzle/ (versions match bun.lock).
FROM node:22-alpine AS migrate
WORKDIR /app
RUN npm install --omit=dev --no-audit --no-fund drizzle-kit@0.31.11 drizzle-orm@0.45.4 pg@8.23.1 dotenv@18.0.7 \
    && npm cache clean --force
COPY drizzle.config.ts ./
COPY drizzle ./drizzle
COPY lib/db/schema ./lib/db/schema
USER node
CMD ["node", "node_modules/drizzle-kit/bin.cjs", "migrate"]

# Standalone output: traced server files and the subset of node_modules they use.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
