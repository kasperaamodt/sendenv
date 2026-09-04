import { createHash } from 'node:crypto';

import { cors } from '@elysiajs/cors';
import { openapi } from '@elysiajs/openapi';
import {
	EXPIRATION_HOURS,
	MAX_ENCRYPTED_SECRET_LENGTH,
	PROTOCOL_VERSION
} from '@sendenv/sdk/protocol';
import { Elysia, t } from 'elysia';

import type { SecretStore } from './modules/secrets/store.ts';

const CONTENT_ID_PATTERN = '^[a-f0-9]{32}$';
const CIPHERTEXT_PATTERN = '^v1\\.[A-Za-z0-9_-]+$';
const DIGEST_PATTERN = '^[A-Za-z0-9_-]{43}$';
const ACCESS_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store', Pragma: 'no-cache' };

const errorSchema = t.Object({
	error: t.Object({
		code: t.String(),
		message: t.String()
	})
});

const createBodySchema = t.Object(
	{
		version: t.Literal(PROTOCOL_VERSION),
		contentId: t.String({ pattern: CONTENT_ID_PATTERN }),
		ciphertext: t.String({ pattern: CIPHERTEXT_PATTERN }),
		accessVerifier: t.String({ pattern: DIGEST_PATTERN }),
		expiresInHours: t.UnionEnum(EXPIRATION_HOURS)
	},
	{ additionalProperties: false }
);

export interface RateLimiter {
	limit(key: string): Promise<{
		success: boolean;
		remaining: number;
		reset: number;
		retry_after: number;
	}>;
}

interface ApiDependencies {
	store: SecretStore;
	rateLimiter: RateLimiter;
	allowedOrigins?: string[];
	healthCheck?: () => Promise<void>;
	now?: () => Date;
	trustedProxyHops?: number;
}

export function createApi({
	store,
	rateLimiter,
	allowedOrigins = [],
	healthCheck = async () => {},
	now = () => new Date(),
	trustedProxyHops = 0
}: ApiDependencies) {
	return new Elysia({ name: 'sendenv-api' })
		.use(
			cors({
				origin: (request) => {
					const origin = request.headers.get('origin');
					return origin ? allowedOrigins.includes(origin) : false;
				},
				methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
				allowedHeaders: ['Authorization', 'Content-Type'],
				exposeHeaders: [
					'Location',
					'Retry-After',
					'X-RateLimit-Limit',
					'X-RateLimit-Remaining',
					'X-RateLimit-Reset'
				],
				credentials: false,
				maxAge: 3600
			})
		)
		.use(
			openapi({
				documentation: {
					info: {
						title: 'Sendenv API',
						version: '1.0.0',
						description:
							'Create and consume end-to-end encrypted, one-time secrets. Plaintext and root keys never belong in API requests.'
					},
					tags: [
						{ name: 'Secrets', description: 'Encrypted one-time secret operations' },
						{ name: 'System', description: 'Service health and metadata' }
					],
					components: {
						securitySchemes: {
							secretAccess: {
								type: 'http',
								scheme: 'bearer',
								bearerFormat: 'base64url HKDF access token'
							}
						}
					}
				}
			})
		)
		.onRequest(async ({ request, set, status }) => {
			const scope = getRateLimitScope(request);
			if (!scope) return;

			const limited = await limitRequest(request, rateLimiter, trustedProxyHops, scope);
			if (!limited) return;

			set.headers['x-ratelimit-limit'] = '5';
			set.headers['x-ratelimit-remaining'] = limited.remaining.toString();
			set.headers['x-ratelimit-reset'] = limited.reset.toString();
			set.headers['retry-after'] = Math.ceil(limited.retry_after / 1000).toString();
			return status(429, errorBody('RATE_LIMITED', 'Too many requests. Try again later.'));
		})
		.onError(({ code, error, set }) => {
			set.headers['cache-control'] = NO_STORE_HEADERS['Cache-Control'];
			set.headers.pragma = NO_STORE_HEADERS.Pragma;

			if (code === 'VALIDATION' || code === 'PARSE') {
				set.status = 400;
				return errorBody('INVALID_REQUEST', 'The request is invalid.');
			}
			if (code === 'NOT_FOUND') {
				set.status = 404;
				return errorBody('NOT_FOUND', 'Not found.');
			}

			console.error('Unhandled API error:', error);
			set.status = 500;
			return errorBody('INTERNAL_ERROR', 'The request could not be completed.');
		})
		.onAfterHandle(({ set }) => {
			set.headers['cache-control'] = NO_STORE_HEADERS['Cache-Control'];
			set.headers.pragma = NO_STORE_HEADERS.Pragma;
		})
		.get('/', () => ({ name: 'Sendenv API', documentation: '/openapi' }), {
			response: t.Object({ name: t.String(), documentation: t.String() }),
			detail: { tags: ['System'], summary: 'API metadata' }
		})
		.get(
			'/health',
			async ({ status }) => {
				try {
					await healthCheck();
					return new Response(null, { status: 204 });
				} catch {
					return status(503, errorBody('SERVICE_UNAVAILABLE', 'Service is not ready.'));
				}
			},
			{
				response: { 204: t.Void(), 503: errorSchema },
				detail: { tags: ['System'], summary: 'Readiness check' }
			}
		)
		.post(
			'/v1/secrets',
			async ({ body, set, status }) => {
				if (body.ciphertext.length > MAX_ENCRYPTED_SECRET_LENGTH) {
					return status(
						413,
						errorBody('SECRET_TOO_LARGE', 'Secret is too large. Shorten it and try again.')
					);
				}

				const accessVerifier = Buffer.from(body.accessVerifier, 'base64url');
				if (accessVerifier.length !== 32) {
					return status(400, errorBody('INVALID_REQUEST', 'The request is invalid.'));
				}

				const expiresAt = new Date(
					Math.floor((now().getTime() + body.expiresInHours * 60 * 60 * 1000) / 1000) * 1000
				);
				const created = await store.create({
					contentId: body.contentId,
					ciphertext: body.ciphertext,
					accessVerifier,
					expiresAt
				});
				if (!created) {
					return status(
						409,
						errorBody('CONTENT_ID_CONFLICT', 'A secret with this ID already exists.')
					);
				}

				set.headers.location = `/v1/secrets/${body.contentId}/consume`;
				return status(201, { contentId: body.contentId, expiresAt: expiresAt.toISOString() });
			},
			{
				parse: 'json',
				body: createBodySchema,
				response: {
					201: t.Object({ contentId: t.String(), expiresAt: t.String({ format: 'date-time' }) }),
					400: errorSchema,
					409: errorSchema,
					413: errorSchema,
					429: errorSchema,
					500: errorSchema
				},
				detail: {
					tags: ['Secrets'],
					summary: 'Create an encrypted secret',
					description:
						'The client encrypts the plaintext and sends only ciphertext plus an access verifier.'
				}
			}
		)
		.head(
			'/v1/secrets/:contentId/consume',
			async ({ params, request, set, status }) => {
				const accessVerifier = getAccessVerifier(request);
				if (!accessVerifier) {
					set.headers['www-authenticate'] = 'Bearer realm="sendenv-secret"';
					return status(
						401,
						errorBody('INVALID_ACCESS_TOKEN', 'A valid access token is required.')
					);
				}

				if (!(await store.available(params.contentId, accessVerifier, now()))) {
					return status(
						404,
						errorBody('SECRET_NOT_FOUND', 'Secret not found or already consumed.')
					);
				}

				return new Response(null, { status: 204 });
			},
			{
				params: t.Object({ contentId: t.String({ pattern: CONTENT_ID_PATTERN }) }),
				response: {
					204: t.Void(),
					400: errorSchema,
					401: errorSchema,
					404: errorSchema,
					429: errorSchema,
					500: errorSchema
				},
				detail: {
					tags: ['Secrets'],
					summary: 'Check whether an encrypted secret can be consumed',
					security: [{ secretAccess: [] }]
				}
			}
		)
		.post(
			'/v1/secrets/:contentId/consume',
			async ({ params, request, set, status }) => {
				const accessVerifier = getAccessVerifier(request);
				if (!accessVerifier) {
					set.headers['www-authenticate'] = 'Bearer realm="sendenv-secret"';
					return status(
						401,
						errorBody('INVALID_ACCESS_TOKEN', 'A valid access token is required.')
					);
				}

				const ciphertext = await store.consume(params.contentId, accessVerifier, now());
				if (ciphertext === null) {
					return status(
						404,
						errorBody('SECRET_NOT_FOUND', 'Secret not found or already consumed.')
					);
				}

				return { ciphertext };
			},
			{
				params: t.Object({ contentId: t.String({ pattern: CONTENT_ID_PATTERN }) }),
				response: {
					200: t.Object({ ciphertext: t.String() }),
					400: errorSchema,
					401: errorSchema,
					404: errorSchema,
					429: errorSchema,
					500: errorSchema
				},
				detail: {
					tags: ['Secrets'],
					summary: 'Consume an encrypted secret once',
					security: [{ secretAccess: [] }]
				}
			}
		);
}

