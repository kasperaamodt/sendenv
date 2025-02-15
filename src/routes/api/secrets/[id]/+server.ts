import { db } from '$lib/db';
import { secrets } from '$lib/db/schema';
import type { RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
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
