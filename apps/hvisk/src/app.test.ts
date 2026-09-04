import { afterEach, describe, expect, test, vi } from 'vitest';
import { render } from 'svelte/server';

import Header from '$lib/Header.svelte';
import { handle } from './hooks.server';
import HomePage from './routes/+page.svelte';
import SecretPage from './routes/s/[id]/+page.svelte';
import { load as load_secret } from './routes/s/[id]/+page.server';
import { GET as health } from './routes/health/+server';

const apiBaseUrl = 'https://api.sendenv.test';
const developmentApiBaseUrl = 'http://localhost:3000';
const contentId = 'abcdef123456abcdef123456abcdef12';

afterEach(() => vi.unstubAllGlobals());

describe('Hvisk frontend', () => {
	test('serves its health check', async () => {
		expect((await health({} as never)).status).toBe(204);
	});

	test('renders the existing homepage and header', () => {
		const page = render(HomePage, { props: { data: { apiBaseUrl } } });
		const header = render(Header);

		expect(page.head).toContain('<title>Hvisk – del privat informasjon trygt</title>');
		expect(page.body).toContain('Del privat informasjon trygt');
		expect(page.body).toContain('Lag sikker lenke');
		expect(page.body).toContain('disabled');
		expect(header.body).toContain('width="88" height="30"');
	});

	test('loads secret status with privacy headers', async () => {
		const fetch_mock = vi.fn(() => Promise.resolve(Response.json({ status: 'available' })));
		vi.stubGlobal('fetch', fetch_mock);
		const headers: Record<string, string> = {};

		const data = await load_secret({
			params: { id: contentId },
			setHeaders(values: Record<string, string>) {
				Object.assign(headers, values);
			}
		} as never);

		expect(data).toEqual({ contentId, status: 'available' });
		expect(headers).toEqual({
			'Cache-Control': 'no-store',
			'X-Robots-Tag': 'noindex, nofollow, noarchive'
		});
		expect(fetch_mock).toHaveBeenCalledWith(`${developmentApiBaseUrl}/v1/secrets/${contentId}`, {
			method: 'GET',
			headers: { Accept: 'application/json' },
			signal: undefined
		});
	});

	test('renders an available secret without consuming it', () => {
		const page = render(SecretPage, {
			props: { data: { apiBaseUrl, contentId, status: 'available' } }
		});

		expect(page.body).toContain('Noen har delt noe privat med deg');
		expect(page.body).toContain('id="secret-output"');
		expect(page.body).toContain('Vis innholdet');
		expect(page.body).toContain('Kopier innholdet');
	});

	test('renders only the error and new-secret action when a secret expired', () => {
		const page = render(SecretPage, {
			props: { data: { apiBaseUrl, contentId, status: 'expired' } }
		});

		expect(page.head).toContain('name="robots" content="noindex"');
		expect(page.body).toContain('Noen har delt noe privat med deg');
		expect(page.body).toContain('Denne lenken er utløpt.');
		expect(page.body).toContain('Del noe nytt');
		expect(page.body).not.toContain('id="secret-output"');
		expect(page.body).not.toMatch(/<button[^>]*>Vis innholdet<\/button>/);
		expect(page.body).not.toMatch(/<button[^>]*>Kopier innholdet<\/button>/);
	});

	test('answers page HEAD requests without rendering or loading status', async () => {
		const resolve = vi.fn();
		const secret_response = await handle({
			event: {
				request: new Request(`http://localhost/s/${contentId}`, { method: 'HEAD' }),
				url: new URL(`http://localhost/s/${contentId}`)
			},
			resolve
		} as never);
		const home_response = await handle({
			event: {
				request: new Request('http://localhost/', { method: 'HEAD' }),
				url: new URL('http://localhost/')
			},
			resolve
		} as never);

		expect(secret_response.status).toBe(200);
		expect(secret_response.headers.get('cache-control')).toBe('no-store');
		expect(secret_response.headers.get('x-robots-tag')).toBe('noindex, nofollow, noarchive');
		expect(await secret_response.text()).toBe('');
		expect(home_response.status).toBe(200);
		expect(await home_response.text()).toBe('');
		expect(resolve).not.toHaveBeenCalled();
	});
});
