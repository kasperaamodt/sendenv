import { db } from '$lib/db';
import { secrets } from '$lib/db/schema';
import type { RequestHandler } from '@sveltejs/kit';
import { eq, lt, or } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	await db
		.delete(secrets)
		.where(or(lt(secrets.expires_at, new Date()), eq(secrets.accessed, true)));

	return new Response(null, {
		status: 204
	});
};
