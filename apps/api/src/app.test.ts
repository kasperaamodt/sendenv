import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';

import { decrypt_secret, encrypt_secret, get_access_token } from '@sendenv/sdk/protocol';

import { createApi, type RateLimiter } from './app.ts';
import type { NewSecret, SecretStore } from './modules/secrets/store.ts';

const fixedNow = new Date('2026-09-03T12:00:00.000Z');
const contentId = 'abcdef123456abcdef123456abcdef12';
const accessToken = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const accessVerifier = createHash('sha256').update(Buffer.from(accessToken, 'base64url')).digest();
const validCreateBody = {
	version: 1 as const,
	contentId,
	ciphertext: 'v1.encrypted-data',
	accessVerifier: accessVerifier.toString('base64url'),
	expiresInHours: 3 as const
};

class MemoryStore implements SecretStore {
	secrets = new Map<string, NewSecret>();

	async create(secret: NewSecret) {
		if (this.secrets.has(secret.contentId)) return false;
		this.secrets.set(secret.contentId, secret);
		return true;
	}

	async available(id: string, providedVerifier: Buffer, now: Date) {
		const secret = this.secrets.get(id);
		return Boolean(
			secret && secret.accessVerifier.equals(providedVerifier) && secret.expiresAt > now
		);
	}

	async consume(id: string, providedVerifier: Buffer, now: Date) {
		const secret = this.secrets.get(id);
		if (!secret || !secret.accessVerifier.equals(providedVerifier) || secret.expiresAt <= now) {
			return null;
		}

		this.secrets.delete(id);
		return secret.ciphertext;
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

function setup(
	rateLimiter = unlimitedRateLimiter,
	trustedProxyHops = 0,
	healthCheck: () => Promise<void> = async () => {}
) {
	const store = new MemoryStore();
	const api = createApi({
		store,
		rateLimiter,
		now: () => fixedNow,
		trustedProxyHops,
		healthCheck,
		allowedOrigins: ['https://sendenv.app', 'https://hvisk.no']
	});
	return { api, store };
}

function createRequest(body: unknown, origin?: string) {
	return new Request('http://localhost/v1/secrets', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(origin ? { Origin: origin } : {})
		},
		body: JSON.stringify(body)
	});
}

