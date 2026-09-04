import type { LayoutServerLoad } from './$types';

import { get_api_base_url } from '$lib/server/api';

export const load: LayoutServerLoad = () => ({ apiBaseUrl: get_api_base_url() });
