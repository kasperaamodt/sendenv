import { afterAll, describe, expect, test } from 'bun:test';

process.env.API_URL = 'https://api.sendenv.test';

const { assets } = await import('./assets.ts');
const { router } = await import('./router.ts');

afterAll(() => assets.close());

describe('Hvisk frontend', () => {
	test('serves its health check', async () => {
		const response = await router.fetch(new Request('http://localhost/health'));

		expect(response.status).toBe(204);
	});

	test('serves its homepage', async () => {
		const response = await router.fetch(new Request('http://localhost/'));

		expect(response.status).toBe(200);
	});
});
