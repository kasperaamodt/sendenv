import { afterAll, beforeEach, describe, expect, test } from 'bun:test';

import type { SecretStatus } from '@sendenv/sdk';

process.env.API_URL = 'https://api.sendenv.test';

const original_fetch = globalThis.fetch;
let secret_status: SecretStatus = 'available';
let status_requests = 0;
globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
	const url = input instanceof Request ? input.url : String(input);
	if (url === 'https://api.sendenv.test/v1/secrets/abcdef123456abcdef123456abcdef12') {
		status_requests++;
		return Response.json({ status: secret_status });
	}
	return original_fetch(input, init);
}) as typeof fetch;

const { assets } = await import('./assets.ts');
const { router } = await import('./router.ts');

beforeEach(() => {
	secret_status = 'available';
	status_requests = 0;
});

afterAll(() => {
	globalThis.fetch = original_fetch;
	assets.close();
});

describe('Sendenv frontend', () => {
	test('serves its health check', async () => {
		const response = await router.fetch(new Request('http://localhost/health'));

		expect(response.status).toBe(204);
	});

	test('serves its homepage', async () => {
		const response = await router.fetch(new Request('http://localhost/'));

		expect(response.status).toBe(200);
	});

	test('answers homepage HEAD requests without rendering a body', async () => {
		const response = await router.fetch(new Request('http://localhost/', { method: 'HEAD' }));

		expect(response.status).toBe(200);
		expect(await response.text()).toBe('');
	});

	test('links back to a new secret from the secret page', async () => {
		const response = await router.fetch(
			new Request('http://localhost/s/abcdef123456abcdef123456abcdef12')
		);
		const html = await response.text();

		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow, noarchive');
		expect(html).toContain('Create a new secret');
		expect(html).toContain('>Reveal secret</button>');
		expect(html).toContain('secret-output-concealed');
		expect(html).toContain('secret-actions');
		expect(html).toContain('button button-secondary');
		expect(status_requests).toBe(1);
	});

	test('renders only an error and new-secret link after the intro when the link expired', async () => {
		secret_status = 'expired';
		const response = await router.fetch(
			new Request('http://localhost/s/abcdef123456abcdef123456abcdef12')
		);
		const html = await response.text();

		expect(response.status).toBe(200);
		expect(html).toContain('Someone shared a secret with you');
		expect(html).toContain('This link has expired.');
		expect(html).toContain('Create a new secret');
		expect(html).not.toContain('id="secret-output"');
		expect(html).not.toContain('>Reveal secret</button>');
		expect(html).not.toContain('>Copy secret</button>');
		expect(status_requests).toBe(1);
	});

	test('answers secret HEAD requests without rendering a body', async () => {
		const response = await router.fetch(
			new Request('http://localhost/s/abcdef123456abcdef123456abcdef12', { method: 'HEAD' })
		);

		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow, noarchive');
		expect(await response.text()).toBe('');
	});
});
