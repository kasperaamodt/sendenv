# Sendenv

Sendenv is a secure, end-to-end encrypted service for sharing sensitive information. Perfect for sharing environment variables, API keys, or other secrets securely.

## How it Works

1. Your secret is encrypted in your browser using AES-GCM encryption
2. Only the encrypted data is sent to our server
3. A unique link is generated containing a root key in the URL fragment
4. Separate encryption and access keys are derived from the root key with HKDF-SHA-256
5. The encryption key is never sent to our server
6. Links expire after 1 hour by default and can only be used once

## Security Features

- End-to-end encryption using AES-GCM
- 256-bit encryption keys
- Separate encryption and access keys derived with HKDF-SHA-256
- Ciphertext is bound to its protocol version and content ID with authenticated additional data
- Keys are generated using the Web Crypto API
- Encryption/decryption happens entirely in your browser
- Server never sees unencrypted data
- One-time use links
- Configurable expiration from 1 to 24 hours
- Used and expired ciphertext is deleted within ten minutes

## Technical Details

- Built with Remix 3 and Bun
- Uses Web Crypto API for cryptographic operations
- MySQL database (with Drizzle ORM)
- URLs are structured as `sendenv.app/s/{id}#{key}`
  - `id`: 128-bit identifier for the encrypted content
  - `key`: Root key used to derive encryption and access keys; never sent to the server

## Development

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Typecheck and test
bun run check
bun test

# Apply database migrations
bun run db:migrate

# Start the production server
bun run start
```

## REST API

The web UI uses the same REST API that is available to other clients. Clients must encrypt the
secret locally and keep the AES key out of the request.

```http
POST /api/secrets
Content-Type: application/json

{
	"version": 2,
	"content_id": "abcdef123456abcdef123456abcdef12",
	"data": "v2.<base64url encoded AES-GCM payload>",
	"access_verifier": "<base64url encoded SHA-256 verifier>",
	"expiration": 1
}
```

`expiration` can be `1`, `3`, `6`, `12`, or `24` hours. A successful request returns `204`. Sending
`POST /api/secrets/{content_id}` with `Authorization: Sendenv <access-token>` and
`X-Sendenv-Consume: 1` returns the encrypted payload once. The client constructs the share URL as
`/s/{content_id}#v2.{root-key}` and decrypts the response locally.

The v2 protocol derives the AES-256-GCM key and access token from the root key with HKDF-SHA-256.
It uses `sendenv:v2` as the HKDF salt, `sendenv:v2:encryption` and `sendenv:v2:access` as the info
values, and `sendenv:v2:{content_id}` as AES-GCM additional authenticated data. The server stores
`SHA-256(access-token)` and only consumes a secret when the presented access token matches.

Used and expired records are deleted by the Bun server every ten minutes. `TRUST_PROXY_HOPS`
defaults to `0`; set it to the number of trusted reverse proxies in front of the container to apply
rate limits to the original client IP safely.

Migration `0001_cold_iron_man.sql` intentionally rebuilds the secrets table before enabling the
v2-only protocol. The production start command acquires a MySQL advisory lock and applies pending
migrations before the HTTP server starts, so Coolify should not configure separate pre- or
post-deployment migration commands. Existing share links do not survive the migration.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
