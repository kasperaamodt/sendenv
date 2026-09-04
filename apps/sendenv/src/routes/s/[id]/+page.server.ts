import { create_api_client } from '@sendenv/sdk';

import type { PageServerLoad } from './$types';

import { get_api_base_url } from '$lib/server/api';
import { secret_headers } from '$lib/server/secret';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	setHeaders(secret_headers);
	const { status } = await create_api_client(get_api_base_url()).get_secret_status(params.id);
	return { contentId: params.id, status };
};
