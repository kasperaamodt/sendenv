# Sendenv

Sendenv is a secure, end-to-end encrypted service for sharing sensitive information. Perfect for sharing environment variables, API keys, or other secrets securely.

## How it Works

1. Your secret is encrypted in your browser using AES-GCM encryption
2. Only the encrypted data is sent to our server
3. A unique link is generated containing the decryption key
4. The decryption key is never sent to our server
5. Links expire after 1 hour and can only be used once

## Security Features

- End-to-end encryption using AES-GCM
- 256-bit encryption keys
- Keys are generated using the Web Crypto API
- Encryption/decryption happens entirely in your browser
- Server never sees unencrypted data
- One-time use links
- 1-hour expiration
- No data retention after expiration

## Technical Details

- Built with SvelteKit
- Uses Web Crypto API for cryptographic operations
- MySQL database (with Drizzle ORM)
- URLs are structured as `sendenv.app/s/{id}#{key}`
  - `id`: Identifies the encrypted content
  - `key`: Encryption key (only in URL fragment, never sent to server)

## Development

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build for production
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
