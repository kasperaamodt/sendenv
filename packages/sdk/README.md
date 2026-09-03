# @sendenv/sdk

Browser-safe SDK for creating and consuming end-to-end encrypted, one-time secrets with the
Sendenv API. Plaintext and root keys never leave the client.

## Install

```bash
npm install @sendenv/sdk
```

## Create a secret

```ts
import { create_api_client, encrypt_secret } from '@sendenv/sdk';

const api = create_api_client('https://api.sendenv.app');
const encrypted = await encrypt_secret('DATABASE_URL=mysql://...');

await api.create_secret({
	version: encrypted.version,
	contentId: encrypted.contentId,
	ciphertext: encrypted.ciphertext,
	accessVerifier: encrypted.accessVerifier,
	expiresInHours: 1
});

const share_url = `https://sendenv.app/s/${encrypted.contentId}#${encrypted.rootKey}`;
```

## Consume a secret

```ts
import { create_api_client, decrypt_secret, get_access_token } from '@sendenv/sdk';

const api = create_api_client('https://api.sendenv.app');
const access_token = await get_access_token(root_key);
const { ciphertext } = await api.consume_secret(content_id, access_token);
const plaintext = await decrypt_secret(ciphertext, root_key, content_id);
```

The root key belongs in a URL fragment or another client-only channel. Never send it to the
Sendenv API.

Advanced integrations can import the low-level modules from `@sendenv/sdk/client` and
`@sendenv/sdk/protocol`.
