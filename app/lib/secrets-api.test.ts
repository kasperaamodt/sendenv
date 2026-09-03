import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';

import {
	decrypt_content,
	encrypt_content,
	get_access_token
} from '../actions/public/encryption.ts';
import type { NewSecret, SecretStore } from './secret-store.ts';
import { createSecretsApi, type RateLimiter } from './secrets-api.ts';
import { MAX_ENCRYPTED_SECRET_LENGTH, SECRET_TOO_LARGE_MESSAGE } from './secret-size.ts';

const fixedNow = new Date('2026-09-03T12:00:00.000Z');
const contentId = 'abcdef123456abcdef123456abcdef12';
const accessToken = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const accessVerifier = createHash('sha256').update(Buffer.from(accessToken, 'base64url')).digest();
const validCreateBody = {
	version: 2,
	content_id: contentId,
	data: 'v2.encrypted-data',
	access_verifier: accessVerifier.toString('base64url'),
	expiration: 3
};

class MemoryStore implements SecretStore {
	secrets = new Map<string, NewSecret>();

	async create(secret: NewSecret) {
		if (this.secrets.has(secret.contentId)) return false;
		this.secrets.set(secret.contentId, secret);
		return true;
	}

	async consume(contentId: string, providedVerifier: Buffer, now: Date) {
		const secret = this.secrets.get(contentId);
		if (!secret || !secret.accessVerifier.equals(providedVerifier) || secret.expiresAt <= now)
			return null;

		this.secrets.delete(contentId);
		return secret.data;
	}

	async cleanup(now: Date) {
		let deleted = 0;
		for (const [id, secret] of this.secrets) {
			if (secret.expiresAt < now) {
				this.secrets.delete(id);
				deleted++;
			}
		}
		return deleted;
	}
}

const unlimitedRateLimiter: RateLimiter = {
	async limit() {
		return { success: true, remaining: 4, reset: 0, retry_after: 0 };
	}
};

function setup(rateLimiter = unlimitedRateLimiter, trustedProxyHops = 0) {
	const store = new MemoryStore();
	const api = createSecretsApi({ store, rateLimiter, now: () => fixedNow, trustedProxyHops });
	return { api, store };
}

function createRequest(body: unknown) {
	return new Request('http://localhost/api/secrets', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '203.0.113.10' },
		body: JSON.stringify(body)
	});
}

