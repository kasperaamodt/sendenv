import { db } from '$lib/db';
import { secrets } from '$lib/db/schema';
import type { RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';

const validator = z.object({
	content_id: z.string(),
	data: z.string(),
	expiration: z.number().default(1)
});

export const POST: RequestHandler = async ({ request }) => {
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
