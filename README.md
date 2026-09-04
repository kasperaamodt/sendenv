# Sendenv platform

One encrypted secret service, exposed through two products:

- [sendenv.app](https://sendenv.app) for developers and API integrations
- [hvisk.no](https://hvisk.no) for simple, private sharing

Both frontends encrypt and decrypt in the browser. The API stores only ciphertext and a SHA-256
access verifier. Root keys stay in URL fragments and are never sent to the server.

## Repository

This is a Bun workspace orchestrated by Turborepo.

```text
apps/
  api/          Elysia API, OpenAPI, Drizzle, MySQL and Redis
  sendenv/      Developer-focused SvelteKit frontend
  hvisk/        Norwegian consumer-facing SvelteKit frontend
packages/
  sdk/          Browser-safe encryption protocol, contracts and HTTP client
  web-ui/       Shared Svelte 5 components, StyleX styles and copy contracts
```

## Development

Create a root `.env` from `.env.example`, then run:

```bash
bun install
bun run db:migrate
bun dev
```

Local services:

| Service | URL                             |
| ------- | ------------------------------- |
| API     | `http://localhost:3000`         |
| OpenAPI | `http://localhost:3000/openapi` |
| Sendenv | `http://localhost:3001`         |
| Hvisk   | `http://localhost:3002`         |

Useful commands:

```bash
bun run check
bun run test
bun run lint
bun run build
bun run db:migrate
bun run db:studio
```

## SDK releases

The browser-safe SDK is published from `packages/sdk` as `@sendenv/sdk`. The first release must be
published manually after the code has been committed and pushed:

```bash
bun run sdk:pack
bun run sdk:publish
```

After the first release, configure npm Trusted Publishing for GitHub Actions with:

```text
Owner: aamodtko
Repository: sendenv
Workflow: publish-sdk.yml
Allowed action: npm publish
```

For later releases, update the package version, commit and push it, then tag that commit:

```bash
git tag sdk-v0.2.0
git push origin sdk-v0.2.0
```

The tag must match the version in `packages/sdk/package.json`. The workflow verifies, tests,
publishes with npm OIDC and creates the GitHub release. Never run `npm publish` without the explicit
package path from this monorepo.

## API

API v1 accepts payloads produced by encryption protocol v1.

```text
POST /v1/secrets
GET  /v1/secrets/:contentId
POST /v1/secrets/:contentId/consume
GET  /health
GET  /openapi
GET  /openapi/json
```

Creating a secret accepts an encrypted payload:

```json
{
	"version": 1,
	"contentId": "abcdef123456abcdef123456abcdef12",
	"ciphertext": "v1.<base64url payload>",
	"accessVerifier": "<base64url SHA-256 verifier>",
	"expiresInHours": 1
}
```

Consumption uses standard bearer authentication:

```http
POST /v1/secrets/abcdef123456abcdef123456abcdef12/consume
Authorization: Bearer <access-token>
```

Successful consumption is atomic and returns the ciphertext once. Missing, expired, consumed and
wrong-token secrets all produce the same not-found response.

OpenAPI documents the transport contract. Integrations must also implement the browser-safe
protocol in `packages/sdk`; plaintext and root keys must never be sent to the API.

## Encryption

Protocol v1 uses:

- A random 256-bit root key in the URL fragment
- HKDF-SHA-256 to derive independent encryption and access keys
- AES-256-GCM with a random 96-bit IV
- `sendenv:v1:{contentId}` as authenticated additional data
- `SHA-256(access-token)` as the stored verifier
- A maximum plaintext size of 49,121 UTF-8 bytes

The `sendenv:v1` value is a protocol namespace shared by both brands.

## Coolify

Create five resources:

| Resource | Dockerfile                | Port   | Health check |
| -------- | ------------------------- | ------ | ------------ |
| MySQL    | Managed service           | MySQL  | Managed      |
| Redis    | Managed service           | Redis  | Managed      |
| API      | `apps/api/Dockerfile`     | `3000` | `/health`    |
| Sendenv  | `apps/sendenv/Dockerfile` | `3000` | `/health`    |
| Hvisk    | `apps/hvisk/Dockerfile`   | `3000` | `/health`    |

Use the repository root as build context for all three Docker resources.

API environment:

```text
DATABASE_URL=mysql://...
REDIS_URL=redis://...
TRUST_PROXY_HOPS=1
CORS_ORIGINS=https://sendenv.app,https://www.sendenv.app,https://hvisk.no,https://www.hvisk.no
```

Frontend environment for both Sendenv and Hvisk:

```text
API_URL=https://api.sendenv.app
```

The API container applies Drizzle migrations under a MySQL advisory lock before starting. Leave
Coolify pre-deployment, post-deployment and start-command overrides empty. Frontend containers do
not receive database or Redis credentials.

All production images include `curl` because Coolify executes its health check inside the
container.
