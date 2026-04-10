# --- deps: production packages only ---
FROM oven/bun:1-alpine AS deps
WORKDIR /app

COPY package.json bun.lock* bunfig.toml ./
COPY packages/api/package.json ./packages/api/
COPY packages/ui/package.json ./packages/ui/

RUN bun install --frozen-lockfile --production

# --- final image ---
FROM oven/bun:1-alpine
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY packages/api/src ./packages/api/src
COPY packages/ui/src ./packages/ui/src

WORKDIR /app/packages/api
EXPOSE 8080
ENV PORT=8080
CMD ["bun", "run", "src/index.ts"]
