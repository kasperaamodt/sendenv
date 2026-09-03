# syntax=docker/dockerfile:1

FROM oven/bun:1.4.0 AS deps
WORKDIR /repo
COPY package.json bun.lock tsconfig.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/sendenv/package.json apps/sendenv/package.json
COPY apps/hvisk/package.json apps/hvisk/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/web-ui/package.json packages/web-ui/package.json
RUN bun install --frozen-lockfile

FROM deps AS verify
WORKDIR /repo
COPY . .
RUN bun run check && bun run test

FROM oven/bun:1.4.0 AS runner
WORKDIR /repo
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl \
	&& rm -rf /var/lib/apt/lists/*
COPY package.json bun.lock tsconfig.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/sendenv/package.json apps/sendenv/package.json
COPY apps/hvisk/package.json apps/hvisk/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/web-ui/package.json packages/web-ui/package.json
RUN bun install --frozen-lockfile --production --filter @sendenv/api
COPY --from=verify /repo/apps/api ./apps/api
COPY --from=verify /repo/packages/sdk ./packages/sdk
WORKDIR /repo/apps/api
USER bun
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
	CMD ["curl", "--fail", "--silent", "http://127.0.0.1:3000/health"]
CMD ["bun", "run", "start"]