describe('Sendenv API', () => {
	test('creates and consumes a browser-encrypted secret end to end', async () => {
		const { api } = setup();
		const encrypted = await encrypt_secret('E2E_SECRET=value');
		const createResponse = await api.handle(
			createRequest({
				version: encrypted.version,
				contentId: encrypted.contentId,
				ciphertext: encrypted.ciphertext,
				accessVerifier: encrypted.accessVerifier,
				expiresInHours: 1
			})
		);
		const token = await get_access_token(encrypted.rootKey);
		const consumeResponse = await api.handle(
			new Request(`http://localhost/v1/secrets/${encrypted.contentId}/consume`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` }
			})
		);
		const payload = (await consumeResponse.json()) as { ciphertext: string };

		expect(createResponse.status).toBe(201);
		expect(createResponse.headers.get('location')).toBe(
			`/v1/secrets/${encrypted.contentId}/consume`
		);
		expect(consumeResponse.status).toBe(200);
		expect(await decrypt_secret(payload.ciphertext, encrypted.rootKey, encrypted.contentId)).toBe(
			'E2E_SECRET=value'
		);
	});

	test('stores only ciphertext with a server-calculated expiration', async () => {
		const { api, store } = setup();
		const response = await api.handle(createRequest(validCreateBody));

		expect(response.status).toBe(201);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(store.secrets.get(contentId)).toEqual({
			contentId,
			ciphertext: 'v1.encrypted-data',
			accessVerifier,
			expiresAt: new Date('2026-09-03T15:00:00.000Z')
		});
	});

	test('rejects malformed and invalid requests', async () => {
		const { api, store } = setup();
		const malformed = await api.handle(
			new Request('http://localhost/v1/secrets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: '{'
			})
		);
		const invalid_version = await api.handle(createRequest({ ...validCreateBody, version: 2 }));
		const legacy_ciphertext = await api.handle(
			createRequest({ ...validCreateBody, ciphertext: 'v2.encrypted-data' })
		);
		const invalid_fields = await api.handle(
			createRequest({ ...validCreateBody, contentId: 'too-short', expiresInHours: 48 })
		);
		const invalidExpiration = await api.handle(
			createRequest({ ...validCreateBody, expiresInHours: 2 })
		);

		expect(malformed.status).toBe(400);
		expect(invalid_version.status).toBe(400);
		expect(legacy_ciphertext.status).toBe(400);
		expect(invalid_fields.status).toBe(400);
		expect(invalidExpiration.status).toBe(400);
		expect(store.secrets.size).toBe(0);
	});

	test('rate limits requests before parsing and validation', async () => {
		const keys: string[] = [];
		const rateLimiter: RateLimiter = {
			async limit(key) {
				keys.push(key);
				return { success: false, remaining: 0, reset: 1000, retry_after: 1000 };
			}
		};
		const { api } = setup(rateLimiter);
		const response = await api.handle(
			new Request('http://localhost/v1/secrets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: '{'
			})
		);

		expect(response.status).toBe(429);
		expect(keys).toHaveLength(1);
	});

	test('returns a clear error when ciphertext is too large', async () => {
		const { api, store } = setup();
		const response = await api.handle(
			createRequest({ ...validCreateBody, ciphertext: `v1.${'A'.repeat(65_533)}` })
		);

		expect(response.status).toBe(413);
		expect(await response.json()).toEqual({
			error: {
				code: 'SECRET_TOO_LARGE',
				message: 'Secret is too large. Shorten it and try again.'
			}
		});
		expect(store.secrets.size).toBe(0);
	});

	test('requires the correct access token and consumes only once', async () => {
		const { api, store } = setup();
		store.secrets.set(contentId, {
			contentId,
			ciphertext: 'v1.encrypted-data',
			accessVerifier,
			expiresAt: new Date('2026-09-03T13:00:00.000Z')
		});
		const consumeUrl = `http://localhost/v1/secrets/${contentId}/consume`;
		const wrongToken = await api.handle(
			new Request(consumeUrl, {
				method: 'POST',
				headers: { Authorization: `Bearer ${'B'.repeat(43)}` }
			})
		);
		const request = () =>
			new Request(consumeUrl, {
				method: 'POST',
				headers: { Authorization: `Bearer ${accessToken}` }
			});

		expect(wrongToken.status).toBe(404);
		expect(store.secrets.has(contentId)).toBe(true);
		expect((await api.handle(request())).status).toBe(200);
		expect((await api.handle(request())).status).toBe(404);
	});

	test('checks availability without consuming the secret', async () => {
		const { api, store } = setup();
		store.secrets.set(contentId, {
			contentId,
			ciphertext: 'v1.encrypted-data',
			accessVerifier,
			expiresAt: new Date('2026-09-03T13:00:00.000Z')
		});
		const availabilityUrl = `http://localhost/v1/secrets/${contentId}`;
		const consumeUrl = `${availabilityUrl}/consume`;
		const check = (token = accessToken) =>
			api.handle(
				new Request(availabilityUrl, {
					method: 'HEAD',
					headers: { Authorization: `Bearer ${token}` }
				})
			);

		expect((await check('B'.repeat(43))).status).toBe(404);
		expect((await check()).status).toBe(204);
		expect(store.secrets.has(contentId)).toBe(true);
		expect(
			(
				await api.handle(
					new Request(consumeUrl, {
						method: 'POST',
						headers: { Authorization: `Bearer ${accessToken}` }
					})
				)
			).status
		).toBe(200);
		expect((await check()).status).toBe(404);
	});

	test('challenges requests without a bearer token', async () => {
		const { api } = setup();
		const response = await api.handle(
			new Request(`http://localhost/v1/secrets/${contentId}/consume`, { method: 'POST' })
		);

		expect(response.status).toBe(401);
		expect(response.headers.get('www-authenticate')).toBe('Bearer realm="sendenv-secret"');
	});

	test('applies scoped rate limits without touching storage', async () => {
		const keys: string[] = [];
		const rateLimiter: RateLimiter = {
			async limit(key) {
				keys.push(key);
				return { success: false, remaining: 0, reset: 1000, retry_after: 2500 };
			}
		};
		const { api, store } = setup(rateLimiter);
		const response = await api.handle(createRequest(validCreateBody));

		expect(response.status).toBe(429);
		expect(response.headers.get('retry-after')).toBe('3');
		expect(keys).toHaveLength(1);
		expect(store.secrets.size).toBe(0);
	});

	test('allows configured browser origins only', async () => {
		const { api } = setup();
		const allowed = await api.handle(createRequest(validCreateBody, 'https://hvisk.no'));
		const denied = await api.handle(createRequest(validCreateBody, 'https://example.com'));
		const availabilityPreflight = await api.handle(
			new Request(`http://localhost/v1/secrets/${contentId}`, {
				method: 'OPTIONS',
				headers: {
					Origin: 'https://hvisk.no',
					'Access-Control-Request-Method': 'HEAD',
					'Access-Control-Request-Headers': 'Authorization'
				}
			})
		);

		expect(allowed.headers.get('access-control-allow-origin')).toBe('https://hvisk.no');
		expect(allowed.headers.get('access-control-expose-headers')).toContain('Location');
		expect(denied.headers.has('access-control-allow-origin')).toBe(false);
		expect(availabilityPreflight.headers.get('access-control-allow-methods')).toContain('HEAD');
		expect(availabilityPreflight.headers.get('access-control-allow-headers')).toContain(
			'Authorization'
		);
	});

	test('reports dependency failures through readiness', async () => {
		const { api } = setup(unlimitedRateLimiter, 0, async () => {
			throw new Error('Redis unavailable');
		});
		const response = await api.handle(new Request('http://localhost/health'));

		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({
			error: { code: 'SERVICE_UNAVAILABLE', message: 'Service is not ready.' }
		});
	});

	test('publishes the versioned routes in OpenAPI', async () => {
		const { api } = setup();
		const response = await api.handle(new Request('http://localhost/openapi/json'));
		const document = (await response.json()) as {
			paths: Record<
				string,
				{
					get?: { responses?: Record<string, unknown> };
					head?: { responses?: Record<string, unknown> };
					post?: {
						requestBody?: {
							content: Record<
								string,
								{ schema: { properties: Record<string, Record<string, unknown>> } }
							>;
						};
					};
				}
			>;
		};
		const createOperation = document.paths['/v1/secrets']?.post;

		expect(response.status).toBe(200);
		expect(Object.keys(createOperation?.requestBody?.content ?? {})).toEqual(['application/json']);
		expect(
			createOperation?.requestBody?.content['application/json']?.schema.properties.expiresInHours
		).toMatchObject({ type: 'number', enum: [1, 3, 6, 12, 24] });
		expect(document.paths['/v1/secrets/{contentId}/consume']).toBeDefined();
		expect(document.paths['/v1/secrets/{contentId}']?.head?.responses?.['204']).toBeDefined();
		expect(document.paths['/health']?.get?.responses?.['204']).toBeDefined();
	});
});
