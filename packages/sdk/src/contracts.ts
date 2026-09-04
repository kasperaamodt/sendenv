export const PROTOCOL_VERSION = 1 as const;
export const EXPIRATION_HOURS = [1, 3, 6, 12, 24] as const;

export type ExpirationHours = (typeof EXPIRATION_HOURS)[number];

export interface CreateSecretRequest {
	version: typeof PROTOCOL_VERSION;
	contentId: string;
	ciphertext: string;
	accessVerifier: string;
	expiresInHours: ExpirationHours;
}

export interface CreateSecretResponse {
	contentId: string;
	expiresAt: string;
}

export interface ConsumeSecretResponse {
	ciphertext: string;
}

export type SecretStatus = 'available' | 'consumed' | 'expired' | 'missing';

export interface SecretStatusResponse {
	status: SecretStatus;
}

export interface ApiErrorResponse {
	error: {
		code: string;
		message: string;
	};
}