describe('secrets API', () => {
	test('accepts and returns a browser-encrypted secret end to end', async () => {
		const { api } = setup();
		const encrypted = await encrypt_content('E2E_SECRET=value');
		const createResponse = await api.create(
			createRequest({
				version: encrypted.version,
				content_id: encrypted.id,
				data: encrypted.encrypted_data,
				access_verifier: encrypted.access_verifier,
				expiration: 1
			})
		);
		const token = await get_access_token(encrypted.key);
		const consumeResponse = await api.consume(
			new Request(`http://localhost/api/secrets/${encrypted.id}`, {
				method: 'POST',
				headers: { Authorization: `Sendenv ${token}`, 'X-Sendenv-Consume': '1' }
			}),
			encrypted.id
		);
		const payload = (await consumeResponse.json()) as { data: string };

		expect(createResponse.status).toBe(204);
		expect(consumeResponse.status).toBe(200);
		expect(await decrypt_content(payload.data, encrypted.key, encrypted.id)).toBe(
			'E2E_SECRET=value'
		);
	});

	test('stores only the encrypted payload with the requested expiration', async () => {
		const { api, store } = setup();
		const response = await api.create(createRequest(validCreateBody));

		expect(response.status).toBe(204);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(store.secrets.get(contentId)).toEqual({
			contentId,
			data: 'v2.encrypted-data',
			accessVerifier,
			expiresAt: new Date('2026-09-03T15:00:00.000Z')
		});
	});

	test('rejects malformed JSON and invalid public input', async () => {
		const { api, store } = setup();
		const malformed = await api.create(
			new Request('http://localhost/api/secrets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: '{'
			})
		);
		const invalid = await api.create(
			createRequest({ ...validCreateBody, version: 1, content_id: 'too-short', expiration: 48 })
		);

		expect(malformed.status).toBe(400);
		expect(invalid.status).toBe(400);
		expect(store.secrets.size).toBe(0);
	});

	test('returns a clear error when a secret is too large', async () => {
		const { api, store } = setup();
		const oversizedPayload = await api.create(
			createRequest({
				...validCreateBody,
				data: `v2.${'A'.repeat(MAX_ENCRYPTED_SECRET_LENGTH - 2)}`
			})
		);
		const oversizedRequest = await api.create(
			createRequest({ ...validCreateBody, data: `v2.${'A'.repeat(70_000)}` })
		);

		for (const response of [oversizedPayload, oversizedRequest]) {
			expect(response.status).toBe(413);
			expect(await response.text()).toBe(SECRET_TOO_LARGE_MESSAGE);
		}
		expect(store.secrets.size).toBe(0);
	});

	test('requires the correct access token and consumes a secret only once', async () => {
		const { api, store } = setup();
		store.secrets.set(contentId, {
			contentId,
			data: 'v2.encrypted-data',
			accessVerifier,
			expiresAt: new Date('2026-09-03T13:00:00.000Z')
		});
		const wrongTokenRequest = new Request(`http://localhost/api/secrets/${contentId}`, {
			method: 'POST',
			headers: {
				Authorization: `Sendenv ${'B'.repeat(43)}`,
				'X-Sendenv-Consume': '1'
			}
		});
		const request = new Request(`http://localhost/api/secrets/${contentId}`, {
			method: 'POST',
			headers: { Authorization: `Sendenv ${accessToken}`, 'X-Sendenv-Consume': '1' }
		});

		const wrongToken = await api.consume(wrongTokenRequest, contentId);
		expect(wrongToken.status).toBe(404);
		expect(store.secrets.has(contentId)).toBe(true);

		const first = await api.consume(request, contentId);
		const second = await api.consume(request, contentId);

		expect(first.status).toBe(200);
		expect(await first.json()).toEqual({ data: 'v2.encrypted-data' });
		expect(first.headers.get('cache-control')).toBe('no-store');
		expect(second.status).toBe(404);
	});

	test('does not consume secrets through an unguarded request', async () => {
		const { api, store } = setup();
		store.secrets.set(contentId, {
			contentId,
			data: 'v2.encrypted-data',
			accessVerifier,
			expiresAt: new Date('2026-09-03T13:00:00.000Z')
		});

		const response = await api.consume(
			new Request(`http://localhost/api/secrets/${contentId}`),
			contentId
		);

		expect(response.status).toBe(400);
		expect(store.secrets.has(contentId)).toBe(true);
	});

	test('returns rate-limit headers without touching storage', async () => {
		const rateLimiter: RateLimiter = {
			async limit() {
				return { success: false, remaining: 0, reset: 1000, retry_after: 2500 };
			}
		};
		const { api, store } = setup(rateLimiter);
		const response = await api.create(createRequest({ ...validCreateBody, expiration: 1 }));

		expect(response.status).toBe(429);
		expect(response.headers.get('retry-after')).toBe('3');
		expect(store.secrets.size).toBe(0);
	});

	test('ignores spoofed forwarding headers without a trusted proxy', async () => {
		const keys: string[] = [];
		const rateLimiter: RateLimiter = {
			async limit(key) {
				keys.push(key);
				return { success: true, remaining: 4, reset: 0, retry_after: 0 };
			}
		};
		const { api } = setup(rateLimiter);

		for (const forwardedFor of ['198.51.100.1', '198.51.100.2']) {
			await api.create(
				new Request('http://localhost/api/secrets', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-Forwarded-For': forwardedFor,
						'X-Sendenv-Remote-Address': '203.0.113.10'
					},
					body: '{'
				})
			);
		}

		expect(keys).toHaveLength(2);
		expect(keys[0]).toBe(keys[1]);
	});
});