function getRateLimitScope(request: Request): 'availability' | 'create' | 'consume' | null {
	const pathname = new URL(request.url).pathname;
	if (request.method === 'POST' && pathname === '/v1/secrets') return 'create';
	if (!/^\/v1\/secrets\/[^/]+\/consume$/.test(pathname)) return null;
	if (request.method === 'HEAD') return 'availability';
	return request.method === 'POST' ? 'consume' : null;
}

async function limitRequest(
	request: Request,
	rateLimiter: RateLimiter,
	trustedProxyHops: number,
	scope: 'availability' | 'create' | 'consume'
): Promise<Awaited<ReturnType<RateLimiter['limit']>> | null> {
	const forwardedFor = request.headers
		.get('x-forwarded-for')
		?.split(',')
		.map((value) => value.trim())
		.filter(Boolean);
	const forwardedIndex = (forwardedFor?.length ?? 0) - trustedProxyHops;
	const trustedForwardedIp =
		trustedProxyHops > 0 && forwardedIndex >= 0 ? forwardedFor?.[forwardedIndex] : undefined;
	const ip = trustedForwardedIp || request.headers.get('x-sendenv-remote-address') || '127.0.0.1';
	const key = createHash('sha256').update(`${scope}:${ip}`).digest('hex');
	const result = await rateLimiter.limit(key);

	return result.success ? null : result;
}

function getAccessVerifier(request: Request): Buffer | null {
	const authorization = request.headers.get('authorization');
	const accessToken = authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
	if (!accessToken || !ACCESS_TOKEN_PATTERN.test(accessToken)) return null;

	const accessTokenBytes = Buffer.from(accessToken, 'base64url');
	if (accessTokenBytes.length !== 32) return null;
	return createHash('sha256').update(accessTokenBytes).digest();
}

function errorBody(code: string, message: string) {
	return { error: { code, message } };
}
