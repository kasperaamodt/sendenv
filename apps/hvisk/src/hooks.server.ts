import type { Handle } from '@sveltejs/kit';

import { get_api_base_url } from '$lib/server/api';
import { is_secret_path, secret_headers } from '$lib/server/secret';

// Hooks load at process startup, so invalid production configuration fails fast.
get_api_base_url();

export const handle: Handle = async ({ event, resolve }) => {
	if (
		event.request.method === 'HEAD' &&
		(event.url.pathname === '/' || is_secret_path(event.url.pathname))
	) {
		return new Response(null, {
			status: 200,
			headers: is_secret_path(event.url.pathname) ? secret_headers : undefined
		});
	}

	return resolve(event);
};
