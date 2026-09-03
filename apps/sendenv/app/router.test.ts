import { afterAll, describe, expect, test } from 'bun:test';

process.env.API_URL = 'https://api.sendenv.test';

const { assets } = await import('./assets.ts');
const { router } = await import('./router.ts');

afterAll(() => assets.close());

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
		expect(html).toContain('Reveal secret');
		expect(html).toContain('button button-secondary');
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
