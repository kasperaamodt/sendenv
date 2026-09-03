# syntax=docker/dockerfile:1

FROM oven/bun:1.4.0 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS verify
WORKDIR /app
COPY . .
RUN bun run check && bun test

FROM oven/bun:1.4.0 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY --from=verify /app/app ./app
COPY --from=verify /app/drizzle ./drizzle
COPY --from=verify /app/static ./static
COPY --from=verify /app/migrate.ts ./migrate.ts
COPY --from=verify /app/server.ts ./server.ts
COPY --from=verify /app/tsconfig.json ./tsconfig.json
USER bun
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
	CMD ["bun", "-e", "const r=await fetch('http://127.0.0.1:3000/api/health');if(!r.ok)process.exit(1)"]
CMD ["bun", "run", "start"]
