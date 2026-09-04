import { afterEach, describe, expect, test } from 'bun:test';

import { create_api_client } from './client.ts';

const original_fetch = globalThis.fetch;

afterEach(() => {
	globalThis.fetch = original_fetch;
});

describe('API client', () => {
	test('uses the versioned create endpoint', async () => {
		let requested_url: string | undefined;
		globalThis.fetch = (async (input: string | URL | Request) => {
			requested_url = String(input);
			return Response.json(
				{ contentId: 'a'.repeat(32), expiresAt: '2026-09-03T13:00:00.000Z' },
				{ status: 201 }
			);
		}) as unknown as typeof fetch;
		const client = create_api_client('https://api.sendenv.app/');

		await client.create_secret({
			version: 1,
			contentId: 'a'.repeat(32),
			ciphertext: 'v1.payload',
			accessVerifier: 'A'.repeat(43),
			expiresInHours: 1
		});

		expect(requested_url).toBe('https://api.sendenv.app/v1/secrets');
	});

	test('uses bearer authorization when consuming', async () => {
		let requested_init: RequestInit | undefined;
		globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
			requested_init = init;
			return Response.json({ ciphertext: 'v1.payload' });
		}) as unknown as typeof fetch;
		const client = create_api_client('https://api.sendenv.app');

		await client.consume_secret('a'.repeat(32), 'token');

		expect(requested_init?.headers).toEqual({
			Accept: 'application/json',
			Authorization: 'Bearer token'
		});
	});

	test('checks availability without consuming', async () => {
		let requested_url: string | undefined;
		let requested_init: RequestInit | undefined;
		globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
			requested_url = String(input);
			requested_init = init;
			return new Response(null, { status: 204 });
		}) as unknown as typeof fetch;
		const client = create_api_client('https://api.sendenv.app');

		expect(await client.is_secret_available('a'.repeat(32), 'token')).toBe(true);
		expect(requested_url).toBe(`https://api.sendenv.app/v1/secrets/${'a'.repeat(32)}`);
		expect(requested_init).toMatchObject({
			method: 'HEAD',
			headers: { Authorization: 'Bearer token' }
		});

		globalThis.fetch = (async () => new Response(null, { status: 404 })) as unknown as typeof fetch;
		expect(await client.is_secret_available('a'.repeat(32), 'token')).toBe(false);
	});
});
