import type {
	ApiErrorResponse,
	ConsumeSecretResponse,
	CreateSecretRequest,
	CreateSecretResponse,
	SecretStatus,
	SecretStatusResponse
} from './contracts.js';

export class ApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
		readonly code: string
	) {
		super(message);
		this.name = 'ApiError';
	}
}

export function create_api_client(base_url: string) {
	const base = base_url.replace(/\/$/, '');

	return {
		async create_secret(body: CreateSecretRequest, signal?: AbortSignal) {
			const response = await fetch(`${base}/v1/secrets`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
				signal
			});

			if (!response.ok) throw await to_api_error(response);
			return (await response.json()) as CreateSecretResponse;
		},

		async consume_secret(content_id: string, access_token: string, signal?: AbortSignal) {
			const response = await fetch(`${base}/v1/secrets/${encodeURIComponent(content_id)}/consume`, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					Authorization: `Bearer ${access_token}`
				},
				signal
			});

			if (!response.ok) throw await to_api_error(response);
			return (await response.json()) as ConsumeSecretResponse;
		},

		async get_secret_status(content_id: string, signal?: AbortSignal) {
			const response = await fetch(`${base}/v1/secrets/${encodeURIComponent(content_id)}`, {
				method: 'GET',
				headers: { Accept: 'application/json' },
				signal
			});

			if (!response.ok) throw await to_api_error(response);
			const body = (await response.json()) as Partial<SecretStatusResponse>;
			if (!is_secret_status(body.status)) {
				throw new ApiError(
					'The API returned an invalid secret status.',
					response.status,
					'API_ERROR'
				);
			}

			return { status: body.status } satisfies SecretStatusResponse;
		}
	};
}

function is_secret_status(value: unknown): value is SecretStatus {
	return (
		value === 'available' || value === 'consumed' || value === 'expired' || value === 'missing'
	);
}

async function to_api_error(response: Response): Promise<ApiError> {
	try {
		const body = (await response.json()) as Partial<ApiErrorResponse>;
		if (body.error?.message) {
			return new ApiError(body.error.message, response.status, body.error.code ?? 'API_ERROR');
		}
	} catch {
		// Fall back to a stable message when a proxy or upstream returns a non-JSON error.
	}

	return new ApiError(
		'The request could not be completed. Try again.',
		response.status,
		'API_ERROR'
	);
}
