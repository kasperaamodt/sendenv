import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

export function get_api_base_url(): string {
	const api_base_url = env.API_URL ?? (dev ? 'http://localhost:3000' : '');
	if (!api_base_url) throw new Error('API_URL is not set');
	return api_base_url;
}
