import { db } from '$lib/db';
import { secrets } from '$lib/db/schema';
import { ratelimiter } from '$lib/valkey';
import type { RequestHandler } from '@sveltejs/kit';
import { hash } from 'crypto';
import { z } from 'zod';

const validator = z.object({
	content_id: z.string(),
	data: z.string(),
	expiration: z.number().default(1)
});

export const POST: RequestHandler = async ({ request }) => {
	const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

	const {
		success: limit_success,
		remaining,
		reset,
		retry_after
	} = await ratelimiter.limit(hash('sha256', ip));

	if (!limit_success) {
		return new Response('Too many requests', {
			status: 429,
			headers: {
				'X-RateLimit-Limit': '5',
				'X-RateLimit-Remaining': remaining.toString(),
				'X-RateLimit-Reset': reset.toString(),
				'Retry-After': Math.ceil(retry_after / 1000).toString()
			}
		});
	}

	const { data: valid_data, success } = validator.safeParse(await request.json());

	if (!success) {
		return new Response(JSON.stringify(validator.safeParse(await request.json())), {
			status: 400,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	const { content_id, data, expiration } = valid_data;

	const [insert] = await db.insert(secrets).values({
		content_id,
		data,
		expires_at: new Date(Date.now() + 60 * 60 * expiration * 1000)
	});

	if (insert.affectedRows === 0) {
		return new Response(
			JSON.stringify({
				content_id,
				data,
				message: 'Noe gikk galt under lagring av kryptert data.'
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	}

	return new Response(null, {
		status: 204
	});
};
