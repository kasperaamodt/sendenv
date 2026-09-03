import { createHash } from 'node:crypto';
import { z } from 'zod';

import type { SecretStore } from './secret-store.ts';

const MAX_REQUEST_BYTES = 70_000;
const allowedExpirations = [1, 3, 6, 12, 24] as const;

export const createSecretSchema = z.object({
	version: z.literal(2),
	content_id: z.string().regex(/^[a-f0-9]{32}$/),
	data: z
		.string()
		.regex(/^v2\.[A-Za-z0-9_-]+$/)
		.max(65_535),
	access_verifier: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
	expiration: z.number().refine((value) => allowedExpirations.includes(value as never))
});

export interface RateLimiter {
	limit(key: string): Promise<{
		success: boolean;
		remaining: number;
		reset: number;
		retry_after: number;
	}>;
}

interface SecretsApiDependencies {
	store: SecretStore;
	rateLimiter: RateLimiter;
	now?: () => Date;
	trustedProxyHops?: number;
}

export function createSecretsApi({
	store,
	rateLimiter,
	now = () => new Date(),
	trustedProxyHops = 0
}: SecretsApiDependencies) {
	return {
		async create(request: Request): Promise<Response> {
			const rateLimitResponse = await limitRequest(request, rateLimiter, trustedProxyHops);
			if (rateLimitResponse) return rateLimitResponse;

			if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
				return new Response('Content-Type must be application/json', { status: 415 });
			}

			const contentLength = Number(request.headers.get('content-length') ?? 0);
			if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
				return new Response('Request body too large', { status: 413 });
			}

			let body: unknown;
			try {
				const text = await request.text();
				if (new TextEncoder().encode(text).byteLength > MAX_REQUEST_BYTES) {
					return new Response('Request body too large', { status: 413 });
				}
				body = JSON.parse(text);
			} catch {
				return json({ error: 'Malformed JSON' }, 400);
			}

			const parsed = createSecretSchema.safeParse(body);
			if (!parsed.success) {
				return json({ error: 'Invalid request', issues: parsed.error.issues }, 400);
			}
			const accessVerifier = Buffer.from(parsed.data.access_verifier, 'base64url');
			if (accessVerifier.length !== 32) {
				return json({ error: 'Invalid access verifier' }, 400);
			}

			const created = await store.create({
				contentId: parsed.data.content_id,
				data: parsed.data.data,
				accessVerifier,
				expiresAt: new Date(now().getTime() + parsed.data.expiration * 60 * 60 * 1000)
			});

			return created
				? new Response(null, { status: 204, headers: noStoreHeaders() })
				: json({ error: 'Could not store encrypted data' }, 500);
		},

		async consume(request: Request, contentId: string): Promise<Response> {
			if (request.headers.get('x-sendenv-consume') !== '1') {
				return new Response('Missing consume header', { status: 400, headers: noStoreHeaders() });
			}
			const accessToken = request.headers
				.get('authorization')
				?.match(/^Sendenv ([A-Za-z0-9_-]{43})$/)?.[1];
			if (!accessToken) {
				return new Response('Missing access token', { status: 401, headers: noStoreHeaders() });
			}

			const accessTokenBytes = Buffer.from(accessToken, 'base64url');
			if (accessTokenBytes.length !== 32) {
				return new Response('Invalid access token', { status: 401, headers: noStoreHeaders() });
			}

			const rateLimitResponse = await limitRequest(request, rateLimiter, trustedProxyHops);
			if (rateLimitResponse) return rateLimitResponse;

			if (!/^[a-f0-9]{32}$/.test(contentId)) {
				return new Response('Invalid content_id', { status: 400, headers: noStoreHeaders() });
			}

			const accessVerifier = createHash('sha256').update(accessTokenBytes).digest();
			const data = await store.consume(contentId, accessVerifier, now());
			if (data === null) {
				return new Response('Secret not found', { status: 404, headers: noStoreHeaders() });
			}

			return json({ data }, 200);
		}
	};
}

async function limitRequest(
	request: Request,
	rateLimiter: RateLimiter,
	trustedProxyHops: number
): Promise<Response | null> {
	const forwardedFor = request.headers
		.get('x-forwarded-for')
		?.split(',')
		.map((value) => value.trim())
		.filter(Boolean);
	const forwardedIndex = (forwardedFor?.length ?? 0) - trustedProxyHops;
	const trustedForwardedIp =
		trustedProxyHops > 0 && forwardedIndex >= 0 ? forwardedFor?.[forwardedIndex] : undefined;
	const ip = trustedForwardedIp || request.headers.get('x-sendenv-remote-address') || '127.0.0.1';
	const key = createHash('sha256').update(ip).digest('hex');
	const result = await rateLimiter.limit(key);

	if (result.success) return null;

	return new Response('Too many requests', {
		status: 429,
		headers: {
			...noStoreHeaders(),
			'X-RateLimit-Limit': '5',
			'X-RateLimit-Remaining': result.remaining.toString(),
			'X-RateLimit-Reset': result.reset.toString(),
			'Retry-After': Math.ceil(result.retry_after / 1000).toString()
		}
	});
}

function json(body: unknown, status: number): Response {
	return Response.json(body, {
		status,
		headers: noStoreHeaders()
	});
}

function noStoreHeaders(): Record<string, string> {
	return {
		'Cache-Control': 'no-store',
		Pragma: 'no-cache'
	};
}
