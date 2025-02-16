import { db } from '$lib/db';
import { secrets } from '$lib/db/schema';
import { ratelimiter } from '$lib/valkey';
import type { RequestHandler } from '@sveltejs/kit';
import { hash } from 'crypto';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request, params }) => {
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

	const content_id = params.id;

	if (!content_id) {
		return new Response('Missing content_id', {
			status: 400
		});
	}

	const [secret] = await db
		.select({
			data: secrets.data,
			expires_at: secrets.expires_at,
			accessed: secrets.accessed
		})
		.from(secrets)
		.where(eq(secrets.content_id, content_id))
		.execute();

	if (!secret) {
		return new Response('Secret not found', {
			status: 404
		});
	}

	if (secret.expires_at < new Date()) {
		return new Response('Secret expired', {
			status: 404
		});
	}

	if (secret.accessed) {
		return new Response('Secret already accessed', {
			status: 404
		});
	}

	await db
		.update(secrets)
		.set({ accessed: true })
		.where(eq(secrets.content_id, content_id))
		.execute();

	return new Response(
		JSON.stringify({
			data: secret.data
		}),
		{
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		}
	);
};
